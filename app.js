// Segunda · app.js
(function () {
  "use strict";

  var SUPABASE_URL = "https://rbtyegheeuhaanxfuivz.supabase.co";
  var SUPABASE_KEY = "sb_publishable_r2_2NNqGRINqzIg8v3H1Ww_yUDZd3_x";

  var SUBCATEGORIES = {
    Mujer: ["Vestidos", "Chaquetas", "Zapatos", "Sneakers"],
    Hombre: ["Camisas", "Zapatos", "Sacos", "Camisetas"]
  };

  // Conexión a la base de datos (nombre "db" para no chocar con la librería)
  var db = null;
  try {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (err) {
    console.error("No se pudo iniciar la base de datos:", err);
  }

  var state = { search: "", category: "", subcategory: "", brand: "", city: "", sort: "recent" };
  var items = [];

  var grid = document.getElementById("grid");
  var countEl = document.getElementById("count");
  var emptyEl = document.getElementById("empty");
  var subcatNav = document.getElementById("subcategories");

  function money(n) {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ---------- Catálogo ----------

  async function loadItems() {
    countEl.textContent = "Cargando...";
    if (!db) {
      grid.innerHTML = "<p>No pudimos conectar con la base de datos. Recarga la página.</p>";
      countEl.textContent = "Sin conexión";
      return;
    }

    var query = db.from("items").select("*").eq("status", "active");
    if (state.category) query = query.eq("category", state.category);
    if (state.subcategory) query = query.eq("subcategory", state.subcategory);
    if (state.brand) query = query.eq("brand", state.brand);
    if (state.city) query = query.eq("city", state.city);
    if (state.search) query = query.ilike("title", "%" + state.search + "%");

    if (state.sort === "low") query = query.order("price", { ascending: true });
    else if (state.sort === "high") query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    var result = await query.limit(60);
    if (result.error) {
      console.error(result.error);
      grid.innerHTML = "<p>No pudimos cargar los artículos. Intenta de nuevo.</p>";
      countEl.textContent = "Error";
      return;
    }
    items = result.data || [];
    renderGrid();
  }

  function renderGrid() {
    countEl.textContent = items.length + (items.length === 1 ? " artículo" : " artículos");
    emptyEl.hidden = items.length !== 0;

    var html = "";
    items.forEach(function (it) {
      var image = it.photo_url
        ? '<img src="' + esc(it.photo_url) + '" alt="' + esc(it.title) + '">'
        : '<div class="no-photo">' + esc(it.title) + "</div>";
      html +=
        '<button class="card" data-id="' + esc(it.id) + '">' +
          '<div class="card-image">' + image + '<span class="condition">' + esc(it.condition) + "</span></div>" +
          '<div class="card-body">' +
            '<p class="card-category">' + esc(it.category) + (it.brand ? " · " + esc(it.brand) : "") + "</p>" +
            "<h3>" + esc(it.title) + "</h3>" +
            '<p class="price">' + money(it.price) + "</p>" +
            '<p class="location">' + esc(it.city) + "</p>" +
          "</div>" +
        "</button>";
    });
    grid.innerHTML = html;
  }

  grid.addEventListener("click", function (e) {
    var card = e.target.closest(".card");
    if (card) openDetail(card.dataset.id);
  });

  function openDetail(id) {
    var it = items.find(function (x) { return String(x.id) === String(id); });
    if (!it) return;
    var wa = "https://wa.me/57" + encodeURIComponent(it.seller_whatsapp) +
      "?text=" + encodeURIComponent('Hola, vi "' + it.title + '" en Segunda y me interesa.');
    document.getElementById("detail-content").innerHTML =
      (it.photo_url ? '<img class="detail-image" src="' + esc(it.photo_url) + '" alt="' + esc(it.title) + '">' : "") +
      '<p class="card-category">' + esc(it.category) +
        (it.subcategory ? " · " + esc(it.subcategory) : "") +
        (it.brand ? " · " + esc(it.brand) : "") + " · " + esc(it.condition) + "</p>" +
      "<h2>" + esc(it.title) + "</h2>" +
      '<p class="price">' + money(it.price) + "</p>" +
      '<p class="location">' + esc(it.city) + "</p>" +
      '<p class="detail-description">' + esc(it.description) + "</p>" +
      '<a class="primary wide" style="display:block;text-align:center;text-decoration:none;margin-top:16px" href="' + wa + '" target="_blank" rel="noopener">Contactar por WhatsApp</a>';
    document.getElementById("detail").showModal();
  }

  // ---------- Filtros ----------

  function setActive(container, activeBtn) {
    container.querySelectorAll(".category").forEach(function (b) {
      var on = b === activeBtn;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function renderSubcategories() {
    var list = SUBCATEGORIES[state.category];
    if (!list) {
      subcatNav.hidden = true;
      subcatNav.innerHTML = "";
      return;
    }
    var html = '<button class="category active" data-subcategory="" aria-pressed="true">Todo ' + esc(state.category) + "</button>";
    list.forEach(function (s) {
      html += '<button class="category" data-subcategory="' + esc(s) + '" aria-pressed="false">' + esc(s) + "</button>";
    });
    subcatNav.innerHTML = html;
    subcatNav.hidden = false;
  }

  document.getElementById("categories").addEventListener("click", function (e) {
    var btn = e.target.closest(".category");
    if (!btn) return;
    state.category = btn.dataset.category;
    state.subcategory = "";
    setActive(this, btn);
    renderSubcategories();
    loadItems();
  });

  subcatNav.addEventListener("click", function (e) {
    var btn = e.target.closest(".category");
    if (!btn) return;
    state.subcategory = btn.dataset.subcategory;
    setActive(this, btn);
    loadItems();
  });

  document.getElementById("brands").addEventListener("click", function (e) {
    var btn = e.target.closest(".category");
    if (!btn) return;
    state.brand = btn.dataset.brand;
    setActive(this, btn);
    loadItems();
  });

  var searchTimer = null;
  document.getElementById("search").addEventListener("input", function (e) {
    state.search = e.target.value.trim();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadItems, 300);
  });

  document.getElementById("city").addEventListener("change", function (e) {
    state.city = e.target.value;
    loadItems();
  });

  document.getElementById("sort").addEventListener("change", function (e) {
    state.sort = e.target.value;
    loadItems();
  });

  document.getElementById("reset").addEventListener("click", function () {
    state = { search: "", category: "", subcategory: "", brand: "", city: "", sort: "recent" };
    document.getElementById("search").value = "";
    document.getElementById("city").value = "";
    document.getElementById("sort").value = "recent";
    var cats = document.getElementById("categories");
    var brands = document.getElementById("brands");
    setActive(cats, cats.querySelector('[data-category=""]'));
    setActive(brands, brands.querySelector('[data-brand=""]'));
    renderSubcategories();
    loadItems();
  });

  // ---------- Formulario de publicar ----------

  document.getElementById("form-category").addEventListener("change", function (e) {
    var wrap = document.getElementById("form-subcategory-wrap");
    var select = document.getElementById("form-subcategory");
    var list = SUBCATEGORIES[e.target.value];
    if (!list) {
      wrap.hidden = true;
      select.innerHTML = "";
      return;
    }
    var html = '<option value="">Sin subcategoría</option>';
    list.forEach(function (s) { html += "<option>" + esc(s) + "</option>"; });
    select.innerHTML = html;
    wrap.hidden = false;
  });

  document.getElementById("form").addEventListener("submit", async function (e) {
    e.preventDefault();
    var form = e.target;
    var errorEl = document.getElementById("form-error");
    errorEl.textContent = "";

    if (!db) {
      errorEl.textContent = "No hay conexión con la base de datos. Recarga la página e intenta de nuevo.";
      return;
    }

    var fd = new FormData(form);
    var submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Publicando...";

    try {
      var photo_url = null;
      var file = fd.get("photo");
      if (file && file.size > 0) {
        if (file.size > 5 * 1024 * 1024) throw new Error("La foto supera 5 MB.");
        var path = Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9._-]/g, "");
        var up = await db.storage.from("item-photos").upload(path, file);
        if (up.error) throw up.error;
        photo_url = db.storage.from("item-photos").getPublicUrl(path).data.publicUrl;
      }

      var ins = await db.from("items").insert({
        title: fd.get("title"),
        description: fd.get("description"),
        price: Number(fd.get("price")),
        category: fd.get("category"),
        subcategory: fd.get("subcategory") || null,
        brand: fd.get("brand") || null,
        city: fd.get("city"),
        condition: fd.get("condition"),
        seller_name: fd.get("seller_name"),
        seller_whatsapp: fd.get("seller_whatsapp"),
        photo_url: photo_url,
        status: "pending"
      });
      if (ins.error) throw ins.error;

      document.getElementById("listing").close();
      form.reset();
      document.getElementById("form-subcategory-wrap").hidden = true;
      showToast("Anuncio enviado. Lo publicamos apenas lo revisemos.");
    } catch (err) {
      console.error(err);
      errorEl.textContent = "No pudimos publicar tu anuncio. Revisa los datos e intenta de nuevo.";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Publicar anuncio";
    }
  });

  function showToast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.hidden = false;
    setTimeout(function () { t.hidden = true; }, 4000);
  }

  // ---------- Arranque ----------
  loadItems();
})();
