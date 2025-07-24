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
  data.codes = data.codes.split(",").map(s => s.trim());
  data.name = data.name.trim();

  // Aynı isimli ürün kontrolü (case-insensitive)
  const duplicate = products.find(p => p.name.toLowerCase() === data.name.toLowerCase() && (!isUpdate || p._id !== data.id));
  if (duplicate) {
    return alert("Aynı isimde bir ürün zaten var!");
  }

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
    if (!res.ok) throw new Error("Yetki veya bağlantı hatası");
    products = await res.json();
  } catch (err) {
    alert("Ürün çekilemedi: " + err.message);
  }
}

function renderList(list) {
  ul.innerHTML = "";
  document.getElementById("filterMatches").innerText = list.length + " ürün bulundu.";
  list.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <strong>${p.name}</strong><br>
        Stok: ${p.quantity} | Raf: ${p.shelf || "-"}
      </div>
      <div>
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
  const type = document.getElementById("filterType").value;
  const onlyCritical = document.getElementById("onlyCriticalStock").checked;

  const fromAdded = new Date(document.getElementById("filterAddedFrom").value);
  const toAdded = new Date(document.getElementById("filterAddedTo").value);
  const fromSold = new Date(document.getElementById("filterSoldFrom").value);
  const toSold = new Date(document.getElementById("filterSoldTo").value);

  const filtered = products.filter(p => {
    const mk = !key || p.name.toLowerCase().includes(key) || 
      (p.codes || []).join(',').toLowerCase().includes(key) || 
      (p.description || '').toLowerCase().includes(key);
    const mc = !cat || p.category === cat;
    const mb = !brand || p.brand === brand;
    const mt = !type || p.type === type;
    const mcrit = !onlyCritical || (p.minQuantity && p.quantity <= p.minQuantity);

    const mad = (!isNaN(fromAdded) && new Date(p.createdAt) < fromAdded) ? false :
                (!isNaN(toAdded) && new Date(p.createdAt) > toAdded) ? false : true;

    const msold = (!isNaN(fromSold) || !isNaN(toSold)) ? 
      (p.sales || []).some(s => {
        const sd = new Date(s.date);
        return (!isNaN(fromSold) ? sd >= fromSold : true) && (!isNaN(toSold) ? sd <= toSold : true);
      }) : true;

    return mk && mc && mb && mt && mcrit && mad && msold;
  });

  renderList(filtered);
}

function resetForm() {
  form.reset();
  form.elements.id.value = "";
  fetchProducts();
}

function turkishLower(str) {
  return str.toLocaleLowerCase("tr-TR");
}

// Event binding
document.getElementById("filterBtn").onclick = applySearchFilters;
document.getElementById("clearBtn").onclick = () => {
  document.getElementById("filterKeyword").value = "";
  document.getElementById("filterCategory").value = "";
  document.getElementById("filterBrand").value = "";
  document.getElementById("filterType").value = "";
  document.getElementById("onlyCriticalStock").checked = false;
  document.getElementById("filterAddedFrom").value = "";
  document.getElementById("filterAddedTo").value = "";
  document.getElementById("filterSoldFrom").value = "";
  document.getElementById("filterSoldTo").value = "";
  ul.innerHTML = "";
  document.getElementById("filterMatches").innerText = "";
};

document.getElementById("filterKeyword").addEventListener("keypress", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    applySearchFilters();
  }
});

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

// Socket bağlantısı
const socket = io();
socket.on("update", fetchProducts);

// Sayfa yüklendiğinde
document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
});
