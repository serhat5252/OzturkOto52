// 🔗 Konfigürasyon
const API = "https://ozturkoto52.onrender.com/api/products";
const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`
});

// 🎨 DOM öğelerini seçiyoruz
const form = document.getElementById("productForm"),
      productList = document.getElementById("productsUl"),
      currentUser = document.getElementById("currentUser");

if (currentUser) currentUser.innerText = localStorage.getItem("username") || "";

// 📦 Veri saklama
let products = [];

// 📝 ÜRÜN EKLEME / GÜNCELLEME
form.onsubmit = async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const id = data.id; delete data.id;
  ["quantity","buyPrice","sellPrice"].forEach(k =>
    data[k] = k==="quantity" ? parseInt(data[k]) : parseFloat(data[k])
  );
  data.codes = data.codes.split(",").map(s=>s.trim());
  data.createdAt = data.createdAt || new Date().toISOString();

  const method = id ? "PUT" : "POST";
  const url = id ? `${API}/${id}` : API;

  try {
    const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(data) });
    if (!res.ok) {
      const err = await res.json();
      return alert("Hata: " + err.message);
    }
    const saved = await res.json();
    if (id) products = products.map(p => p._id === id ? saved : p);
    else products.push(saved);

    form.reset();
    renderProducts();
    emitUpdate();
  } catch(err) {
    console.error(err);
    alert("Sunucu hatası");
  }
};

// 📥 Ürünleri getir
async function fetchProducts() {
  try {
    const res = await fetch(API, { headers: headers() });
    if (!res.ok) throw "";
    products = await res.json();
    renderProducts();
  } catch {
    alert("Ürünler alınamadı");
  }
}

// 📋 Listeleme
function renderProducts(list = []) {
  const ul = document.getElementById("productsUl");
  ul.innerHTML = "";

  if (!list.length) {
    ul.style.display = "none";
    return;
  }

  ul.style.display = "block";

  list.forEach(p => {
    const lastSale = p.sales?.length
      ? p.sales[p.sales.length - 1].price
      : p.sellPrice;
    const li = document.createElement("li");
    li.innerHTML = `
      <h3>${p.name} <small>${p.category} | ${p.brand}</small></h3>
      <div>Adet: ${p.quantity} | Raf: ${p.shelf}</div>
      <div>Alış: ₺${p.buyPrice.toFixed(2)} | Son Satış: ₺${lastSale.toFixed(2)}</div>
      <div>Kodlar: ${(p.codes||[]).join(", ")}</div>
      <p>${p.description}</p>
      <div class="actions">
        <button onclick="prepareEdit('${p._id}')">Düzenle</button>
        <button onclick="sellProduct('${p._id}')">Sat</button>
        <button onclick="deleteProduct('${p._id}')">Sil</button>
        <button onclick="viewDetails('${p._id}')">Detay</button>
      </div>`;
    ul.appendChild(li);
  });
}
// 🗑️ Sil
async function deleteProduct(id) {
  if (!confirm("Silinsin mi?")) return;
  await fetch(`${API}/${id}`, { method: "DELETE", headers: headers() });
  products = products.filter(p => p._id !== id);
  renderProducts();
  emitUpdate();
}

// ✏️ Düzenleme formu doldurma
function prepareEdit(id) {
  const p = products.find(x => x._id === id);
  Object.keys(p).forEach(k => {
    if (form.elements[k]) {
      form.elements[k].value = Array.isArray(p[k]) ? p[k].join(", ") : p[k];
    }
  });
  form.id.value = id;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// 💵 Satış yap
async function sellProduct(id) {
  const p = products.find(p => p._id === id);
  const qty = parseInt(prompt("Kaç adet satıldı?", "1"));
  if (isNaN(qty) || qty < 1) return;

  const price = parseFloat(prompt("Kaç ₺ den satıldı?", p.sellPrice));
  if (isNaN(price) || price < 0) return;

  try {
    const res = await fetch(`${API}/${id}/sell`, {
      method: "POST", headers: headers(),
      body: JSON.stringify({ quantity: qty, price })
    });
    if (!res.ok) {
      const err = await res.json();
      return alert("Satış yapılamadı: " + err.message);
    }
    const updated = await res.json();
    products = products.map(x => x._id === id ? updated : x);
    renderProducts();
    emitUpdate();
  } catch {
    alert("Bağlantı hatası");
  }
}

// 🔍 Detaylı Arama
function applySearchFilters() {
  const key = document.getElementById("filterKeyword").value.toLowerCase();
  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(key) ||
    (p.codes || []).some(c => c.toLowerCase().includes(key)) ||
    (p.description || "").toLowerCase().includes(key)
  );
  const category = document.getElementById("filterCategory").value;
  const brand = document.getElementById("filterBrand").value;
  const addedFrom = document.getElementById("filterAddedFrom").value;
  const addedTo = document.getElementById("filterAddedTo").value;
  const soldFrom = document.getElementById("filterSoldFrom").value;
  const soldTo = document.getElementById("filterSoldTo").value;
  const priceMin = parseFloat(document.getElementById("filterPriceMin").value);
  const priceMax = parseFloat(document.getElementById("filterPriceMax").value);

  const matches = products.filter(p => {
    const nameMatch = p.name.toLowerCase().includes(keyword);
    const codeMatch = (p.codes || []).some(c => c.toLowerCase().includes(keyword));
    const descMatch = (p.description || "").toLowerCase().includes(keyword);
    const categoryMatch = !category || p.category === category;
    const brandMatch = !brand || p.brand === brand;

    const createdAt = new Date(p.createdAt);
    const addedFromMatch = !addedFrom || createdAt >= new Date(addedFrom);
    const addedToMatch = !addedTo || createdAt <= new Date(addedTo);

    const lastSaleDate = p.sales?.length ? new Date(p.sales[p.sales.length - 1].date) : null;
    const soldFromMatch = !soldFrom || (lastSaleDate && lastSaleDate >= new Date(soldFrom));
    const soldToMatch = !soldTo || (lastSaleDate && lastSaleDate <= new Date(soldTo));

    const priceMatch =
      (isNaN(priceMin) || p.sellPrice >= priceMin) &&
      (isNaN(priceMax) || p.sellPrice <= priceMax);

    return (nameMatch || codeMatch || descMatch) &&
           categoryMatch &&
           brandMatch &&
           addedFromMatch &&
           addedToMatch &&
           soldFromMatch &&
           soldToMatch &&
           priceMatch;
  });

  renderProducts(filtered);
}

// 🔄 Filtre temizle
function resetSearchFilters() {
  [
    "filterKeyword","filterCategory","filterBrand",
    "filterAddedFrom","filterAddedTo",
    "filterSoldFrom","filterSoldTo",
    "filterPriceMin","filterPriceMax"
  ].forEach(id => document.getElementById(id).value = "");
  document.getElementById("filterMatches").innerText = "";
  renderProducts();
}

// 📈 Satış raporu
async function getSalesReport() {
  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;
  try {
    const res = await fetch(`${API}/sales-report?from=${from}&to=${to}`, {
      headers: headers()
    });
    if (!res.ok) throw "";
    const { totalQuantity, totalRevenue, totalProfit } = await res.json();
    document.getElementById("reportResult").innerHTML = `
      <p>Toplam Satılan Adet: <strong>${totalQuantity}</strong></p>
      <p>Toplam Gelir: <strong>₺${totalRevenue.toFixed(2)}</strong></p>
      <p>Toplam Kar: <strong>₺${totalProfit.toFixed(2)}</strong></p>
    `;
  } catch {
    alert("Rapor alınamadı");
  }
}

// 🔌 Gerçek zamanlı: Emit + Socket.io
function emitUpdate() {
  if (window.io && window.socket) window.socket.emit("update");
}

// 🔧 Sayfa yüklendiğinde
fetchProducts();

// 🧩 Socket bağlantısı
if (window.io) {
  window.socket = io("https://ozturkoto52.onrender.com");
  window.socket.on("update", fetchProducts);
}

// 📑 Sekme geçişi ve buton event’leri
document.querySelectorAll(".tab").forEach(t => {
  t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    document.querySelectorAll(".tabContent").forEach(c => c.style.display = "none");
    document.getElementById(t.dataset.tab).style.display = "block";
  });
});

// 🔘 Ara, Temizle, Rapor al butonlarına bağlanıyor
document.getElementById("searchBtn").addEventListener("click", applySearchFilters);
document.getElementById("clearBtn").addEventListener("click", resetSearchFilters);
document.getElementById("reportBtn").addEventListener("click", getSalesReport);




