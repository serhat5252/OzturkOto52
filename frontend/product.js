// Sadece şu şekilde yaz:
const API = "/api/products";
const API = "https://ozturkoto52.onrender.com/api/products";
const socket = io("https://my-stok-app.up.railway.app");
const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`
});

const form = document.getElementById("productForm"),
      productList = document.getElementById("productsUl"),
      searchInput = document.getElementById("searchInput"),
      currentUser = document.getElementById("currentUser");

if (currentUser) currentUser.innerText = localStorage.getItem("username");

let products = [];

// ÜRÜN EKLEME / GÜNCELLEME
form.onsubmit = async e => {
  req.app.get("io").emit("update");
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const id = data.id; delete data.id;
  ["quantity","buyPrice","sellPrice"].forEach(k => data[k] = k==="quantity" ? parseInt(data[k]) : parseFloat(data[k]));
  data.codes = data.codes.split(',').map(s=>s.trim());
  data.createdAt = data.createdAt || new Date().toISOString();

  try {
    let res;
    if (id) res = await fetch(`${API}/${id}`, { method:"PUT", headers:headers(), body:JSON.stringify(data) });
    else res = await fetch(API, { method:"POST", headers:headers(), body:JSON.stringify(data) });

    if (!res.ok) { alert("Hata: " + (await res.json()).message); return; }

    const saved = await res.json();
    if (id) products = products.map(p => p._id===id ? saved : p);
    else products.push(saved);

    renderProducts();
    form.reset();
    form.id.value = "";
  } catch(err) {
    alert("Sunucu hatası"); console.error(err);
  }
};

// ÜRÜNLERİ GETİR
async function fetchProducts(){
  try {
    const res = await fetch(API,{ headers:headers() });
    if (!res.ok) throw "";
    products = await res.json();
  } catch(err){
    alert("Ürünler alınamadı"); console.error(err);
  }
}

// ÜRÜNLERİ FİLTRELE VE GÖSTER
function applySearchFilters() {
  const fKey = document.getElementById("filterKeyword").value.toLowerCase();
  const fCat = document.getElementById("filterCategory").value;
  const fBrand = document.getElementById("filterBrand").value;
  const fAddFrom = document.getElementById("filterAddedFrom").value;
  const fAddTo = document.getElementById("filterAddedTo").value;
  const fSoldFrom = document.getElementById("filterSoldFrom").value;
  const fSoldTo = document.getElementById("filterSoldTo").value;
  const fPriceMin = parseFloat(document.getElementById("filterPriceMin").value) || null;
  const fPriceMax = parseFloat(document.getElementById("filterPriceMax").value) || null;

  let count = 0;
  productList.innerHTML = "";

  products.filter(p => {
    const keywordMatch = !fKey || [p.name, p.description, ...(p.codes || [])].some(x => x?.toLowerCase().includes(fKey));
    const categoryMatch = !fCat || p.category === fCat;
    const brandMatch = !fBrand || p.brand === fBrand;

    const added = new Date(p.createdAt);
    const addFromMatch = !fAddFrom || added >= new Date(fAddFrom);
    const addToMatch = !fAddTo || added <= new Date(fAddTo);

    const priceMinMatch = fPriceMin === null || p.sellPrice >= fPriceMin;
    const priceMaxMatch = fPriceMax === null || p.sellPrice <= fPriceMax;

    const soldInRangeMatch = !(fSoldFrom || fSoldTo) || (p.sales || []).some(sale => {
      const date = new Date(sale.date);
      if (fSoldFrom && date < new Date(fSoldFrom)) return false;
      if (fSoldTo && date > new Date(fSoldTo)) return false;
      return true;
    });

    return keywordMatch && categoryMatch && brandMatch &&
           addFromMatch && addToMatch &&
           priceMinMatch && priceMaxMatch &&
           soldInRangeMatch;
  }).forEach(p => {
    count++;
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
      </div>`;
    productList.appendChild(li);
  });

  document.getElementById("filterMatches").innerText = `${count} ürün bulundu.`;
}

function resetSearchFilters() {
  ["filterKeyword", "filterCategory", "filterBrand",
   "filterAddedFrom", "filterAddedTo", "filterSoldFrom",
   "filterSoldTo", "filterPriceMin", "filterPriceMax"]
   .forEach(id => document.getElementById(id).value = "");

  document.getElementById("filterMatches").innerText = "";
  productList.innerHTML = "";
}

// ÜRÜN SİL
async function deleteProduct(id){
  req.app.get("io").emit("update");
  if(!confirm("Silinsin mi?")) return;
  await fetch(`${API}/${id}`,{ method:"DELETE", headers:headers() });
  products = products.filter(p=>p._id!==id);
  renderProducts();
}

// FORM DOLDUR DÜZENLEME İÇİN
function prepareEdit(id){
  req.app.get("io").emit("update");
  const p = products.find(x=>x._id===id);
  Object.keys(p).forEach(k => {
    if(form.elements[k]) form.elements[k].value = Array.isArray(p[k]) ? p[k].join(', ') : p[k];
  });
  form.id.value = id;
  window.scrollTo({ top:0, behavior:"smooth" });
}

// SATIŞ YAP
async function sellProduct(id) {
  req.app.get("io").emit("update");
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
    alert("Bağlantı hatası");
    console.error(err);
  }
}

// DETAY GÖSTER
function viewDetails(id){
  const p = products.find(x=>x._id===id);
  let msg = `${p.name}\nAdet: ${p.quantity}\nAlış: ₺${p.buyPrice}\nSatış: ₺${p.sellPrice}\nKodlar: ${(p.codes||[]).join(', ')}\nAçıklama: ${p.description}\nEklenme: ${new Date(p.createdAt).toLocaleString()}`;
  if(p.sales?.length){
    msg += `\n\n🛒 Satış Geçmişi:`;
    p.sales.forEach((s,i)=> {
      msg += `\n${i+1}. ${s.quantity} adet ₺${s.price} – ${new Date(s.date).toLocaleString()}`;
    });
  }
  alert(msg);
}

function logout(){
  localStorage.clear();
  location.href="index.html";
}

// Sayfa yüklendiğinde sadece veri çek ama listeleme yapma
fetchProducts();

// Eğer gerçek zamanlı destek varsa:
if (window.io) {
  const socket = io();
  socket.on("update", () => fetchProducts());
}

