// 🔗 Konfigürasyon
const API = "https://ozturkoto52.onrender.com/api/products";
const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`
});

const form = document.getElementById("productForm"),
      productList = document.getElementById("productsUl"),
      currentUser = document.getElementById("currentUser");

let products = [];

// Ürün Ekleme / Güncelleme
form.onsubmit = async e => {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(form));
  const id = data.id;
  delete data.id;
  ["quantity", "buyPrice", "sellPrice"].forEach(k =>
    data[k] = k === "quantity" ? parseInt(data[k]) : parseFloat(data[k])
  );
  data.codes = data.codes.split(',').map(s => s.trim());

  // Aynı isimde ürün varsa kontrol et
  const exists = products.find(p => p.name === data.name && p._id !== id);
  if (exists) {
    if (!confirm("Bu isimde bir ürün zaten var. Üstüne eklemek istediğini onayla.")) {
      return;
    }
    data.quantity += exists.quantity;
    data.buyPrice = (data.buyPrice + exists.buyPrice) / 2;
  }

  try {
    let res = await fetch(`${API}${id ? "/" + id : ""}`, {
      method: id ? "PUT" : "POST",
      headers: headers(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.message || "Hata!");
      return;
    }
    const saved = await res.json();

    if (id) {
      const idx = products.findIndex(p => p._id === id);
      products[idx] = saved;
      // Düzenleme yaptığı için düzenle sekmesine geç
      document.querySelector('.tab[data-tab="formTab"]').click();
    }
    else products.push(saved);

    resetForm();
    renderProducts(products);

  } catch (err) {
    alert("Sunucu hatası");
    console.error(err);
  }
};

// Ürünleri çek
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

// Listeleme
function renderProducts(list = []) {
  productList.innerHTML = "";

  if (!list.length) {
    productList.style.display = "none";
    return;
  }

  productList.style.display = "block";
  list.forEach(p => {
    const lastSale = p.sales?.length
      ? p.sales.at(-1).price
      : p.sellPrice;
    const li = document.createElement("li");
    li.innerHTML = `
      <h3>${p.name} <small>${p.category} | ${p.brand}</small></h3>
      <div>Adet: ${p.quantity} | Raf: ${p.shelf}</div>
      <div>Alış: ₺${p.buyPrice.toFixed(2)} | Son Satış: ₺${lastSale.toFixed(2)}</div>
      <div>Kodlar: ${(p.codes||[]).join(", ")}</div>
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

// Düzenle düğmesi
function onEdit(id) {
  const p = products.find(x => x._id === id);
  Object.keys(p).forEach(k => {
    if (form.elements[k]) {
      form.elements[k].value = Array.isArray(p[k]) ? p[k].join(', ') : p[k];
    }
  });
  form.id.value = id;
  document.querySelector('.tab[data-tab="formTab"]').click();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Detay düğmesi
function onDetails(id) {
  const p = products.find(x => x._id === id);
  let msg = `${p.name}\nAdet: ${p.quantity}\nAlış: ₺${p.buyPrice}\nSatış: ₺${p.sellPrice}\nKodlar: ${(p.codes||[]).join(', ')}\nAçıklama: ${p.description}`;
  if (p.sales?.length) {
    msg += "\n\n🛒 Satış Geçmişi:";
    p.sales.forEach((s,i) => {
      msg += `\n${i+1}. ${s.quantity} adet ₺${s.price} – ${new Date(s.date).toLocaleString()}`;
    });
  }
  alert(msg);
}

// Silme
async function onDelete(id) {
  if (!confirm("Silinsin mi?")) return;
  await fetch(`${API}/${id}`, {
    method: "DELETE",
    headers: headers()
  });
  products = products.filter(p => p._id !== id);
  renderProducts(products);
}

// Satış yap
async function sellProduct(id) {
  const p = products.find(x => x._id === id);
  const qty = parseInt(prompt("Kaç adet satıldı?", "1"));
  if (isNaN(qty) || qty < 1) return;
  const price = parseFloat(prompt("Kaç ₺ den satıldı?", p.sellPrice));
  if (isNaN(price) || price < 0) return;
  const res = await fetch(`${API}/${id}/sell`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ quantity:qty, price })
  });
  if (!res.ok) alert("Satış yapılamadı");
  else {
    const upd = await res.json();
    const idx = products.findIndex(x => x._id === id);
    products[idx] = upd;
    renderProducts(products);
  }
}

// Form temizleme
function resetForm() {
  form.reset();
  form.id.value = "";
}

// Sayfa yüklendiğinde
fetchProducts();

// SocketIO
if (window.io) {
  const socket = io("https://ozturkoto52.onrender.com");
  socket.on("update", () => { fetchProducts(); renderProducts(products); });
}
