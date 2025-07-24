const API = "/api/products";
const token = () => sessionStorage.getItem("token");
const form = document.getElementById("productForm");
const ul = document.getElementById("productsUl");
let products = [];

form.onsubmit = async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  if (!data.id) delete data.id;

  // Sayısal dönüşümler
  data.quantity = parseInt(data.quantity) || 0;
  data.minQuantity = parseInt(data.minQuantity) || 0;
  data.buyPrice = parseFloat(data.buyPrice) || 0;
  data.sellPrice = parseFloat(data.sellPrice) || 0;
  data.codes = data.codes.split(",").map(c => c.trim());

  try {
    // Aynı isimli ürün var mı kontrolü (case-insensitive)
    const nameExists = products.some(p => p.name.toLowerCase() === data.name.toLowerCase() && p._id !== data.id);
    if (nameExists) throw new Error("Bu ürün adı zaten var!");

    const res = await fetch(API + (data.id ? "/" + data.id : ""), {
      method: data.id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token()
      },
      body: JSON.stringify(data)
    });

    const body = await res.json();
    if (!res.ok) throw new Error(body.message);

    if (data.id) {
      products = products.map(p => p._id === body._id ? body : p);
    } else {
      products.push(body);
    }

    resetForm();
    alert("✔️ Başarılı!");
  } catch (err) {
    alert("❌ " + err.message);
  }
};

async function fetchProducts() {
  try {
    const res = await fetch(API, {
      headers: { Authorization: "Bearer " + token() }
    });
    if (!res.ok) throw new Error("Yetki veya bağlantı sorunu");
    products = await res.json();
    applySearchFilters();
  } catch (err) {
    alert("Ürün çekilemedi: " + err.message);
  }
}

function renderList(list) {
  ul.innerHTML = "";
  list.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${p.name}</strong> (${p.quantity} adet)
      <div>
        <button onclick="edit('${p._id}')">✏️</button>
        <button onclick="del('${p._id}')">🗑️</button>
      </div>`;
    if (p.minQuantity > 0 && p.quantity <= p.minQuantity) li.classList.add("critical-stock");
    ul.appendChild(li);
  });
}

window.edit = id => {
  const p = products.find(x => x._id === id);
  Object.entries(p).forEach(([k, v]) => {
    if (form.elements[k]) form.elements[k].value = Array.isArray(v) ? v.join(", ") : v;
  });
  form.elements.id.value = p._id;
};

window.del = async id => {
  if (!confirm("Silmek istediğinize emin misiniz?")) return;
  await fetch(API + "/" + id, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token() }
  });
  products = products.filter(p => p._id !== id);
  applySearchFilters();
};

// 🔍 Arama & Filtreleme
function applySearchFilters() {
  const keyword = turkishLower(document.getElementById("filterKeyword").value);
  const category = document.getElementById("filterCategory").value;
  const brand = document.getElementById("filterBrand").value;
  const type = document.getElementById("filterType").value;
  const from = document.getElementById("filterFromDate").value;
  const to = document.getElementById("filterToDate").value;
  const showCritical = document.getElementById("onlyCriticalStock").checked;

  const result = products.filter(p => {
    const nameMatch = !keyword || turkishLower(p.name).includes(keyword);
    const categoryMatch = !category || p.category === category;
    const brandMatch = !brand || p.brand === brand;
    const typeMatch = !type || p.type === type;

    const dateMatch = (!from || new Date(p.createdAt) >= new Date(from)) &&
                      (!to || new Date(p.createdAt) <= new Date(to));

    const criticalMatch = !showCritical || (p.minQuantity && p.quantity <= p.minQuantity);
    return nameMatch && categoryMatch && brandMatch && typeMatch && dateMatch && criticalMatch;
  });

  renderList(result);
}

function resetSearchFilters() {
  document.getElementById("filterKeyword").value = "";
  document.getElementById("filterCategory").value = "";
  document.getElementById("filterBrand").value = "";
  document.getElementById("filterType").value = "";
  document.getElementById("filterFromDate").value = "";
  document.getElementById("filterToDate").value = "";
  document.getElementById("onlyCriticalStock").checked = false;
  renderList(products);
}

function resetForm() {
  form.reset();
  form.elements.id.value = "";
}

function turkishLower(str) {
  return str.toLocaleLowerCase("tr-TR");
}

// Event bağlamaları
document.getElementById("filterBtn").onclick = applySearchFilters;
document.getElementById("clearBtn").onclick = resetSearchFilters;
document.getElementById("clearFormBtn").onclick = resetForm;

document.getElementById("filterKeyword").addEventListener("keydown", e => {
  if (e.key === "Enter") applySearchFilters();
});

document.addEventListener("DOMContentLoaded", fetchProducts);
