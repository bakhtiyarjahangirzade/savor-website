(function () {
  "use strict";

  const DB_NAME = "savor-cms-preview";
  const DB_VERSION = 1;
  const SESSION_KEY = "savor-cms-session";
  let dbPromise;

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Database request failed"));
    });
  }

  function openDatabase() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("documents")) db.createObjectStore("documents", { keyPath: "key" });
        if (!db.objectStoreNames.contains("users")) {
          const users = db.createObjectStore("users", { keyPath: "id" });
          users.createIndex("email", "email", { unique: true });
        }
        if (!db.objectStoreNames.contains("logs")) {
          const logs = db.createObjectStore("logs", { keyPath: "id" });
          logs.createIndex("createdAt", "createdAt");
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Could not open preview database"));
    });
    return dbPromise;
  }

  async function storeRequest(storeName, mode, callback) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      let request;
      try {
        request = callback(store);
      } catch (error) {
        reject(error);
        return;
      }
      transaction.oncomplete = () => resolve(request ? request.result : undefined);
      transaction.onerror = () => reject(transaction.error || request?.error || new Error("Database transaction failed"));
      transaction.onabort = () => reject(transaction.error || new Error("Database transaction was cancelled"));
    });
  }

  async function get(storeName, key) {
    const db = await openDatabase();
    const transaction = db.transaction(storeName, "readonly");
    return requestResult(transaction.objectStore(storeName).get(key));
  }

  async function getAll(storeName) {
    const db = await openDatabase();
    const transaction = db.transaction(storeName, "readonly");
    return requestResult(transaction.objectStore(storeName).getAll());
  }

  const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
  const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
  const uuid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  function bytesToBase64(bytes) {
    let binary = "";
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  }

  async function passwordHash(password, salt) {
    const data = new TextEncoder().encode(`${salt}:${password}`);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return bytesToBase64(new Uint8Array(digest));
  }

  function newSalt() {
    const bytes = new Uint8Array(18);
    crypto.getRandomValues(bytes);
    return bytesToBase64(bytes);
  }

  async function sessionUser() {
    const id = sessionStorage.getItem(SESSION_KEY);
    if (!id) return null;
    const user = await get("users", id);
    if (!user || !user.active) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return user;
  }

  async function requireUser(primaryOnly = false) {
    const user = await sessionUser();
    if (!user) throw new Error("Oturum bulunamadı.");
    if (primaryOnly && !user.isPrimary) throw new Error("Bu işlem yalnızca ana admin tarafından yapılabilir.");
    return user;
  }

  async function addLog({ actor, action, entityType, entityId, before = null, after = null, details = null }) {
    const record = {
      id: uuid(),
      actorId: actor?.id || null,
      actorEmail: actor?.email || "system",
      actorName: actor?.name || "System",
      action,
      entityType,
      entityId: String(entityId || ""),
      before: clone(before),
      after: clone(after),
      details: clone(details),
      createdAt: new Date().toISOString()
    };
    await storeRequest("logs", "readwrite", (store) => store.put(record));
    return record;
  }

  async function users() {
    return (await getAll("users")).sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.name.localeCompare(b.name));
  }

  async function hasUsers() {
    return (await users()).length > 0;
  }

  async function createPrimaryAdmin({ name, email, password }) {
    if (await hasUsers()) throw new Error("Ana admin daha önce oluşturulmuş.");
    if (String(password || "").length < 6) throw new Error("Şifre en az 6 karakter olmalıdır.");
    const salt = newSalt();
    const user = {
      id: uuid(),
      name: String(name || "Ana Admin").trim() || "Ana Admin",
      email: normalizeEmail(email),
      role: "head_admin",
      isPrimary: true,
      active: true,
      salt,
      passwordHash: await passwordHash(password, salt),
      createdAt: new Date().toISOString()
    };
    if (!user.email) throw new Error("E-posta gereklidir.");
    await storeRequest("users", "readwrite", (store) => store.add(user));
    sessionStorage.setItem(SESSION_KEY, user.id);
    await addLog({ actor: user, action: "admin.primary_created", entityType: "admin", entityId: user.id, after: publicUser(user) });
    return user;
  }

  async function authenticate(email, password) {
    const normalized = normalizeEmail(email);
    const user = (await users()).find((item) => item.email === normalized && item.active);
    if (!user) throw new Error("E-posta veya şifre yanlış.");
    const candidate = await passwordHash(password, user.salt);
    if (candidate !== user.passwordHash) throw new Error("E-posta veya şifre yanlış.");
    sessionStorage.setItem(SESSION_KEY, user.id);
    await addLog({ actor: user, action: "auth.login", entityType: "session", entityId: user.id });
    return user;
  }

  async function logout() {
    const user = await sessionUser();
    if (user) await addLog({ actor: user, action: "auth.logout", entityType: "session", entityId: user.id });
    sessionStorage.removeItem(SESSION_KEY);
  }

  function publicUser(user) {
    if (!user) return null;
    const { salt, passwordHash, ...safe } = user;
    return safe;
  }

  async function createAdmin({ name, email, password, role = "admin" }) {
    const actor = await requireUser(true);
    const normalized = normalizeEmail(email);
    if ((await users()).some((item) => item.email === normalized)) throw new Error("Bu e-posta zaten kayıtlı.");
    if (String(password || "").length < 6) throw new Error("Şifre en az 6 karakter olmalıdır.");
    const salt = newSalt();
    const user = {
      id: uuid(),
      name: String(name || "Admin").trim() || "Admin",
      email: normalized,
      role: role === "editor" ? "editor" : "admin",
      isPrimary: false,
      active: true,
      salt,
      passwordHash: await passwordHash(password, salt),
      createdAt: new Date().toISOString()
    };
    await storeRequest("users", "readwrite", (store) => store.add(user));
    await addLog({ actor, action: "admin.created", entityType: "admin", entityId: user.id, after: publicUser(user) });
    return user;
  }

  async function updateAdmin(id, changes) {
    const actor = await requireUser(true);
    const existing = await get("users", id);
    if (!existing) throw new Error("Admin bulunamadı.");
    if (existing.isPrimary && (changes.active === false || changes.role && changes.role !== "head_admin")) throw new Error("Ana admin kapatılamaz veya rolü değiştirilemez.");
    const updated = { ...existing };
    if (changes.name != null) updated.name = String(changes.name).trim() || updated.name;
    if (!existing.isPrimary && changes.role) updated.role = changes.role === "editor" ? "editor" : "admin";
    if (!existing.isPrimary && changes.active != null) updated.active = Boolean(changes.active);
    if (changes.password) {
      if (String(changes.password).length < 6) throw new Error("Şifre en az 6 karakter olmalıdır.");
      updated.salt = newSalt();
      updated.passwordHash = await passwordHash(changes.password, updated.salt);
    }
    await storeRequest("users", "readwrite", (store) => store.put(updated));
    await addLog({ actor, action: "admin.updated", entityType: "admin", entityId: id, before: publicUser(existing), after: publicUser(updated) });
    return updated;
  }

  async function deleteAdmin(id) {
    const actor = await requireUser(true);
    const target = await get("users", id);
    if (!target) return;
    if (target.isPrimary) throw new Error("Ana admin silinemez.");
    await storeRequest("users", "readwrite", (store) => store.delete(id));
    await addLog({ actor, action: "admin.deleted", entityType: "admin", entityId: id, before: publicUser(target) });
  }

  async function document(key) {
    const row = await get("documents", key);
    return row ? clone(row.data) : null;
  }

  async function saveDocument(key, data) {
    const actor = await requireUser();
    const existing = await get("documents", key);
    const row = { key, data: clone(data), updatedAt: new Date().toISOString(), updatedBy: actor.id };
    await storeRequest("documents", "readwrite", (store) => store.put(row));
    await addLog({ actor, action: existing ? "content.updated" : "content.created", entityType: "document", entityId: key, before: existing?.data || null, after: row.data });
    window.dispatchEvent(new CustomEvent("savor-cms-updated", { detail: { key } }));
    return clone(row.data);
  }

  async function importDefaults(basePath = "content") {
    const actor = await requireUser();
    const keys = ["site", "products", "recipes"];
    let imported = false;
    for (const key of keys) {
      if (await document(key)) continue;
      const response = await fetch(`${basePath}/${key}.json`, { cache: "no-store" });
      if (!response.ok) throw new Error(`${key}.json okunamadı.`);
      const data = await response.json();
      await storeRequest("documents", "readwrite", (store) => store.put({ key, data, updatedAt: new Date().toISOString(), updatedBy: actor.id }));
      imported = true;
    }
    if (imported) await addLog({ actor, action: "content.defaults_imported", entityType: "system", entityId: "bootstrap" });
  }

  async function importContent(payload) {
    const actor = await requireUser();
    if (!payload || typeof payload !== "object") throw new Error("Geçersiz yedek dosyası.");
    const docs = payload.documents || payload;
    for (const key of ["site", "products", "recipes"]) {
      if (docs[key] == null) throw new Error(`Yedekte ${key} içeriği bulunamadı.`);
    }
    for (const key of ["site", "products", "recipes"]) {
      const existing = await get("documents", key);
      await storeRequest("documents", "readwrite", (store) => store.put({ key, data: clone(docs[key]), updatedAt: new Date().toISOString(), updatedBy: actor.id }));
      await addLog({ actor, action: "content.imported", entityType: "document", entityId: key, before: existing?.data || null, after: docs[key] });
    }
  }

  async function exportContent() {
    const result = {};
    for (const key of ["site", "products", "recipes"]) result[key] = await document(key);
    return { format: "savor-cms-content", version: 1, exportedAt: new Date().toISOString(), documents: result };
  }

  async function logs() {
    return (await getAll("logs")).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async function deleteLog(id) {
    const actor = await requireUser(true);
    const target = await get("logs", id);
    if (!target) return;
    await storeRequest("logs", "readwrite", (store) => store.delete(id));
    await addLog({ actor, action: "audit.deleted", entityType: "audit", entityId: id, details: { deletedAction: target.action, deletedAt: target.createdAt } });
  }

  async function clearLogs() {
    const actor = await requireUser(true);
    await storeRequest("logs", "readwrite", (store) => store.clear());
    await addLog({ actor, action: "audit.cleared", entityType: "audit", entityId: "all" });
  }

  window.SavorCMS = {
    authenticate,
    clearLogs,
    createAdmin,
    createPrimaryAdmin,
    deleteAdmin,
    deleteLog,
    document,
    exportContent,
    hasUsers,
    importContent,
    importDefaults,
    logs,
    logout,
    publicUser,
    saveDocument,
    sessionUser,
    updateAdmin,
    users
  };
})();
