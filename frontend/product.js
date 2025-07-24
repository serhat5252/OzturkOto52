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

  ["quantity", "minQuantity"].forEach(k => data[k] = parseInt(data[k]) || 0);
  ["buyPrice", "sellPrice"].forEach(k => data[k] = parseFloat(data[k]) || 0);
  data.codes = data.codes ? data.codes.split(",").map(s => s.trim()) : [];

  try {
    const res = await fetch(API + (isUpdate ? "/" + data.id : ""), {
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
    alert("Başarılı!");
  } catch (err) {
    alert("Hata: " + err.message);
  }
};

async function fetchProducts() {
  try {
    const res = await fetch(API, {
      headers: { "Authorization": "Bearer " + token() }
    });
    if (!res.ok) throw new Error("Yetki veya bağlantı");
    products = await res.json();
    renderList(products);
  } catch (err) {
    alert("Ürün çekilemedi: " + err.message);
  }
}

function renderList(list) {
  ul.innerHTML = "";
  document.getElementById("filterMatches").innerText = list.length + " ürün.";
  list.forEach(p => {
    const li = document.createElement("li");
    li.classList.add("product-card");
    li.innerHTML = `
      <div class="card-header">
        <strong>${p.name}</strong>
        <span class="stock">Stok: ${p.quantity}</span>
      </div>
      <div class="card-body">
        <div>Kategori: ${p.category || "-"}</div>
        <div>Marka: ${p.brand || "-"}</div>
        <div>Tip: ${p.type || "-"}</div>
        <div>Fiyat: ₺${p.sellPrice?.toFixed(2) || "0.00"}</div>
      </div>
      <div class="card-actions">
        <button onclick="edit('${p._id}')">Düzenle</button>
        <button onclick="del('${p._id}')">Sil</button>
      </div>
    `;
    if (p.minQuantity > 0 && p.quantity <= p.minQuantity) {
      li.classList.add("critical-stock");
    }
    ul.appendChild(li);
  });
}

window.edit = id => {
  const p = products.find(x => x._id === id);
  Object.entries(p).forEach(([k, v]) => {
    const el = form.elements[k];
    if (el) el.value = Array.isArray(v) ? v.join(", ") : v;
  });
  document.querySelector('.tab[data-tab="formTab"]').click();
};

window.del = async id => {
  if (!confirm("Emin misin?")) return;
  await fetch(API + "/" + id, {
    method: "DELETE",
    headers: { "Authorization": "Bearer " + token() }
  });
  products = products.filter(p => p._id !== id);
  renderList(products);
};

function applySearchFilters() {
  const key = turkishLower(document.getElementById("filterKeyword").value);
  const cat = document.getElementById("filterCategory").value;
  const brand = document.getElementById("filterBrand").value;
  const type = document.getElementById("filterType")?.value;
  const onlyCritical = document.getElementById("onlyCriticalStock").checked;

  const createdFrom = new Date(document.getElementById("filterCreatedFrom").value || "2000-01-01");
  const createdTo = new Date(document.getElementById("filterCreatedTo").value || "2100-01-01");
  const soldFrom = new Date(document.getElementById("filterSoldFrom").value || "2000-01-01");
  const soldTo = new Date(document.getElementById("filterSoldTo").value || "2100-01-01");

  const filtered = products.filter(p => {
    const nameMatch = !key || turkishLower(p.name).includes(key);
    const codeMatch = !key || (p.codes || []).join(", ").toLowerCase().includes(key);
    const descMatch = !key || (p.description || "").toLowerCase().includes(key);

    const matchCategory = !cat || p.category === cat;
    const matchBrand = !brand || p.brand === brand;
    const matchType = !type || p.type === type;

    const createdDate = new Date(p.createdAt);
    const inCreatedRange = createdDate >= createdFrom && createdDate <= createdTo;

    const matchSalesDate = p.sales.some(s => {
      const d = new Date(s.date);
      return d >= soldFrom && d <= soldTo;
    }) || (!document.getElementById("filterSoldFrom").value && !document.getElementById("filterSoldTo").value);

    const matchCritical = !onlyCritical || (p.minQuantity && p.quantity <= p.minQuantity);

    return (nameMatch || codeMatch || descMatch)
        && matchCategory
        && matchBrand
        && matchType
        && inCreatedRange
        && matchSalesDate
        && matchCritical;
  });

  renderList(filtered);
  document.getElementById("filterMatches").innerText = `${filtered.length} ürün bulundu.`;
}


function resetSearchFilters() {
  document.getElementById("filterKeyword").value = "";
  document.getElementById("filterCategory").value = "";
  document.getElementById("filterBrand").value = "";
  document.getElementById("filterType").value = "";
  document.getElementById("filterCreatedFrom").value = "";
  document.getElementById("filterCreatedTo").value = "";
  document.getElementById("filterSoldFrom").value = "";
  document.getElementById("filterSoldTo").value = "";
  document.getElementById("onlyCriticalStock").checked = false;
  document.getElementById("filterMatches").innerText = "";
  renderList(products);
}

function resetForm() {
  form.reset();
  form.elements.id.value = "";
  fetchProducts();
}

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    const target = tab.getAttribute("data-tab");
    document.querySelectorAll(".tabContent").forEach(c => c.classList.remove("active"));
    document.getElementById(target).classList.add("active");
  });
});

function turkishLower(str) {
  return str.toLocaleLowerCase("tr-TR");
}

document.getElementById("filterBtn").onclick = applySearchFilters;
document.getElementById("clearBtn").onclick = resetSearchFilters;
document.getElementById("clearFormBtn").onclick = resetForm;

document.getElementById("reportBtn").onclick = async () => {
  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;
  const res = await fetch(`/api/products/sales-report?from=${from}&to=${to}`, {
    headers: { "Authorization": "Bearer " + token() }
  });
  const json = await res.json();
  document.getElementById("reportResult").innerText = JSON.stringify(json, null, 2);
};

const socket = io();
socket.on("update", fetchProducts);

document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
});
