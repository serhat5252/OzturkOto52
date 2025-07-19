const API = "https://ozturkoto52.onrender.com/api/products";
const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`
});

const form = document.getElementById("productForm"),
      productList = document.getElementById("productsUl"),
      currentUser = document.getElementById("currentUser");

if (currentUser) currentUser.innerText = localStorage.getItem("username");

let products = [];

// ÜRÜN EKLEME / GÜNCELLEME
form.onsubmit = async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const id = data.id; delete data.id;
  ["quantity","buyPrice","sellPrice"].forEach(k =>
    data[k] = k==="quantity" ? parseInt(data[k]) : parseFloat(data[k])
  );
  data.codes = data.codes.split(',').map(s=>s.trim());
  data.createdAt = data.createdAt || new Date().toISOString();

  try {
    const res = id
      ? await fetch(`${API}/${id}`, { method: "PUT", headers: headers(), body: JSON.stringify(data) })
      : await fetch(API, { method: "POST", headers: headers(), body: JSON.stringify(data) });

    if (!res.ok) {
      const err = await res.json();
      alert("Hata: " + err.message); return;
    }

    const saved = await res.json();
    if (id) products = products.map(p => p._id === id ? saved : p);
    else products.push(saved);

    renderProducts();
    form.reset();
    form.id.value = "";
  } catch(error) {
    console.error(error);
    alert("Sunucu hatası!");
  }
};

// ÜRÜNLERİ GETİR
async function fetchProducts(){
  try {
    const res = await fetch(API, { headers: headers() });
    if (!res.ok) throw "";
    products = await res.json();
    renderProducts();
  } catch(err){
    console.error(err);
    alert("Ürünler alınamadı!");
  }
}

// ÜRÜNLERİ LİSTELE
function renderProducts(){
  productList.innerHTML = "";
  products.forEach(p => {
    const lastSale = p.sales?.length ? p.sales[p.sales.length - 1].price : p.sellPrice;
    const li = document.createElement("li");
    li.innerHTML = `
      <h3>${p.name} <small>${p.category} | ${p.brand}</small></h3>
      <div><strong>Adet:</strong> ${p.quantity} | <strong>Raf:</strong> ${p.shelf}</div>
      <div><strong>Alış:</strong> ₺${p.buyPrice.toFixed(2)} | <strong>Son Satış:</strong> ₺${lastSale.toFixed(2)}</div>
      <div><strong>Kodlar:</strong> ${(p.codes || []).join(', ')}</div>
      <p>${p.description}</p>
      <div class="actions">
        <button onclick="prepareEdit('${p._id}')">Düzenle</button>
        <button onclick="sellProduct('${p._id}')">Sat</button>
        <button onclick="deleteProduct('${p._id}')">Sil</button>
        <button onclick="viewDetails('${p._id}')">Detay</button>
      </div>
    `;
    productList.appendChild(li);
  });
}

// ÜRÜN SİL
async function deleteProduct(id){
  if (!confirm("Silinsin mi?")) return;
  await fetch(`${API}/${id}`, { method: "DELETE", headers: headers() });
  products = products.filter(p => p._id !== id);
  renderProducts();
}

// FORM DOLDURMA
function prepareEdit(id){
  const p = products.find(x => x._id === id);
  Object.keys(p).forEach(k => {
    if (form.elements[k]) {
      form.elements[k].value = Array.isArray(p[k]) ? p[k].join(', ') : p[k];
    }
  });
  form.id.value = id;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// SATIŞ YAP
async function sellProduct(id) {
  const product = products.find(p => p._id === id);
  const qty = parseInt(prompt("Kaç adet satıldı?", "1"));
  if (isNaN(qty) || qty < 1) return;

  const price = parseFloat(prompt("Kaç ₺ den satıldı?", product.sellPrice));
  if (isNaN(price) || price < 0) return;

  try {
    const res = await fetch(`${API}/${id}/sell`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ quantity: qty, price })
    });

    if (!res.ok) {
      const err = await res.json();
      alert("Satış yapılamadı: " + err.message);
      return;
    }

    const updated = await res.json();
    const index = products.findIndex(p => p._id === id);
    if (index !== -1) products[index] = updated;

    renderProducts();
  } catch (err) {
    console.error(err);
    alert("Bağlantı hatası");
  }
}

// DETAY GÖSTER
function viewDetails(id) {
  const p = products.find(x => x._id === id);
  let msg = `${p.name}\nAdet: ${p.quantity}\nAlış: ₺${p.buyPrice}\nSatış: ₺${p.sellPrice}\nKodlar: ${(p.codes || []).join(', ')}\nAçıklama: ${p.description}\nEklenme: ${new Date(p.createdAt).toLocaleString()}`;
  if (p.sales?.length) {
    msg += `\n\n🛒 Satış Geçmişi:`;
    p.sales.forEach((s, i) => {
      msg += `\n${i + 1}. ${s.quantity} adet ₺${s.price} – ${new Date(s.date).toLocaleString()}`;
    });
  }
  alert(msg);
}

// DETAYLI ARAMA UYGULA
function applySearchFilters() {
  const keyword = document.getElementById("filterKeyword").value.toLowerCase();
  const category = document.getElementById("filterCategory").value;
  const brand = document.getElementById("filterBrand").value;
  const addedFrom = document.getElementById("filterAddedFrom").value;
  const addedTo = document.getElementById("filterAddedTo").value;
  const soldFrom = document.getElementById("filterSoldFrom").value;
  const soldTo = document.getElementById("filterSoldTo").value;
  const minPrice = parseFloat(document.getElementById("filterPriceMin").value);
  const maxPrice = parseFloat(document.getElementById("filterPriceMax").value);

  const matches = products.filter(p => {
    if (keyword && !(p.name.toLowerCase().includes(keyword) || p.codes?.join(",").toLowerCase().includes(keyword))) return false;
    if (category && p.category !== category) return false;
    if (brand && p.brand !== brand) return false;
    if (addedFrom && new Date(p.createdAt) < new Date(addedFrom)) return false;
    if (addedTo && new Date(p.createdAt) > new Date(addedTo)) return false;
    if (!isNaN(minPrice) && p.sellPrice < minPrice) return false;
    if (!isNaN(maxPrice) && p.sellPrice > maxPrice) return false;

    if (soldFrom || soldTo) {
      if (!p.sales?.length) return false;
      const lastSale = new Date(p.sales[p.sales.length - 1].date);
      if (soldFrom && lastSale < new Date(soldFrom)) return false;
      if (soldTo && lastSale > new Date(soldTo)) return false;
    }

    return true;
  });

  productList.innerHTML = "";
  matches.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${p.name}</strong> - ${p.category} - ${p.brand} - ₺${p.sellPrice}`;
    productList.appendChild(li);
  });

  const resultCount = document.getElementById("filterMatches");
  if (resultCount) {
    resultCount.textContent = `${matches.length} sonuç bulundu.`;
  }
}

// TEMİZLE
function resetSearchFilters() {
  document.getElementById("filterKeyword").value = "";
  document.getElementById("filterCategory").value = "";
  document.getElementById("filterBrand").value = "";
  document.getElementById("filterAddedFrom").value = "";
  document.getElementById("filterAddedTo").value = "";
  document.getElementById("filterSoldFrom").value = "";
  document.getElementById("filterSoldTo").value = "";
  document.getElementById("filterPriceMin").value = "";
  document.getElementById("filterPriceMax").value = "";
  applySearchFilters();
}

// SAYFA YÜKLENDİĞİNDE
fetchProducts();

// SOCKET.IO
if (window.io) {
  const socket = io("https://ozturkoto52.onrender.com");
  socket.on("update", fetchProducts);
}



