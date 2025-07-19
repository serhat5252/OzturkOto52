// 🔗 Konfigürasyon
const API = "https://ozturkoto52.onrender.com/api/products";
const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`
});

const form = document.getElementById("productForm");
const productList = document.getElementById("productsUl");
const currentUser = document.getElementById("currentUser");

let products = [];

form.onsubmit = async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const id = data.id;
  delete data.id;
  ["quantity","buyPrice","sellPrice"].forEach(k =>
    data[k] = k === "quantity" ? parseInt(data[k]) : parseFloat(data[k])
  );
  data.codes = data.codes.split(',').map(s => s.trim());

  const exists = products.find(p => p.name === data.name && p._id !== id);
  if (exists && !confirm("Bu isimde ürün zaten var. Üstüne eklemek ister misin?")) return;

  try {
    const res = await fetch(`${API}${id?"/"+id:""}`, {
      method: id?"PUT":"POST",
      headers: headers(),
      body: JSON.stringify(data)
    });
    if (!res.ok) { alert((await res.json()).message); return; }
    const saved = await res.json();

    if (id) products = products.map(p => p._id === id ? saved : p);
    else products.push(saved);

    form.reset(); form.id.value = '';
    renderProducts();
  } catch (err) {
    alert("Sunucu hatası");
    console.error(err);
  }
};

async function fetchProducts() {
  try {
    const res = await fetch(API, { headers: headers() });
    if (!res.ok) throw "";
    products = await res.json();
  } catch {
    alert("Ürünler alınamadı");
    products = [];
  }
}

function renderProducts(list = products) {
  productList.innerHTML = "";
  if (!list.length) return productList.style.display = "none";
  productList.style.display = "block";
  list.forEach(p => {
    const lastSale = p.sales?.length ? p.sales.at(-1).price : p.sellPrice;
    const li = document.createElement("li");
    li.innerHTML = `
      <h3>${p.name}</h3>
      <div>Adet: ${p.quantity} | Raf: ${p.shelf || "-"}</div>
      <div>Alış: ₺${p.buyPrice.toFixed(2)} | Son Satış: ₺${lastSale.toFixed(2)}</div>
      <div>Kodlar: ${p.codes.join(", ")}</div>
      <p>${p.description}</p>
      <div class="actions">
        <button onclick="onEdit('${p._id}')">Düzenle</button>
        <button onclick="sellProduct('${p._id}')">Sat</button>
        <button onclick="onDelete('${p._id}')">Sil</button>
        <button onclick="onDetails('${p._id}')">Detay</button>
      </div>`;
    productList.appendChild(li);
  });
}

function onEdit(id) {
  const p = products.find(x => x._id === id);
  for (let k in p) if (form.elements[k]) form.elements[k].value = Array.isArray(p[k]) ? p[k].join(', ') : p[k];
  form.id.value = id;
  document.querySelector('.tab[data-tab="formTab"]').click();
}

function onDetails(id) {
  const p = products.find(x => x._id === id);
  let msg = `${p.name}\nAdet: ${p.quantity}\nAlış: ₺${p.buyPrice}\nSatış: ₺${p.sellPrice}\nKodlar: ${p.codes.join(', ')}\nAçıklama: ${p.description}`;
  if (p.sales?.length) {
    msg += "\n\n🛒 Satış Geçmişi:";
    p.sales.forEach((s,i) => alert(`${i+1}. ${s.quantity} adet ₺${s.price} – ${new Date(s.date).toLocaleString()}`));
  }
  alert(msg);
}

async function onDelete(id) {
  if (!confirm("Silinsin mi?")) return;
  await fetch(`${API}/${id}`, { method:"DELETE", headers: headers() });
  products = products.filter(p => p._id !== id);
  renderProducts();
}

async function sellProduct(id) {
  const p = products.find(x => x._id === id);
  const qty = parseInt(prompt("Kaç adet satıldı?", "1"));
  if (isNaN(qty) || qty < 1) return;
  const price = parseFloat(prompt("Satış fiyatı?", p.sellPrice));
  if (isNaN(price)) return;
  const res = await fetch(`${API}/${id}/sell`, {
    method:"POST",
    headers: headers(),
    body: JSON.stringify({ quantity: qty, price })
  });
  if (!res.ok) { alert("Satış başarısız"); return; }
  const updated = await res.json();
  products = products.map(p => p._id===id ? updated : p);
  renderProducts();
}

function logout() {
  localStorage.clear();
  location.reload();
}

// SATIŞ RAPORU
function getSalesReport() {
  const from = document.getElementById('fromDate').value;
  const to = document.getElementById('toDate').value;
  let total = 0, income = 0;
  products.forEach(p => {
    p.sales?.forEach(s => {
      const d = s.date.split('T')[0];
      if ((!from || d >= from) && (!to || d <= to)) {
        total += s.quantity;
        income += s.quantity * s.price;
      }
    });
  });
  document.getElementById('reportResult').innerText = `Satılan Adet: ${total}, Gelir: ₺${income.toFixed(2)}`;
}
window.onload = function() {
  // Yukarıdaki tab kodu buraya
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const selectedTab = tab.getAttribute('data-tab');

    document.querySelectorAll('.tabContent').forEach(tc => {
      tc.style.display = (tc.id === selectedTab) ? 'block' : 'none';
    });
  });
});

};


// Başlangıç verileri
fetchProducts();
if (window.io) {
  io("https://ozturkoto52.onrender.com").on("update", fetchProducts);
}
