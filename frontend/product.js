const API = "/api/products";
const token = () => sessionStorage.getItem("token");

const form = document.getElementById("productForm");
const ul = document.getElementById("productsUl");
let products = [];

form.onsubmit = async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const isUpdate = Boolean(data.id);
  if (!data.id) delete data.id;

  ["quantity","minQuantity"].forEach(k => data[k] = parseInt(data[k]) || 0);
  ["buyPrice","sellPrice"].forEach(k => data[k] = parseFloat(data[k]) || 0);
  data.codes = data.codes.split(",").map(s => s.trim());

  try {
    const res = await fetch(API + (isUpdate ? "/" + data.id : ""), {
      method: isUpdate ? "PUT" : "POST",
      headers: { "Content-Type":"application/json", "Authorization":"Bearer "+ token() },
      body: JSON.stringify(data)
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message);
    if (isUpdate) products = products.map(p => p._id === body._id ? body : p);
    else products.push(body);

    resetForm();
    alert("Başarılı!");
  } catch (err) {
    alert("Hata: " + err.message);
  }
};

async function fetchProducts(){
  try {
    const res = await fetch(API, { headers: { "Authorization":"Bearer "+token() } });
    if (!res.ok) throw new Error("Yetki veya bağlantı");
    products = await res.json();
    renderList(products);
  } catch(err) {
    alert("Ürün çekilemedi: " + err.message);
  }
}

function renderList(list){
  ul.innerHTML = "";
  document.getElementById("filterMatches").innerText = list.length + " ürün.";
  list.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${p.name}</strong> (${p.quantity}) 
      <button onclick="edit('${p._id}')">D</button>
      <button onclick="del('${p._id}')">S</button>`;
    if (p.minQuantity > 0 && p.quantity <= p.minQuantity) li.classList.add("critical-stock");
    ul.appendChild(li);
  });
}

window.edit = id => {
  const p = products.find(x=>x._id===id);
  Object.entries(p).forEach(([k,v]) => {
    const el = form.elements[k];
    if (el) el.value = Array.isArray(v) ? v.join(", ") : v;
  });
  document.querySelector('.tab[data-tab="formTab"]').click();
};

window.del = async id => {
  if (!confirm("Emin misin?")) return;
  await fetch(API + "/" + id, { method:"DELETE", headers:{ "Authorization":"Bearer "+token() } });
  products = products.filter(p=>p._id!==id);
  renderList(products);
};

function applySearchFilters() {
  const key = turkishLower(document.getElementById("filterKeyword").value);
  const cat = document.getElementById("filterCategory").value;
  const brand = document.getElementById("filterBrand").value;
  const onlyCritical = document.getElementById("onlyCriticalStock").checked;

  const filtered = products.filter(p => {
    const mk = !key || p.name.toLowerCase().includes(key) ||
               (p.codes||[]).join(', ').toLowerCase().includes(key) ||
               (p.description||'').toLowerCase().includes(key);
    const mc = !cat || p.category === cat;
    const mb = !brand || p.brand === brand;
    const mcrit = !onlyCritical || (p.minQuantity && p.quantity <= p.minQuantity);
    return mk && mc && mb && mcrit;
  });

  renderProducts(filtered);
  document.getElementById("filterMatches").innerText = `${filtered.length} ürün bulundu.`;
}

function resetSearchFilters() {
  document.getElementById("filterKeyword").value = "";
  document.getElementById("filterCategory").value = "";
  document.getElementById("filterBrand").value = "";
  document.getElementById("onlyCriticalStock").checked = false;
  document.getElementById("filterMatches").innerText = "";
  renderProducts();  // tüm ürünleri geri göster
}


function resetForm(){
  form.reset();
  form.id.value = "";
  fetchProducts();
}

document.getElementById("filterBtn").onclick = applySearchFilters;
document.getElementById("resetFilterBtn").onclick = resetFilters;
document.getElementById("reportBtn").onclick = async () => {
  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;
  const res = await fetch(`/api/products/sales-report?from=${from}&to=${to}`, { 
    headers: {"Authorization":"Bearer "+token()} });
  const json = await res.json();
  document.getElementById("reportResult").innerText = JSON.stringify(json, null, 2);
};


// Butonlara fonksiyonları bağlayın
document.addEventListener("DOMContentLoaded", () => {
  const filterBtn = document.getElementById("filterBtn");
  const clearBtn = document.getElementById("clearBtn");

  if (filterBtn) filterBtn.addEventListener("click", applySearchFilters);
  if (clearBtn) clearBtn.addEventListener("click", resetSearchFilters);
});


fetchProducts();
const socket = io();
socket.on("update", fetchProducts);
