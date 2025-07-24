const API = "/api/products";
const token = () => sessionStorage.getItem("token");

const form = document.getElementById("productForm");
const ul = document.getElementById("productsUl");
let products = [];

// Ürün ekleme / güncelleme
form.onsubmit = async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const isUpdate = Boolean(data.id);
  if (!data.id) delete data.id;

  ["quantity", "minQuantity"].forEach(k => data[k] = parseInt(data[k]) || 0);
  ["buyPrice", "sellPrice"].forEach(k => data[k] = parseFloat(data[k]) || 0);
  data.codes = data.codes ? data.codes.split(",").map(s => s.trim()) : [];

  // Aynı ürün adı varsa ve ekleme ise hata ver
  const nameExists = products.some(p =>
    p.name.toLowerCase() === data.name.toLowerCase() &&
    (!isUpdate || p._id !== data.id)
  );

  if (nameExists) {
    alert("Aynı isimde bir ürün zaten mevcut.");
    return;
  }

  try {
    const res = await fetch(API + (isUpdate ? `/${data.id}` : ""), {
      method: isUpdate ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token()
      },
      body: JSON.stringify(data)
    });

    const body = await res.json();
    if (!res.ok) throw new Error(body.message);

    if (isUpdate) {
      products = products.map(p => p._id === body._id ? body : p);
    } else {
      products.push(body);
    }

    resetForm();
    alert("✔ Başarılı!");
  } catch (err) {
    alert("❌ Hata: " + err.message);
  }
};

// Ürünleri çek
async function fetchProducts() {
  try {
    const res = await fetch(API, {
      headers: { "Authorization": "Bearer " + token() }
    });
    if (!res.ok) throw new Error("Yetki veya bağlantı hatası");
    products = await res.json();
    renderList(products);
  } catch (err) {
    alert("Ürünler getirilemedi: " + err.message);
  }
}

// Listeleme
function renderList(list) {
  ul.innerHTML = "";
  list.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${p.name}</strong> (${p.quantity})
      <div>
        <button onclick="edit('${p._id}')">D</button>
        <button onclick="del('${p._id}')">S</button>
      </div>`;
    if (p.minQuantity > 0 && p.quantity <= p.minQuantity)
      li.classList.add("critical-stock");
    ul.appendChild(li);
  });
}

// Düzenle
window.edit = id => {
  const p = products.find(x => x._id === id);
  Object.entries(p).forEach(([k, v]) => {
    const el = form.elements[k];
    if (el) el.value = Array.isArray(v) ? v.join(", ") : v;
  });
};

// Sil
window.del = async id => {
  if (!confirm("Silmek istediğinize emin misiniz?")) return;
  await fetch(API + "/" + id, {
    method: "DELETE",
    headers: { "Authorization": "Bearer " + token() }
  });
  products = products.filter(p => p._id !== id);
  renderList(products);
};

// Filtreleme işlemi
function applySearchFilters() {
  const key = turkishLower(document.getElementById("filterKeyword").value);
  const cat = document.getElementById("filterCategory").value;
  const brand = document.getElementById("filterBrand").value;
  const type = document.getElementById("filterType").value;
  const onlyCritical = document.getElementById("onlyCriticalStock").checked;

  const fromDate = document.getElementById("filterFromDate").value;
  const toDate = document.getElementById("filterToDate").value;

  const filtered = products.filter(p => {
    const mk = !key || p.name.toLowerCase().includes(key) ||
      (p.codes || []).join(", ").toLowerCase().includes(key) ||
      (p.description || "").toLowerCase().includes(key);

    const mc = !cat || p.category === cat;
    const mb = !brand || p.brand === brand;
    const mt = !type || p.type === type;
    const mcrit = !onlyCritical || (p.minQuantity && p.quantity <= p.minQuantity);

    const created = new Date(p.createdAt);
    const mf = !fromDate || created >= new Date(fromDate);
    const mtodate = !toDate || created <= new Date(toDate);

    return mk && mc && mb && mt && mcrit && mf && mtodate;
  });

  renderList(filtered);
  document.getElementById("filterMatches").innerText = `${filtered.length} ürün bulundu.`;
}

// Reset
function resetSearchFilters() {
  ["filterKeyword", "filterCategory", "filterBrand", "filterType", "filterFromDate", "filterToDate"].forEach(id =>
    document.getElementById(id).value = ""
  );
  document.getElementById("onlyCriticalStock").checked = false;
  document.getElementById("filterMatches").innerText = "";
  renderList(products);
}

// Form temizle
function resetForm() {
  form.reset();
  form.elements.id.value = "";
  fetchProducts();
}

// Enter tuşuyla da arama
document.getElementById("filterKeyword").addEventListener("keypress", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    applySearchFilters();
  }
});

// Arama düğmeleri
document.getElementById("filterBtn").onclick = applySearchFilters;
document.getElementById("clearBtn").onclick = resetSearchFilters;
document.getElementById("clearFormBtn").onclick = resetForm;

// Türkçe küçük harf
function turkishLower(str) {
  return str.toLocaleLowerCase("tr-TR");
}

// Rapor
document.getElementById("reportBtn").onclick = async () => {
  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;
  const res = await fetch(`/api/products/sales-report?from=${from}&to=${to}`, {
    headers: { "Authorization": "Bearer " + token() }
  });
  const json = await res.json();
  document.getElementById("reportResult").innerText = JSON.stringify(json, null, 2);
};

// Sayfa yüklenince ürünleri getir
document.addEventListener("DOMContentLoaded", fetchProducts);

// Socket ile anlık güncelleme
const socket = io();
socket.on("update", fetchProducts);
