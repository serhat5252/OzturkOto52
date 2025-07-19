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

  ["quantity","buyPrice","sellPrice"].forEach(k => data[k] = k==="quantity" ? parseInt(data[k]) : parseFloat(data[k]));
  data.codes = data.codes.split(',').map(s=>s.trim());
  data.createdAt = data.createdAt || new Date().toISOString();

  try {
    const duplicate = products.find(p => p.name === data.name && p.category === data.category);
    if (!id && duplicate) {
      if (!confirm("Bu ürün zaten var. Üzerine yazmak ister misiniz?")) return;
      data.id = duplicate._id;
    }

    let res;
    if (data.id || id)
      res = await fetch(`${API}/${data.id || id}`, { method:"PUT", headers:headers(), body:JSON.stringify(data) });
    else
      res = await fetch(API, { method:"POST", headers:headers(), body:JSON.stringify(data) });

    if (!res.ok) {
      alert("Hata: " + (await res.json()).message);
      return;
    }

    const saved = await res.json();
    const isEdit = id || data.id;
    if (isEdit)
      products = products.map(p => p._id === saved._id ? saved : p);
    else
      products.push(saved);

    renderProducts();
    form.reset();
    form.id.value = "";
  } catch(err) {
    alert("Sunucu hatası");
    console.error(err);
  }
};

// ÜRÜNLERİ GETİR
async function fetchProducts(){
  try {
    const res = await fetch(API,{ headers:headers() });
    if (!res.ok) throw "";
    products = await res.json();
    renderProducts([]);
  } catch(err){
    alert("Ürünler alınamadı");
    console.error(err);
  }
}

// ÜRÜNLERİ LİSTELE
function renderProducts(list = products) {
  productList.innerHTML = "";
  list.forEach(p => {
    const lastSale = p.sales?.length ? p.sales[p.sales.length - 1].price : p.sellPrice;
    const li = document.createElement("li");
    li.innerHTML = `
      <h3>${p.name} <small>${p.category} | ${p.brand}</small></h3>
      <div>Adet: ${p.quantity} | Raf: ${p.shelf}</div>
      <div>Alış: ₺${p.buyPrice.toFixed(2)} | Son Satış: ₺${lastSale.toFixed(2)}</div>
      <div>Kodlar: ${(p.codes || []).join(", ")}</div>
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

// ÜRÜN SİL
async function deleteProduct(id){
  if(!confirm("Silinsin mi?")) return;
  await fetch(`${API}/${id}`,{ method:"DELETE", headers:headers() });
  products = products.filter(p=>p._id!==id);
  renderProducts();
}

// FORM DOLDUR DÜZENLEME İÇİN
function prepareEdit(id){
  const p = products.find(x=>x._id===id);
  Object.keys(p).forEach(k => {
    if(form.elements[k]) form.elements[k].value = Array.isArray(p[k]) ? p[k].join(', ') : p[k];
  });
  form.id.value = id;

  // sekmeyi formTab yap
  document.querySelectorAll('.tab').forEach(el => {
  el.onclick = () => {
    // aktif sekmeyi güncelle
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    // içerik alanlarını göster/gizle
    document.querySelectorAll('.tabContent').forEach(c => c.style.display = 'none');
    document.getElementById(el.dataset.tab).style.display = 'block';
  };
});


  window.scrollTo({ top:0, behavior:"smooth" });
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

// DETAYLI ARAMA
function applySearchFilters() {
  const fKey = document.getElementById("filterKeyword").value.trim().toLowerCase();
  const fCat = document.getElementById("filterCategory").value;
  const fBrand = document.getElementById("filterBrand").value;

  const filtered = products.filter(p => {
    const matchKey = !fKey || (
      p.name.toLowerCase().includes(fKey) ||
      p.description.toLowerCase().includes(fKey) ||
      (p.codes || []).some(c => c.toLowerCase().includes(fKey))
    );
    const matchCat = !fCat || p.category === fCat;
    const matchBrand = !fBrand || p.brand === fBrand;
    return matchKey && matchCat && matchBrand;
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

// SATIŞ RAPORU
function getSalesReport() {
  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;
  if (!from || !to) return alert("Lütfen tarih aralığı girin.");

  const sales = products.flatMap(p => p.sales?.map(s => ({...s, name: p.name})) || []);
  const filtered = sales.filter(s => s.date >= from && s.date <= to);

  const summary = filtered.reduce((acc, s) => {
    acc.totalQty += s.quantity;
    acc.totalPrice += s.quantity * s.price;
    return acc;
  }, { totalQty: 0, totalPrice: 0 });

  alert(`📊 ${filtered.length} satış kaydı bulundu.\nToplam: ${summary.totalQty} adet\nToplam Gelir: ₺${summary.totalPrice.toFixed(2)}`);
}

// FORM TEMİZLE
document.getElementById("clearFormBtn").onclick = () => {
  form.reset();
  form.id.value = "";
};

// GİRİŞTE ÜRÜNLERİ ÇEK
fetchProducts();

// SOCKET
if (window.io) {
  const socket = io("https://ozturkoto52.onrender.com");
  socket.on("update", () => fetchProducts());
}

