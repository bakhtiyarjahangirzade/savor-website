(() => {
  const supportedLanguages = ["az", "ru", "en"];
  const params = new URLSearchParams(window.location.search);
  let lang = params.get("lang") || localStorage.getItem("savor-language") || "az";
  if (!supportedLanguages.includes(lang)) lang = "az";

  const ui = {
    az: {
      home: "Ana səhifə",
      products: "Məhsullar",
      recipes: "Reseptlər",
      about: "Haqqımızda",
      buy: "Haradan almaq olar",
      menu: "Menyunu aç",
      close: "Menyunu bağla",
      discoverProducts: "Məhsullara bax",
      exploreRecipes: "Reseptləri kəşf et",
      featuredProduct: "Seçilmiş məhsul",
      ourProducts: "Məhsullarımız",
      productsIntro: "Hər mətbəx və hər ehtiyac üçün uyğun ölçü.",
      allProducts: "Bütün məhsullar",
      featuredRecipes: "Seçilmiş reseptlər",
      allRecipes: "Bütün reseptlər",
      viewProduct: "Məhsula bax",
      viewRecipe: "Reseptə bax",
      productCount: "məhsul",
      recipeCount: "resept",
      weight: "Çəki",
      bestFor: "Uyğundur",
      ingredients: "İnqrediyentlər",
      method: "Hazırlanması",
      prep: "Hazırlıq",
      cook: "Bişirmə",
      minutes: "dəq",
      relatedProducts: "Bunun üçün Savor",
      aboutEyebrow: "Savor hekayəsi",
      values: "Dəyərlərimiz",
      buyEyebrow: "Sizə ən yaxın Savor",
      retail: "Satış nöqtələri",
      wholesale: "Topdan satış",
      contact: "Əlaqə",
      phone: "Telefon",
      email: "E-poçt",
      emptyRetail: "Satış nöqtələrini admin panelindən əlavə edə bilərsiniz.",
      admin: "Admin",
      footerTagline: "Yadda qalan süfrələr üçün saf, zəngin və etibarlı kərə yağı.",
      quickLinks: "Keçidlər",
      language: "Dil",
      rights: "Bütün hüquqlar qorunur.",
      notFound: "Səhifə tapılmadı",
      backHome: "Ana səhifəyə qayıt",
      loadingError: "Məzmun yüklənmədi. Saytı lokal server üzərindən açdığınızdan əmin olun.",
      pureButter: "100% kərə yağı"
    },
    ru: {
      home: "Главная",
      products: "Продукты",
      recipes: "Рецепты",
      about: "О нас",
      buy: "Где купить",
      menu: "Открыть меню",
      close: "Закрыть меню",
      discoverProducts: "Смотреть продукты",
      exploreRecipes: "Открыть рецепты",
      featuredProduct: "Избранный продукт",
      ourProducts: "Наши продукты",
      productsIntro: "Подходящий формат для каждой кухни и задачи.",
      allProducts: "Все продукты",
      featuredRecipes: "Избранные рецепты",
      allRecipes: "Все рецепты",
      viewProduct: "Смотреть продукт",
      viewRecipe: "Смотреть рецепт",
      productCount: "продуктов",
      recipeCount: "рецептов",
      weight: "Вес",
      bestFor: "Подходит для",
      ingredients: "Ингредиенты",
      method: "Приготовление",
      prep: "Подготовка",
      cook: "Готовка",
      minutes: "мин",
      relatedProducts: "Savor для рецепта",
      aboutEyebrow: "История Savor",
      values: "Наши ценности",
      buyEyebrow: "Savor рядом с вами",
      retail: "Точки продаж",
      wholesale: "Оптовые продажи",
      contact: "Контакты",
      phone: "Телефон",
      email: "Эл. почта",
      emptyRetail: "Добавьте точки продаж через панель администратора.",
      admin: "Админ",
      footerTagline: "Чистое, насыщенное и надежное сливочное масло для незабываемого стола.",
      quickLinks: "Разделы",
      language: "Язык",
      rights: "Все права защищены.",
      notFound: "Страница не найдена",
      backHome: "Вернуться на главную",
      loadingError: "Не удалось загрузить контент. Убедитесь, что сайт открыт через локальный сервер.",
      pureButter: "100% сливочное масло"
    },
    en: {
      home: "Home",
      products: "Products",
      recipes: "Recipes",
      about: "About us",
      buy: "Where to buy",
      menu: "Open menu",
      close: "Close menu",
      discoverProducts: "Discover products",
      exploreRecipes: "Explore recipes",
      featuredProduct: "Featured product",
      ourProducts: "Our products",
      productsIntro: "The right format for every kitchen and every need.",
      allProducts: "All products",
      featuredRecipes: "Featured recipes",
      allRecipes: "All recipes",
      viewProduct: "View product",
      viewRecipe: "View recipe",
      productCount: "products",
      recipeCount: "recipes",
      weight: "Weight",
      bestFor: "Best for",
      ingredients: "Ingredients",
      method: "Method",
      prep: "Prep",
      cook: "Cook",
      minutes: "min",
      relatedProducts: "Savor for this recipe",
      aboutEyebrow: "The Savor story",
      values: "Our values",
      buyEyebrow: "Find Savor near you",
      retail: "Retail locations",
      wholesale: "Wholesale",
      contact: "Contact",
      phone: "Phone",
      email: "Email",
      emptyRetail: "Add retail locations from the admin panel.",
      admin: "Admin",
      footerTagline: "Pure, rich and dependable butter for memorable tables.",
      quickLinks: "Quick links",
      language: "Language",
      rights: "All rights reserved.",
      notFound: "Page not found",
      backHome: "Back to home",
      loadingError: "Content could not be loaded. Make sure the site is opened through a local server.",
      pureButter: "100% butter"
    }
  };

  const U = () => ui[lang];
  const local = (value) => {
    if (value == null) return "";
    if (typeof value === "string" || typeof value === "number") return String(value);
    return value[lang] ?? value.az ?? value.en ?? value.ru ?? "";
  };
  const localList = (value) => {
    const result = local(value);
    return Array.isArray(result) ? result : [];
  };
  const esc = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  const asset = (path) => {
    if (!path) return "";
    if (/^(https?:|data:)/.test(path)) return path;
    return path.replace(/^\//, "");
  };
  const href = (path, extra = {}) => {
    const url = new URL(path, window.location.href);
    url.searchParams.set("lang", lang);
    Object.entries(extra).forEach(([key, value]) => url.searchParams.set(key, value));
    return `${url.pathname.split("/").pop()}${url.search}`;
  };
  const page = document.body.dataset.page || "home";

  document.documentElement.lang = lang;
  localStorage.setItem("savor-language", lang);

  const navItems = [
    ["home", "index.html", "home"],
    ["products", "products.html", "products"],
    ["recipes", "recipes.html", "recipes"],
    ["about", "about.html", "about"],
    ["buy", "where-to-buy.html", "buy"]
  ];

  function renderHeader() {
    const activePage = page === "product" ? "products" : page === "recipe" ? "recipes" : page;
    document.getElementById("site-header").innerHTML = `
      <header class="site-header">
        <div class="header-inner">
          <a class="brand" href="${href("index.html")}" aria-label="Savor ${esc(U().home)}">
            <img src="assets/savor-logo-long.svg" alt="Savor" />
          </a>
          <nav class="main-nav" id="main-nav" aria-label="Main navigation">
            <ul class="nav-list">
              ${navItems.map(([key, path, active]) => `<li><a class="nav-link ${activePage === active ? "active" : ""}" href="${href(path)}">${esc(U()[key])}</a></li>`).join("")}
            </ul>
          </nav>
          <div class="header-actions">
            <div class="language-switcher" aria-label="${esc(U().language)}">
              ${supportedLanguages.map((code) => `<button class="lang-button ${lang === code ? "active" : ""}" type="button" data-language="${code}" aria-pressed="${lang === code}">${code.toUpperCase()}</button>`).join("")}
            </div>
            <button class="menu-button" type="button" aria-expanded="false" aria-controls="main-nav" aria-label="${esc(U().menu)}"><span class="menu-icon"></span></button>
          </div>
        </div>
      </header>`;

    document.querySelectorAll("[data-language]").forEach((button) => button.addEventListener("click", () => {
      const url = new URL(window.location.href);
      url.searchParams.set("lang", button.dataset.language);
      localStorage.setItem("savor-language", button.dataset.language);
      window.location.href = url.toString();
    }));

    const menuButton = document.querySelector(".menu-button");
    const menu = document.querySelector(".main-nav");
    menuButton.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      document.body.classList.toggle("menu-open", open);
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? U().close : U().menu);
    });
  }

  function renderFooter(settings = {}) {
    const year = new Date().getFullYear();
    document.getElementById("site-footer").innerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-top">
            <div class="footer-brand">
              <img src="assets/savor-logo-long.svg" alt="Savor" />
              <p>${esc(local(settings.footerText) || U().footerTagline)}</p>
            </div>
            <div class="footer-column">
              <h3>${esc(U().quickLinks)}</h3>
              <ul class="footer-links">${navItems.slice(1).map(([key, path]) => `<li><a href="${href(path)}">${esc(U()[key])}</a></li>`).join("")}</ul>
            </div>
            <div class="footer-column">
              <h3>${esc(U().language)}</h3>
              <ul class="footer-links">
                <li><a href="${languageHref("az")}">Azərbaycan</a></li>
                <li><a href="${languageHref("ru")}">Русский</a></li>
                <li><a href="${languageHref("en")}">English</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© ${year} Savor. ${esc(U().rights)}</span>
            <a class="admin-link" href="admin.html">${esc(U().admin)}</a>
          </div>
        </div>
      </footer>`;
  }

  function languageHref(code) {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", code);
    return `${url.pathname.split("/").pop() || "index.html"}${url.search}`;
  }

  function setMeta(title, description) {
    document.title = `${title} — Savor`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta && description) meta.setAttribute("content", description);
  }

  function productVisual(product, imagePath = "") {
    if (imagePath) return `<img class="product-card-image" src="${esc(asset(imagePath))}" alt="${esc(local(product.name))}" />`;
    return `<div class="package-mockup" aria-label="${esc(local(product.name))}"><img src="assets/savor-logo-main.svg" alt="" /><span class="package-weight">${esc(product.weight)}</span></div>`;
  }

  function productCard(product) {
    const imagePath = local(product.image);
    return `<a class="product-card fade-up" href="${href("product.html", { slug: product.slug })}">
      <div class="product-media">${productVisual(product, imagePath)}</div>
      <div class="product-card-body"><div><h3>${esc(local(product.name))}</h3><p>${esc(local(product.shortDescription))}</p></div><span class="round-arrow" aria-hidden="true">↗</span></div>
    </a>`;
  }

  function recipeCard(recipe) {
    return `<a class="recipe-card fade-up" href="${href("recipe.html", { slug: recipe.slug })}">
      <img src="${esc(asset(local(recipe.image)) || "assets/recipe-pancakes.svg")}" alt="${esc(local(recipe.title))}" />
      <div class="recipe-card-body"><div class="recipe-meta"><span>${esc(local(recipe.category))}</span><span>${recipe.prepMinutes + recipe.cookMinutes} ${esc(U().minutes)}</span></div><h3>${esc(local(recipe.title))}</h3><p>${esc(local(recipe.intro))}</p></div>
    </a>`;
  }

  function pageHero(eyebrow, title, intro) {
    return `<section class="page-hero"><div class="container fade-up"><p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1><p class="lead">${esc(intro)}</p></div></section>`;
  }

  function renderHome(site, products, recipes) {
    const home = site.home;
    const featured = products.find((item) => item.featured) || products[0];
    const featuredRecipes = recipes.filter((item) => item.featured).slice(0, 3);
    const heroImage = asset(local(home.hero.image)) || "assets/hero-butter.svg";
    setMeta(local(home.hero.title), local(home.hero.description));
    document.getElementById("main").innerHTML = `
      <section class="hero" style="--hero-image:url('${esc(heroImage)}')">
        <div class="hero-inner">
          <div class="hero-copy fade-up"><p class="eyebrow">${esc(local(home.hero.eyebrow))}</p><h1>${esc(local(home.hero.title))}</h1><p class="lead">${esc(local(home.hero.description))}</p><div class="hero-actions"><a class="button button-primary" href="${href("products.html")}">${esc(U().discoverProducts)} <span aria-hidden="true">→</span></a><a class="button button-outline" href="${href("recipes.html")}">${esc(U().exploreRecipes)}</a></div></div>
          <span class="hero-stamp">${esc(U().pureButter)}</span>
        </div>
      </section>
      <section class="section"><div class="container"><div class="section-heading"><div><p class="eyebrow">SAVOR BUTTER</p><h2>${esc(U().ourProducts)}</h2></div><a class="text-link" href="${href("products.html")}">${esc(U().allProducts)} →</a></div><div class="product-grid">${products.slice(0, 3).map(productCard).join("")}</div></div></section>
      ${featured ? `<section class="section-compact"><div class="container"><div class="feature-panel"><div class="feature-visual">${productVisual(featured, local(featured.image))}</div><div class="feature-copy"><div><p class="eyebrow">${esc(U().featuredProduct)}</p><h2>${esc(local(featured.name))}</h2><p>${esc(local(featured.description))}</p><a class="button button-light" href="${href("product.html", { slug: featured.slug })}">${esc(U().viewProduct)} →</a></div></div></div></div></section>` : ""}
      <section class="section section-cream"><div class="container"><div class="section-heading"><div><p class="eyebrow">SAVOR AT HOME</p><h2>${esc(U().featuredRecipes)}</h2></div><a class="text-link" href="${href("recipes.html")}">${esc(U().allRecipes)} →</a></div><div class="recipe-grid">${featuredRecipes.map(recipeCard).join("")}</div></div></section>
      <section class="section"><div class="container"><div class="about-grid"><div class="about-copy"><p class="eyebrow">${esc(local(home.story.eyebrow))}</p><h2>${esc(local(home.story.title))}</h2><p>${esc(local(home.story.text))}</p><a class="text-link" href="${href("about.html")}">${esc(U().about)} →</a></div><div class="about-art"><img src="assets/savor-logo-standard.svg" alt="Savor" /></div></div></div></section>
      <div class="story-strip">${(home.highlights || []).map((item) => `<div class="story-stat"><strong>${esc(item.value)}</strong><span>${esc(local(item.label))}</span></div>`).join("")}</div>`;
  }

  function renderProducts(site, products) {
    setMeta(U().products, U().productsIntro);
    document.getElementById("main").innerHTML = `${pageHero("SAVOR BUTTER", U().ourProducts, U().productsIntro)}<section class="section"><div class="container"><div class="toolbar"><p class="result-count">${products.length} ${esc(U().productCount)}</p></div><div class="product-grid">${products.sort((a,b) => (a.order || 0) - (b.order || 0)).map(productCard).join("")}</div></div></section>`;
  }

  function renderProduct(site, products) {
    const slug = params.get("slug");
    const product = products.find((item) => item.slug === slug);
    if (!product) return renderNotFound();
    setMeta(local(product.name), local(product.shortDescription));
    document.getElementById("main").innerHTML = `<section class="detail-hero"><div class="container"><div class="detail-grid"><div class="detail-media fade-up">${productVisual(product, local(product.image))}</div><div class="detail-copy fade-up"><p class="eyebrow">SAVOR BUTTER · ${esc(product.weight)}</p><h1>${esc(local(product.name))}</h1><p class="lead">${esc(local(product.description))}</p><div class="detail-facts"><div class="detail-fact"><span>${esc(U().weight)}</span><strong>${esc(product.weight)}</strong></div><div class="detail-fact"><span>${esc(U().bestFor)}</span><strong>${esc(local(product.bestFor))}</strong></div></div><a class="button button-primary" href="${href("where-to-buy.html")}">${esc(U().buy)} →</a></div></div></div></section><section class="section section-cream"><div class="container"><div class="section-heading"><div><p class="eyebrow">SAVOR BUTTER</p><h2>${esc(U().ourProducts)}</h2></div><a class="text-link" href="${href("products.html")}">${esc(U().allProducts)} →</a></div><div class="product-grid">${products.filter((item) => item.slug !== slug).slice(0,3).map(productCard).join("")}</div></div></section>`;
  }

  function renderRecipes(site, recipes) {
    const content = site.recipesPage;
    setMeta(local(content.title), local(content.intro));
    document.getElementById("main").innerHTML = `${pageHero(local(content.eyebrow), local(content.title), local(content.intro))}<section class="section"><div class="container"><div class="toolbar"><p class="result-count">${recipes.length} ${esc(U().recipeCount)}</p></div><div class="recipe-grid">${recipes.map(recipeCard).join("")}</div></div></section>`;
  }

  function renderRecipe(site, recipes, products) {
    const slug = params.get("slug");
    const recipe = recipes.find((item) => item.slug === slug);
    if (!recipe) return renderNotFound();
    setMeta(local(recipe.title), local(recipe.intro));
    const ingredients = localList(recipe.ingredients);
    const steps = localList(recipe.steps);
    const recommended = products.filter((product) => (recipe.productSlugs || []).includes(product.slug));
    document.getElementById("main").innerHTML = `<section class="page-hero"><div class="container fade-up"><p class="eyebrow">${esc(local(recipe.category))}</p><h1>${esc(local(recipe.title))}</h1><p class="lead">${esc(local(recipe.intro))}</p><div class="detail-facts" style="max-width:430px"><div class="detail-fact"><span>${esc(U().prep)}</span><strong>${recipe.prepMinutes} ${esc(U().minutes)}</strong></div><div class="detail-fact"><span>${esc(U().cook)}</span><strong>${recipe.cookMinutes} ${esc(U().minutes)}</strong></div></div><div class="recipe-detail-media"><img src="${esc(asset(local(recipe.image)) || "assets/recipe-pancakes.svg")}" alt="${esc(local(recipe.title))}" /></div></div></section><section class="section"><div class="container"><div class="recipe-content-grid"><aside><div class="ingredient-card"><p class="eyebrow">SAVOR RECIPE</p><h3>${esc(U().ingredients)}</h3><ul class="ingredient-list">${ingredients.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div></aside><div><p class="eyebrow">${esc(U().method)}</p><h2>${esc(U().method)}</h2><ol class="step-list">${steps.map((item) => `<li>${esc(item)}</li>`).join("")}</ol></div></div></div></section>${recommended.length ? `<section class="section section-cream"><div class="container"><div class="section-heading"><h2>${esc(U().relatedProducts)}</h2></div><div class="product-grid">${recommended.map(productCard).join("")}</div></div></section>` : ""}`;
  }

  function renderAbout(site) {
    const about = site.about;
    setMeta(local(about.title), local(about.intro));
    document.getElementById("main").innerHTML = `${pageHero(local(about.eyebrow) || U().aboutEyebrow, local(about.title), local(about.intro))}<section class="section"><div class="container"><div class="about-grid"><div class="about-copy"><p class="eyebrow">${esc(U().aboutEyebrow)}</p><h2>${esc(local(about.storyTitle))}</h2><p>${esc(local(about.storyText))}</p></div><div class="about-art"><img src="${esc(asset(local(about.image)) || "assets/savor-logo-standard.svg")}" alt="Savor" /></div></div></div></section><section class="section section-cream"><div class="container"><div class="section-heading"><div><p class="eyebrow">SAVOR</p><h2>${esc(U().values)}</h2></div></div><div class="values-grid">${(about.values || []).map((item, index) => `<article class="value-card"><span class="value-number">0${index + 1}</span><h3>${esc(local(item.title))}</h3><p>${esc(local(item.text))}</p></article>`).join("")}</div></div></section>`;
  }

  function renderBuy(site) {
    const buy = site.buy;
    const settings = site.settings;
    setMeta(local(buy.title), local(buy.intro));
    const contacts = [
      settings.phone ? [U().phone, settings.phone] : null,
      settings.email ? [U().email, settings.email] : null
    ].filter(Boolean);
    document.getElementById("main").innerHTML = `${pageHero(local(buy.eyebrow) || U().buyEyebrow, local(buy.title), local(buy.intro))}<section class="section"><div class="container"><div class="buy-grid"><article class="buy-card buy-card-light"><p class="eyebrow">${esc(U().retail)}</p><h2>${esc(local(buy.retailTitle))}</h2><p class="lead">${esc(local(buy.retailText))}</p>${(buy.locations || []).length ? `<ul class="contact-list">${buy.locations.map((location) => `<li><strong>${esc(location.name)}</strong><span>${esc(location.address)}</span></li>`).join("")}</ul>` : `<div class="empty-state">${esc(U().emptyRetail)}</div>`}</article><article class="buy-card buy-card-dark"><p class="eyebrow">${esc(U().wholesale)}</p><h2>${esc(local(buy.wholesaleTitle))}</h2><p>${esc(local(buy.wholesaleText))}</p>${contacts.length ? `<ul class="contact-list">${contacts.map(([label, value]) => `<li><span>${esc(label)}</span><strong>${esc(value)}</strong></li>`).join("")}</ul>` : `<div class="empty-state" style="border-color:rgba(255,255,255,.25);color:rgba(255,255,255,.66)">${esc(local(buy.contactPlaceholder))}</div>`}</article></div></div></section>`;
  }

  function renderNotFound() {
    setMeta(U().notFound, U().notFound);
    document.getElementById("main").innerHTML = `<section class="error-state"><div><p class="eyebrow">404</p><h1>${esc(U().notFound)}</h1><a class="button button-primary" href="${href("index.html")}">${esc(U().backHome)}</a></div></section>`;
  }

  async function init() {
    renderHeader();
    try {
      const [siteResponse, productsResponse, recipesResponse] = await Promise.all([
        fetch("content/site.json", { cache: "no-store" }),
        fetch("content/products.json", { cache: "no-store" }),
        fetch("content/recipes.json", { cache: "no-store" })
      ]);
      if (![siteResponse, productsResponse, recipesResponse].every((response) => response.ok)) throw new Error("Content request failed");
      const [site, products, recipes] = await Promise.all([siteResponse.json(), productsResponse.json(), recipesResponse.json()]);
      renderFooter(site.settings);
      const routes = {
        home: () => renderHome(site, products, recipes),
        products: () => renderProducts(site, products),
        product: () => renderProduct(site, products),
        recipes: () => renderRecipes(site, recipes),
        recipe: () => renderRecipe(site, recipes, products),
        about: () => renderAbout(site),
        buy: () => renderBuy(site),
        "not-found": renderNotFound
      };
      (routes[page] || renderNotFound)();
    } catch (error) {
      console.error(error);
      renderFooter();
      document.getElementById("main").innerHTML = `<section class="error-state"><div><p class="eyebrow">SAVOR</p><h1>${esc(U().loadingError)}</h1></div></section>`;
    }
  }

  init();
})();
