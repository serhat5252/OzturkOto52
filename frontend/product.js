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

  // Numeric dönüştürme
  ["quantity","buyPrice","sellPrice"].forEach(k => {
    data[k] = k==="quantity" ? parseInt(data[k]) : parseFloat(data[k]);
  });
  data.codes = data.codes.split(',').map(s=>s.trim());
  data.createdAt = data.createdAt || new Date().toISOString();

  try {
    // Duplicate kontrolü
    const duplicate = products.find(p => p.name === data.name && p.category === data.category);
    if (!id && duplicate) {
      if (!confirm("Bu ürün zaten var. Üzerine yazmak ister misiniz?")) return;
      data.id = duplicate._id;
    }

    // POST veya PUT
    const url = `${API}/${data.id || id || ""}`;
    const opt = data.id ? { method:"PUT" } : { method:"POST" };
    const res = await fetch(url, { ...opt, headers:headers(), body:JSON.stringify(data) });
    if (!res.ok) { alert("Hata: " + (await res.json()).message); return; }

    const saved = await res.json();
    if (data.id || id) {
      products = products.map(p => p._id === saved._id ? saved : p);
    } else {
      products.push(saved);
    }

    form.reset();
    form.id.value = "";
    renderProducts([]);
  } catch(err) {
    alert("Sunucu hatası");
    console.error(err);
  }
};

// ÜRÜNLERİ GETİR
async function fetchProducts(){
  try {
    const res = await fetch(API, { headers: headers() });
    if (!res.ok) throw "";
    products = await res.json();
    renderProducts([]); // başlangıçta liste yok
  } catch(err) {
    alert("Ürünler alınamadı");
    console.error(err);
  }
}

// ÜRÜNLERİ LİSTELE
function renderProducts(list = []) {
  productList.innerHTML = "";
  if (list.length === 0) {
    productList.style.display = "none";
    return;
  }
  productList.style.display = "block";
  list.forEach(p => {
    const lastSale = p.sales?.length ? p.sales[p.sales.length-1].price : p.sellPrice;
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
    productList.appendChild(li);
  });
}

// Ürün delete ve edit fonksiyonları...
// ...

function prepareEdit(id){
  const p = products.find(x=>x._id===id);
  Object.keys(p).forEach(k => {
    if(form.elements[k]) form.elements[k].value = Array.isArray(p[k]) ? p[k].join(', ') : p[k];
  });
  form.id.value = id;

  // Sekme geçişi
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelector('[data-tab="formTab"]').classList.add('active');
  document.querySelectorAll('.tabContent').forEach(tc => {
    tc.style.display = tc.id === "formTab" ? "block" : "none";
  });
  productList.style.display = "none";
}

// Arama & temizle fonksiyonları
function applySearchFilters() {
  const fKey = document.getElementById("filterKeyword").value.trim().toLowerCase();
  const fCat = document.getElementById("filterCategory").value;
  const fBrand = document.getElementById("filterBrand").value;
  const filtered = products.filter(p => {
    const keyMatch = !fKey || (
      p.name.toLowerCase().includes(fKey) ||
      p.description.toLowerCase().includes(fKey) ||
      (p.codes||[]).some(c => c.toLowerCase().includes(fKey))
    );
    return keyMatch &&
           (!fCat || p.category === fCat) &&
           (!fBrand || p.brand === fBrand);
  });
  renderProducts(filtered);
  document.getElementById("filterMatches").innerText = `${filtered.length} ürün bulundu.`;
}

function resetSearchFilters() {
  document.getElementById("filterKeyword").value = "";
  document.getElementById("filterCategory").value = "";
  document.getElementById("filterBrand").value = "";
  renderProducts([]);
  document.getElementById("filterMatches").innerText = "";
}

// Satış raporu fonksiyonu
function getSalesReport() {
  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;
  if (!from || !to) return alert("Lütfen tarih aralığı girin.");
  const sales = products.flatMap(p => p.sales?.map(s => ({...s, name:p.name}))||[]);
  const filtered = sales.filter(s => s.date >= from && s.date <= to);
  const summary = filtered.reduce((acc,s) => {
    acc.totalQty += s.quantity;
    acc.totalPrice += s.quantity * s.price;
    return acc;
  }, {totalQty:0, totalPrice:0});
  alert(`📊 ${filtered.length} satış.\nAdet: ${summary.totalQty}\nGelir: ₺${summary.totalPrice.toFixed(2)}`);
}

// Sekme kontrolü
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.tabContent').forEach(c => {
      c.style.display = c.id === tab.dataset.tab ? "block" : "none";
    });
    productList.style.display = tab.dataset.tab === "formTab" ? "none" : "block";
  });
});

// Form temizle butonu
document.getElementById("clearFormBtn").onclick = () => {
  form.reset();
  form.id.value = "";
};

// Veri çek ve socket
fetchProducts();
if (window.io) {
  const socket = io("https://ozturkoto52.onrender.com");
  socket.on("update", () => fetchProducts());
}



