(function () {
  "use strict";

  const CMS = window.SavorCMS;
  const LANGS = [
    { key: "az", label: "Azərbaycan" },
    { key: "ru", label: "Русский" },
    { key: "en", label: "English" }
  ];

  const loadingScreen = document.getElementById("loading-screen");
  const setupScreen = document.getElementById("setup-screen");
  const loginScreen = document.getElementById("login-screen");
  const adminApp = document.getElementById("admin-app");
  const panel = document.getElementById("panel");
  const toastElement = document.getElementById("toast");
  const sidebar = document.querySelector(".sidebar");
  const imageInput = document.getElementById("image-file");
  const backupInput = document.getElementById("backup-file");
  const cropDialog = document.getElementById("crop-dialog");
  const cropSource = document.getElementById("crop-source");
  const cropStage = document.getElementById("crop-stage");
  const cropRatio = document.getElementById("crop-ratio");

  let currentUser = null;
  let currentSection = "site";
  let currentData = null;
  let dirty = false;
  let cropper = null;
  let cropTargetPath = "";
  let cropDefaultRatio = "free";
  let toastTimer;

  const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  const pathString = (parts) => parts.join(".");

  function getPath(object, path) {
    return String(path).split(".").filter(Boolean).reduce((value, key) => value == null ? undefined : value[key], object);
  }

  function setPath(object, path, value) {
    const keys = String(path).split(".").filter(Boolean);
    let cursor = object;
    keys.slice(0, -1).forEach((key, index) => {
      if (cursor[key] == null || typeof cursor[key] !== "object") cursor[key] = /^\d+$/.test(keys[index + 1]) ? [] : {};
      cursor = cursor[key];
    });
    cursor[keys[keys.length - 1]] = value;
  }

  function removePathItem(object, path, index) {
    const list = getPath(object, path);
    if (Array.isArray(list)) list.splice(index, 1);
  }

  function showToast(message, isError = false) {
    clearTimeout(toastTimer);
    toastElement.textContent = message;
    toastElement.className = `toast show${isError ? " error" : ""}`;
    toastTimer = setTimeout(() => { toastElement.className = "toast"; }, 3200);
  }

  function humanRole(user) {
    if (user?.isPrimary) return "Ana admin";
    return user?.role === "editor" ? "Editör" : "Admin";
  }

  function resolveImage(value) {
    if (!value) return "";
    if (/^(data:|blob:|https?:)/.test(value)) return value;
    return `../${String(value).replace(/^\//, "")}`;
  }

  const localized = (key, label, input = "text", options = {}) => ({ key, label, type: "localized", input, ...options });
  const text = (key, label, options = {}) => ({ key, label, type: options.textarea ? "textarea" : "text", ...options });
  const number = (key, label) => ({ key, label, type: "number" });
  const checkbox = (key, label) => ({ key, label, type: "checkbox" });
  const group = (key, label, fields) => ({ key, label, type: "group", fields });
  const objectList = (key, label, fields, makeItem) => ({ key, label, type: "objectList", fields, makeItem });

  const siteSchema = [
    group("settings", "Genel bilgiler", [
      text("siteName", "Marka adı"), text("phone", "Telefon"), text("email", "E-posta"), localized("footerText", "Footer metni", "textarea")
    ]),
    group("home", "Ana sayfa", [
      group("hero", "Giriş alanı", [
        localized("eyebrow", "Küçük başlık"), localized("title", "Ana başlık"), localized("description", "Açıklama", "textarea"),
        localized("image", "Arka plan görseli", "image", { ratio: 16 / 9 }), localized("imageAlt", "Görsel açıklaması")
      ]),
      group("story", "Kısa marka hikâyesi", [localized("eyebrow", "Küçük başlık"), localized("title", "Başlık"), localized("text", "Metin", "textarea")]),
      objectList("highlights", "Rakamlı avantajlar", [text("value", "Değer"), localized("label", "Açıklama")], () => ({ value: "", label: { az: "", ru: "", en: "" } }))
    ]),
    group("recipesPage", "Tarifler sayfası", [localized("eyebrow", "Küçük başlık"), localized("title", "Başlık"), localized("intro", "Giriş metni", "textarea")]),
    group("about", "Hakkımızda sayfası", [
      localized("eyebrow", "Küçük başlık"), localized("title", "Ana başlık"), localized("intro", "Giriş metni", "textarea"),
      localized("storyTitle", "Hikâye başlığı"), localized("storyText", "Hikâye metni", "textarea"),
      localized("image", "Hakkımızda görseli", "image", { ratio: 4 / 3 }),
      objectList("values", "Değerler", [localized("title", "Başlık"), localized("text", "Metin", "textarea")], () => ({ title: { az: "", ru: "", en: "" }, text: { az: "", ru: "", en: "" } }))
    ]),
    group("buy", "Satış noktaları", [
      localized("eyebrow", "Küçük başlık"), localized("title", "Başlık"), localized("intro", "Giriş metni", "textarea"),
      localized("retailTitle", "Perakende başlığı"), localized("retailText", "Perakende metni", "textarea"),
      localized("wholesaleTitle", "Toptan satış başlığı"), localized("wholesaleText", "Toptan satış metni", "textarea"),
      localized("contactPlaceholder", "İletişim bilgisi yoksa gösterilecek metin", "textarea"),
      objectList("locations", "Mağaza ve satış noktaları", [text("name", "Mağaza / zincir adı"), text("address", "Adres")], () => ({ name: "", address: "" }))
    ])
  ];

  const productSchema = [
    text("slug", "URL adı"), number("order", "Sıra"), checkbox("featured", "Ana sayfada öne çıkar"), text("weight", "Ağırlık"),
    localized("name", "Ürün adı"), localized("shortDescription", "Kısa açıklama", "textarea"), localized("description", "Tam açıklama", "textarea"),
    localized("bestFor", "Kullanım alanı"), localized("image", "Ürün görseli", "image", { ratio: 1 })
  ];

  const recipeSchema = [
    text("slug", "URL adı"), checkbox("featured", "Öne çıkan tarif"), localized("category", "Kategori"), localized("title", "Tarif adı"),
    localized("intro", "Kısa açıklama", "textarea"), number("prepMinutes", "Hazırlık süresi (dk)"), number("cookMinutes", "Pişirme süresi (dk)"),
    localized("image", "Tarif görseli", "image", { ratio: 4 / 3 }), localized("ingredients", "Malzemeler — her satıra bir madde", "list"),
    localized("steps", "Hazırlama adımları — her satıra bir adım", "list"), { key: "productSlugs", label: "İlgili ürün URL adları — virgülle ayırın", type: "stringList" }
  ];

  function fieldInput(field, path, value) {
    const pathAttr = escapeHtml(path);
    if (field.type === "checkbox") {
      return `<label class="switch-field"><input type="checkbox" data-input-path="${pathAttr}" data-value-type="boolean" ${value ? "checked" : ""} /> ${escapeHtml(field.label)}</label>`;
    }
    const type = field.type === "number" ? "number" : "text";
    if (field.type === "textarea") {
      return `<label class="field">${escapeHtml(field.label)}<textarea data-input-path="${pathAttr}">${escapeHtml(value || "")}</textarea></label>`;
    }
    if (field.type === "stringList") {
      return `<label class="field">${escapeHtml(field.label)}<input data-input-path="${pathAttr}" data-value-type="stringList" value="${escapeHtml((value || []).join(", "))}" /></label>`;
    }
    return `<label class="field">${escapeHtml(field.label)}<input type="${type}" data-input-path="${pathAttr}" data-value-type="${type}" value="${escapeHtml(value ?? "")}" /></label>`;
  }

  function imageField(path, value, field) {
    const src = resolveImage(value);
    return `<div class="image-field">
      <div class="image-preview">${src ? `<img src="${escapeHtml(src)}" alt="" />` : "Görsel seçilmedi"}</div>
      <div class="image-actions">
        <button class="button secondary small" type="button" data-action="choose-image" data-path="${escapeHtml(path)}" data-ratio="${field.ratio || "free"}">Seç ve kırp</button>
        ${value ? `<button class="button secondary small" type="button" data-action="clear-image" data-path="${escapeHtml(path)}">Kaldır</button>` : ""}
      </div>
    </div>`;
  }

  function renderLocalized(field, basePath, value = {}) {
    return `<div class="localized"><span class="localized-title">${escapeHtml(field.label)}</span><div class="localized-grid">${LANGS.map((lang) => {
      const path = pathString([...basePath, field.key, lang.key]);
      const langValue = value?.[lang.key] ?? "";
      let control;
      if (field.input === "image") control = imageField(path, langValue, field);
      else if (field.input === "textarea" || field.input === "list") {
        const textValue = field.input === "list" ? (Array.isArray(langValue) ? langValue.join("\n") : "") : langValue;
        control = `<textarea data-input-path="${escapeHtml(path)}" data-value-type="${field.input === "list" ? "lineList" : "text"}">${escapeHtml(textValue)}</textarea>`;
      } else control = `<input data-input-path="${escapeHtml(path)}" value="${escapeHtml(langValue)}" />`;
      return `<div class="language-field"><span>${escapeHtml(lang.label)}</span>${control}</div>`;
    }).join("")}</div></div>`;
  }

  function renderFields(fields, basePath, object) {
    const simple = [];
    const blocks = [];
    fields.forEach((field) => {
      const value = object?.[field.key];
      const nextPath = [...basePath, field.key];
      if (field.type === "localized") blocks.push(renderLocalized(field, basePath, value));
      else if (field.type === "group") blocks.push(`<section class="content-card"><h2>${escapeHtml(field.label)}</h2>${renderFields(field.fields, nextPath, value || {})}</section>`);
      else if (field.type === "objectList") blocks.push(renderObjectList(field, nextPath, value || []));
      else simple.push(fieldInput(field, pathString(nextPath), value));
    });
    const grid = simple.length ? `<div class="field-grid">${simple.join("")}</div>` : "";
    return `${grid}${blocks.join("")}`;
  }

  function renderObjectList(field, path, list) {
    const pathAttr = escapeHtml(pathString(path));
    return `<section class="content-card"><div class="list-toolbar"><h2>${escapeHtml(field.label)}</h2><button class="button secondary small" type="button" data-action="add-object" data-path="${pathAttr}">＋ Ekle</button></div>
      <div class="nested-list">${list.length ? list.map((item, index) => `<div class="nested-item">${renderFields(field.fields, [...path, String(index)], item)}<div class="item-footer"><button class="button danger small" type="button" data-action="remove-object" data-path="${pathAttr}" data-index="${index}">Sil</button></div></div>`).join("") : `<div class="empty-state">Henüz kayıt yok.</div>`}</div></section>`;
  }

  function panelHead(eyebrow, title, actions = "") {
    return `<header class="panel-head"><div><p class="eyebrow">${escapeHtml(eyebrow)}</p><h1>${escapeHtml(title)}</h1></div><div class="panel-actions">${actions}</div></header>`;
  }

  function saveButton() {
    return `<a class="button secondary" href="../index.html" target="_blank">Siteyi gör</a><button class="button primary" type="button" data-action="save-document">Kaydet</button>`;
  }

  async function loadDocumentSection(key) {
    currentData = await CMS.document(key);
    if (currentData == null) {
      await CMS.importDefaults("../content");
      currentData = await CMS.document(key);
    }
    dirty = false;
  }

  async function renderSite(reload = true) {
    if (reload) await loadDocumentSection("site");
    panel.innerHTML = `${panelHead("SİTE İÇERİĞİ", "Ana sayfa ve metinler", saveButton())}<div class="notice">AZ, RU ve EN alanlarını yan yana düzenleyebilirsiniz. Görseller her dil için ayrı seçilebilir.</div>${renderFields(siteSchema, [], currentData)}`;
  }

  function defaultProduct() {
    return { slug: `yeni-urun-${Date.now()}`, order: (currentData?.length || 0) + 1, featured: false, weight: "", name: { az: "Yeni məhsul", ru: "Новый продукт", en: "New product" }, shortDescription: { az: "", ru: "", en: "" }, description: { az: "", ru: "", en: "" }, bestFor: { az: "", ru: "", en: "" }, image: { az: "", ru: "", en: "" } };
  }

  function defaultRecipe() {
    return { slug: `yeni-resept-${Date.now()}`, featured: false, category: { az: "", ru: "", en: "" }, title: { az: "Yeni resept", ru: "Новый рецепт", en: "New recipe" }, intro: { az: "", ru: "", en: "" }, prepMinutes: 0, cookMinutes: 0, image: { az: "", ru: "", en: "" }, ingredients: { az: [], ru: [], en: [] }, steps: { az: [], ru: [], en: [] }, productSlugs: [] };
  }

  async function renderCollection(key, title, schema, makeItem, reload = true) {
    if (reload) await loadDocumentSection(key);
    const items = Array.isArray(currentData) ? currentData : [];
    panel.innerHTML = `${panelHead("İÇERİK YÖNETİMİ", title, `${saveButton()}<button class="button secondary" type="button" data-action="add-collection" data-key="${key}">＋ Yeni ekle</button>`)}
      <div class="item-list">${items.map((item, index) => {
        const summary = item.name?.az || item.title?.az || item.slug || `Kayıt ${index + 1}`;
        return `<details class="item-card" ${index === 0 ? "open" : ""}><summary class="item-summary"><strong>${escapeHtml(summary)}</strong><span>${escapeHtml(item.weight || item.category?.az || item.slug || "")}</span></summary><div class="item-body">${renderFields(schema, [String(index)], item)}<div class="item-footer"><button class="button danger small" type="button" data-action="remove-collection" data-index="${index}">Bu kaydı sil</button></div></div></details>`;
      }).join("") || `<div class="content-card empty-state">Henüz kayıt yok. “Yeni ekle” düğmesini kullanın.</div>`}</div>`;
    panel.dataset.makeItem = key;
    panel._makeItem = makeItem;
  }

  async function renderAdmins() {
    const allUsers = await CMS.users();
    currentData = null;
    const form = currentUser.isPrimary ? `<section class="content-card"><h2>Yeni admin ekle</h2><form id="new-admin-form" class="field-grid"><label class="field">Ad soyad<input name="name" required /></label><label class="field">E-posta<input name="email" type="email" required /></label><label class="field">Geçici şifre<input name="password" type="password" minlength="6" required /></label><label class="field">Rol<select name="role"><option value="admin">Admin</option><option value="editor">Editör</option></select></label><div><button class="button primary" type="submit">Admini ekle</button></div></form></section>` : `<div class="notice">Admin ekleme, silme ve rol değiştirme yalnızca ana admin hesabında açıktır.</div>`;
    panel.innerHTML = `${panelHead("YETKİLER", "Adminler")}${form}<section class="table-card"><table class="admin-table"><thead><tr><th>Kullanıcı</th><th>Rol</th><th>Durum</th><th>Oluşturma</th><th></th></tr></thead><tbody>${allUsers.map((user) => `<tr><td><strong>${escapeHtml(user.name)}</strong><br><span class="helper">${escapeHtml(user.email)}</span></td><td><span class="badge">${escapeHtml(humanRole(user))}</span></td><td><span class="badge ${user.active ? "green" : "red"}">${user.active ? "Aktif" : "Kapalı"}</span></td><td>${new Date(user.createdAt).toLocaleString("tr-TR")}</td><td>${currentUser.isPrimary && !user.isPrimary ? `<button class="button secondary small" type="button" data-action="toggle-admin" data-id="${user.id}" data-active="${user.active}">${user.active ? "Kapat" : "Aktifleştir"}</button> <button class="button danger small" type="button" data-action="delete-admin" data-id="${user.id}">Sil</button>` : ""}</td></tr>`).join("")}</tbody></table></section>`;
    document.getElementById("new-admin-form")?.addEventListener("submit", handleNewAdmin);
  }

  async function renderLogs() {
    const records = await CMS.logs();
    currentData = null;
    const clear = currentUser.isPrimary && records.length ? `<button class="button danger" type="button" data-action="clear-logs">Tüm logları sil</button>` : "";
    panel.innerHTML = `${panelHead("DENETİM", "İşlem kayıtları", clear)}<section class="table-card">${records.length ? `<table class="admin-table"><thead><tr><th>Tarih</th><th>Admin</th><th>İşlem</th><th>Detay</th><th></th></tr></thead><tbody>${records.map((log) => `<tr><td>${new Date(log.createdAt).toLocaleString("tr-TR")}</td><td>${escapeHtml(log.actorName)}<br><span class="helper">${escapeHtml(log.actorEmail)}</span></td><td><span class="badge">${escapeHtml(log.action)}</span><br>${escapeHtml(log.entityType)} · ${escapeHtml(log.entityId)}</td><td><details class="log-details"><summary>Değişikliği göster</summary><pre>${escapeHtml(JSON.stringify({ before: log.before, after: log.after, details: log.details }, null, 2))}</pre></details></td><td>${currentUser.isPrimary ? `<button class="button danger small" type="button" data-action="delete-log" data-id="${log.id}">Sil</button>` : ""}</td></tr>`).join("")}</tbody></table>` : `<div class="empty-state">Henüz işlem kaydı yok.</div>`}</section>`;
  }

  async function renderBackup() {
    currentData = null;
    panel.innerHTML = `${panelHead("TAŞINABİLİRLİK", "İçe / dışa aktar")}<div class="notice">Bu önizleme sürümünde veriler bu tarayıcıda saklanır. JSON yedeğini müşteriye veya web developera verebilirsiniz.</div><div class="backup-grid"><section class="backup-card"><h3>İçeriği dışa aktar</h3><p class="helper">Tüm sayfalar, ürünler, tarifler ve kırpılmış görseller tek JSON dosyasına eklenir.</p><button class="button primary" type="button" data-action="export-content">JSON indir</button></section><section class="backup-card"><h3>Yedeği içe aktar</h3><p class="helper">Başka bilgisayarda hazırlanan Savor JSON yedeğini bu tarayıcıya yükler.</p><button class="button secondary" type="button" data-action="import-content">JSON seç</button></section></div><section class="content-card"><h2>Developer teslimi</h2><p>Kaynak içerikler <code>content/site.json</code>, <code>content/products.json</code> ve <code>content/recipes.json</code> yapısıyla aynıdır. Gerçek backend bağlanırken yalnızca <code>cms-local.js</code> veri adaptörü değiştirilir; editör arayüzü ve site şablonları korunabilir.</p></section>`;
  }

  async function renderCurrentSection(reload = true) {
    sidebar.classList.remove("open");
    document.querySelectorAll(".nav-button").forEach((button) => button.classList.toggle("active", button.dataset.section === currentSection));
    panel.innerHTML = `<div class="empty-state">Yükleniyor…</div>`;
    if (currentSection === "site") await renderSite(reload);
    else if (currentSection === "products") await renderCollection("products", "Ürünler", productSchema, defaultProduct, reload);
    else if (currentSection === "recipes") await renderCollection("recipes", "Tarifler", recipeSchema, defaultRecipe, reload);
    else if (currentSection === "admins") await renderAdmins();
    else if (currentSection === "logs") await renderLogs();
    else await renderBackup();
  }

  function markDirty() {
    dirty = true;
  }

  function handleInput(event) {
    const input = event.target.closest("[data-input-path]");
    if (!input || currentData == null) return;
    let value = input.value;
    const type = input.dataset.valueType;
    if (type === "boolean") value = input.checked;
    else if (type === "number") value = value === "" ? 0 : Number(value);
    else if (type === "lineList") value = value.split("\n").map((item) => item.trim()).filter(Boolean);
    else if (type === "stringList") value = value.split(",").map((item) => item.trim()).filter(Boolean);
    setPath(currentData, input.dataset.inputPath, value);
    markDirty();
  }

  async function handlePanelClick(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    try {
      if (action === "save-document") {
        const key = currentSection === "site" ? "site" : currentSection;
        await CMS.saveDocument(key, currentData);
        dirty = false;
        showToast("Değişiklikler kaydedildi. Siteyi yenileyerek görebilirsiniz.");
      } else if (action === "add-collection") {
        currentData.push(panel._makeItem());
        markDirty();
        await renderCollection(currentSection, currentSection === "products" ? "Ürünler" : "Tarifler", currentSection === "products" ? productSchema : recipeSchema, panel._makeItem, false);
      } else if (action === "remove-collection") {
        if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
        currentData.splice(Number(button.dataset.index), 1);
        markDirty();
        panel.innerHTML = "";
        await renderCollection(currentSection, currentSection === "products" ? "Ürünler" : "Tarifler", currentSection === "products" ? productSchema : recipeSchema, currentSection === "products" ? defaultProduct : defaultRecipe, false);
      } else if (action === "add-object") {
        const list = getPath(currentData, button.dataset.path);
        const schemaField = findSchemaField(siteSchema, button.dataset.path);
        if (Array.isArray(list) && schemaField?.makeItem) list.push(schemaField.makeItem());
        markDirty();
        await renderSite(false);
      } else if (action === "remove-object") {
        removePathItem(currentData, button.dataset.path, Number(button.dataset.index));
        markDirty();
        await renderSite(false);
      } else if (action === "choose-image") {
        cropTargetPath = button.dataset.path;
        cropDefaultRatio = button.dataset.ratio || "free";
        imageInput.value = "";
        imageInput.click();
      } else if (action === "clear-image") {
        setPath(currentData, button.dataset.path, "");
        markDirty();
        await renderCurrentSection(false);
      } else if (action === "delete-admin") {
        if (!confirm("Bu admini kalıcı olarak silmek istediğinize emin misiniz?")) return;
        await CMS.deleteAdmin(button.dataset.id);
        showToast("Admin silindi.");
        await renderAdmins();
      } else if (action === "toggle-admin") {
        await CMS.updateAdmin(button.dataset.id, { active: button.dataset.active !== "true" });
        showToast("Admin durumu güncellendi.");
        await renderAdmins();
      } else if (action === "delete-log") {
        if (!confirm("Bu işlem kaydını silmek istediğinize emin misiniz?")) return;
        await CMS.deleteLog(button.dataset.id);
        await renderLogs();
      } else if (action === "clear-logs") {
        if (!confirm("Tüm işlem kayıtları silinsin mi? Bu işlem geri alınamaz.")) return;
        await CMS.clearLogs();
        await renderLogs();
      } else if (action === "export-content") await downloadBackup();
      else if (action === "import-content") backupInput.click();
    } catch (error) {
      showToast(error.message || "İşlem tamamlanamadı.", true);
    }
  }

  function findSchemaField(fields, targetPath) {
    const keys = targetPath.split(".").filter((key) => !/^\d+$/.test(key));
    let currentFields = fields;
    let found = null;
    for (const key of keys) {
      found = currentFields.find((field) => field.key === key);
      if (!found) return null;
      currentFields = found.fields || [];
    }
    return found;
  }

  async function handleNewAdmin(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await CMS.createAdmin({ name: form.get("name"), email: form.get("email"), password: form.get("password"), role: form.get("role") });
      showToast("Yeni admin oluşturuldu.");
      await renderAdmins();
    } catch (error) {
      showToast(error.message, true);
    }
  }

  async function openCropper(file) {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Görsel okunamadı."));
      reader.readAsDataURL(file);
    });
    if (cropper) cropper.destroy();
    cropStage.querySelectorAll("cropper-canvas").forEach((element) => element.remove());
    cropSource.src = dataUrl;
    cropRatio.value = cropDefaultRatio === "free" ? "free" : String(Number(cropDefaultRatio));
    cropDialog.showModal();
    await cropSource.decode();
    cropper = new window.Cropper.default(cropSource, { container: cropStage });
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    applyCropRatio();
  }

  function applyCropRatio() {
    if (!cropper) return;
    const selection = cropper.getCropperSelection();
    if (!selection) return;
    const ratio = cropRatio.value === "free" ? NaN : Number(cropRatio.value);
    selection.aspectRatio = ratio;
    selection.initialAspectRatio = ratio;
    selection.initialCoverage = .82;
    selection.$reset();
  }

  async function applyCrop() {
    if (!cropper || !cropTargetPath) return;
    const selection = cropper.getCropperSelection();
    if (!selection) throw new Error("Kırpma alanı bulunamadı.");
    const canvas = await selection.$toCanvas({ width: 1400 });
    let dataUrl = canvas.toDataURL("image/webp", .84);
    if (!dataUrl.startsWith("data:image/webp")) dataUrl = canvas.toDataURL("image/jpeg", .86);
    setPath(currentData, cropTargetPath, dataUrl);
    markDirty();
    closeCropper();
    await renderCurrentSection(false);
    showToast("Görsel hazır. Kalıcı olması için Kaydet düğmesine basın.");
  }

  function closeCropper() {
    cropper?.destroy();
    cropper = null;
    cropStage.querySelectorAll("cropper-canvas").forEach((element) => element.remove());
    cropDialog.close();
  }

  async function downloadBackup() {
    const payload = await CMS.exportContent();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `savor-content-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("İçerik yedeği indirildi.");
  }

  async function importBackupFile(file) {
    const text = await file.text();
    const payload = JSON.parse(text);
    await CMS.importContent(payload);
    showToast("Yedek içe aktarıldı.");
    currentSection = "site";
    await renderCurrentSection();
  }

  async function showApp(user) {
    currentUser = user;
    loadingScreen.hidden = true;
    setupScreen.hidden = true;
    loginScreen.hidden = true;
    adminApp.hidden = false;
    document.getElementById("current-user-name").textContent = user.name;
    document.getElementById("current-user-role").textContent = humanRole(user);
    await CMS.importDefaults("../content");
    await renderCurrentSection();
  }

  async function boot() {
    try {
      if (!await CMS.hasUsers()) {
        loadingScreen.hidden = true;
        setupScreen.hidden = false;
        return;
      }
      const user = await CMS.sessionUser();
      if (user) await showApp(user);
      else {
        loadingScreen.hidden = true;
        loginScreen.hidden = false;
      }
    } catch (error) {
      loadingScreen.innerHTML = `<div class="auth-card"><h1>Panel açılamadı</h1><p>${escapeHtml(error.message)}</p></div>`;
    }
  }

  document.getElementById("setup-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const user = await CMS.createPrimaryAdmin({ name: form.get("name"), email: form.get("email"), password: form.get("password") });
      await showApp(user);
    } catch (error) { showToast(error.message, true); }
  });

  document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const user = await CMS.authenticate(form.get("email"), form.get("password"));
      await showApp(user);
    } catch (error) { showToast(error.message, true); }
  });

  document.querySelectorAll(".nav-button").forEach((button) => button.addEventListener("click", async () => {
    if (dirty && !confirm("Kaydedilmemiş değişiklikler var. Bölüm değiştirilsin mi?")) return;
    dirty = false;
    currentSection = button.dataset.section;
    await renderCurrentSection();
  }));

  panel.addEventListener("input", handleInput);
  panel.addEventListener("change", handleInput);
  panel.addEventListener("click", handlePanelClick);
  document.getElementById("logout-button").addEventListener("click", async () => { await CMS.logout(); location.reload(); });
  document.getElementById("menu-button").addEventListener("click", () => sidebar.classList.toggle("open"));
  imageInput.addEventListener("change", () => imageInput.files?.[0] && openCropper(imageInput.files[0]).catch((error) => showToast(error.message, true)));
  backupInput.addEventListener("change", () => backupInput.files?.[0] && importBackupFile(backupInput.files[0]).catch((error) => showToast(error.message || "Yedek okunamadı.", true)));
  cropRatio.addEventListener("change", applyCropRatio);
  document.getElementById("crop-close").addEventListener("click", closeCropper);
  document.getElementById("crop-cancel").addEventListener("click", closeCropper);
  document.getElementById("crop-apply").addEventListener("click", () => applyCrop().catch((error) => showToast(error.message, true)));
  document.querySelector(".crop-controls").addEventListener("click", (event) => {
    const button = event.target.closest("[data-crop-action]");
    if (!button || !cropper) return;
    const image = cropper.getCropperImage();
    if (!image) return;
    const action = button.dataset.cropAction;
    if (action === "rotate-left") image.$rotate("-90deg");
    else if (action === "rotate-right") image.$rotate("90deg");
    else if (action === "zoom-in") image.$zoom(.12);
    else if (action === "zoom-out") image.$zoom(-.12);
    else if (action === "flip-x") image.$scale(-1, 1);
  });
  window.addEventListener("beforeunload", (event) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } });

  boot();
})();
