// Segunda · app.js

const SUPABASE_URL = "https://rbtyegheeuhaanxfuivz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_r2_2NNqGRINqzIg8v3H1Ww_yUDZd3_x";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SUBCATEGORIES = {
  Mujer: ["Vestidos", "Chaquetas", "Zapatos", "Sneakers"],
  Hombre: ["Camisas", "Zapatos", "Sacos", "Camisetas"],
};

const BRANDS = ["Nike", "Adidas", "Zara", "Bershka", "Withman", "Chevignon"];

const state = { search: "", category: "", subcategory: "", brand: "", city: "", sort: "recent" };
let items = [];

const grid = document.getElementById("grid");
const countEl = document.getElementById("count");
const emptyEl = document.getElementById("empty");
const subcatNav = document.getElementById("subcategories");

function money(n) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

async function loadItems() {
  countEl.textContent = "Cargando...";
  let query = supabase.from("items").select("*").eq("status", "active");

  if (state.category) query = query.eq("category", state.category);
  if (state.subcategory) query = query.eq("subcategory", state.subcategory);
  if (state.brand) query = query.eq("brand", state.brand);
  if (state.city) query = query.eq("city", state.city);
  if (state.search) query = query.ilike("title", "%" + state.search + "%");

  if (state.sort === "low") query = query.order("price", { ascending: true });
  else if (state.sort === "high") query = query.order("price", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const result = await query.limit(60);

  if (result.error) {
    grid.innerHTML = "<p>No pudimos cargar los artículos. Verifica la conexión e intenta de nuevo.</p>";
    countEl.textContent = "Error";
    console.error(result.error);
    return;
  }

  items = result.data || [];
  renderGrid();
}

function renderGrid() {
  countEl.textContent = items.length + (items.length === 1 ? " artículo" : " artículos");
  emptyEl.hidden = items.length !== 0;

  let html = "";
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const image = it.photo_url
      ? '<img src="' + it.photo_url + '" alt="' + escapeHtml(it.title) + '">'
      : '<div class="no-photo">' + escapeHtml(it.title) + "</div>";
    const brandLabel = it.brand ? " · " + escapeHtml(it.brand) : "";
    html +=
      '<button class="card" data-id="' + it.id + '">' +
        '<div class="card-image">' + image + '<span class="condition">' + escapeHtml(it.condition) + "</span></div>" +
        '<div class="card-body">' +
          '<p class="card-category">' + escapeHtml(it.category) + brandLabel + "</p>" +
          "<h3>" + escapeHtml(it.title) + "</h3>" +
          '<p class="price">' + money(it.price) + "</p>" +
          '<p class="location">' + escapeHtml(it.city) + "</p>" +
        "</div>" +
      "</button>";
  }
  grid.innerHTML = html;

  const cards = grid.querySelectorAll(".card");
  for (let i = 0; i < cards.length; i++) {
    cards[i].addEventListener("click", function () {
      openDetail(cards[i].dataset.id);
    });
  }
}

function openDetail(id) {
  const it = items.find(function (i) { return i.id === id; });
  if (!it) return;
  const phone = it.seller_whatsapp;
  const message = 'Hola, vi "' + it.title + '" en Segunda y me interesa.';
  const wa = "https://wa.me/57" + phone + "?text=" + encodeURIComponent(message);

  const image = it.photo_url
    ? '<img class="detail-image" src="' + it.photo_url + '" alt="' + escapeHtml(it.title) + '">'
    : "";
  const subcatLabel = it.subcategory ? " · " + escapeHtml(it.subcategory) : "";
  const brandLabel = it.brand ? " · " + escapeHtml(it.brand) : "";

  document.getElementById("detail-content").innerHTML =
    image +
    '<p class="card-category">' + escapeHtml(it.category) + subcatLabel + brandLabel + " · " + escapeHtml(it.condition) + "</p>" +
    "<h2>" + escapeHtml(it.title) + "</h2>" +
    '<p class="price">' + money(it.price) + "</p>" +
    '<p class="location">' + escapeHtml(it.city) + "</p>" +
    '<p class="detail-description">' + escapeHtml(it.description) + "</p>" +
    '<a class="primary wide" style="display:block;text-align:center;text-decoration:none;margin-top:16px" href="' + wa + '" target="_blank" rel="noopener">Contactar por WhatsApp</a>';

  document.getElementById("detail").showModal();
}

function renderSubcategories() {
  const list = SUBCATEGORIES[state.category];
  if (!list) {
    subcatNav.hidden = true;
    subcatNav.innerHTML = "";
    return;
  }
  let html = '<button class="category active" data-subcategory="" aria-pressed="true">Todo ' + escapeHtml(state.category) + "</button>";
  for (let i = 0; i < list.length; i++) {
    html += '<button class="category" data-subcategory="' + list[i] + '" aria-pressed="false">' + list[i] + "</button>";
  }
  subcatNav.innerHTML = html;
  subcatNav.hidden = false;
}

function setActiveButton(container, matchFn) {
  const buttons = container.querySelectorAll(".category");
  for (let i = 0; i < buttons.length; i++) {
    const isActive = matchFn(buttons[i]);
    buttons[i].classList.toggle("active", isActive);
    buttons[i].setAttribute("aria-pressed", isActive ? "true" : "false");
  }
}

// --- Buscador, filtros y orden ---

document.getElementById("search").addEventListener("input", function (e) {
  state.search = e.target.value.trim();
  loadItems();
});

document.getElementById("city").addEventListener("change", function (e) {
  state.city = e.target.value;
  loadItems();
});

document.getElementById("sort").addEventListener("change", function (e) {
  state.sort = e.target.value;
  loadItems();
});

document.getElementById("categories").addEventListener("click", function (e) {
  const btn = e.target.closest(".category");
  if (!btn) return;
  state.category = btn.dataset.category;
  state.subcategory = "";
  setActiveButton(document.getElementById("categories"), function (b) { return b === btn; });
  renderSubcategories();
  loadItems();
});

subcatNav.addEventListener("click", function (e) {
  const btn = e.target.closest(".category");
  if (!btn) return;
  state.subcategory = btn.dataset.subcategory;
  setActiveButton(subcatNav, function (b) { return b === btn; });
  loadItems();
});

document.getElementById("brands").addEventListener("click", function (e) {
  const btn = e.target.closest(".category");
  if (!btn) return;
  state.brand = btn.dataset.brand;
  setActiveButton(document.getElementById("brands"), function (b) { return b === btn; });
  loadItems();
});

document.getElementById("reset").addEventListener("click", function () {
  state.search = "";
  state.category = "";
  state.subcategory = "";
  state.brand = "";
  state.city = "";
  state.sort = "recent";
  document.getElementById("search").value = "";
  document.getElementById("city").value = "";
  document.getElementById("sort").value = "recent";
  setActiveButton(document.getElementById("categories"), function (b, i) { return b.dataset.category === ""; });
  setActiveButton(document.getElementById("brands"), function (b) { return b.dataset.brand === ""; });
  renderSubcategories();
  loadItems();
});

// --- Diálogos ---

const closeButtons = document.querySelectorAll("dialog .close");
for (let i = 0; i < closeButtons.length; i++) {
  closeButtons[i].addEventListener("click", function () {
    closeButtons[i].closest("dialog").close();
  });
}

document.getElementById("publish").addEventListener("click", function () {
  document.getElementById("listing").showModal();
});

document.getElementById("form-category").addEventListener("change", function (e) {
  const wrap = document.getElementById("form-subcategory-wrap");
  const select = document.getElementById("form-subcategory");
  const list = SUBCATEGORIES[e.target.value];
  if (!list) {
    wrap.hidden = true;
    select.innerHTML = "";
    return;
  }
  let html = '<option value="">Sin subcategoría</option>';
  for (let i = 0; i < list.length; i++) {
    html += "<option>" + list[i] + "</option>";
  }
  select.innerHTML = html;
  wrap.hidden = false;
});

// --- Publicar artículo ---

document.getElementById("form").addEventListener("submit", async function (e) {
  e.preventDefault();
  const errorEl = document.getElementById("form-error");
  errorEl.textContent = "";
  const fd = new FormData(e.target);
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Publicando...";

  try {
    let photo_url = null;
    const file = fd.get("photo");
    if (file && file.size > 0) {
      const path = Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9._-]/g, "");
      const uploadResult = await supabase.storage.from("item-photos").upload(path, file);
      if (uploadResult.error) throw uploadResult.error;
      photo_url = supabase.storage.from("item-photos").getPublicUrl(path).data.publicUrl;
    }

    const insertResult = await supabase.from("items").insert({
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
      status: "pending",
    });
    if (insertResult.error) throw insertResult.error;

    document.getElementById("listing").close();
    e.target.reset();
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
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.hidden = false;
  setTimeout(function () { t.hidden = true; }, 4000);
}

// --- Arranque ---
loadItems();
