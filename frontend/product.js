const API = "/api/products";
const token = () => sessionStorage.getItem("token");
const form = document.getElementById("productForm");
const ul = document.getElementById("productsUl");

let products = [];

form.onsubmit = async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));

  // Zorunlu ve dönüşüm
  if (!data.name) return alert("Ürün adı zorunlu");
  ["quantity", "minQuantity"].forEach(k => data[k] = parseInt(data[k]) || 0);
  ["buyPrice", "sellPrice"].forEach(k => data[k] = parseFloat(data[k]) || 0);
  data.codes = data.codes?.split(",").map(s => s.trim()) || [];

  const isUpdate = Boolean(data.id);
  if (!isUpdate) delete data.id;

  const nameExists = products.some(p =>
    p.name.toLowerCase() === data.name.toLowerCase() &&
    (!isUpdate || p._id !== data.id)
  );
  if (nameExists) return alert("Aynı ürün adı mevcut");

  try {
    const res = await fetch(API + (isUpdate ? `/${data.id}` : ""), {
      method: isUpdate ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token()
      },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Hata oluştu");

    if (isUpdate) {
      products = products.map(p => p._id === result._id ? result : p);
    } else {
      products.push(result);
    }

    resetForm();
    alert("✅ Başarılı!");
  } catch (err) {
    alert("❌ " + err.message);
  }
};

async function fetchProducts() {
  try {
    const res = await fetch(API, {
      headers: { "Authorization": "Bearer " + token() }
    });
    if (!res.ok) throw new Error("Yetki veya bağlantı hatası");

    products = await res.json();
    renderList(products);
    populateFilterOptions();
  } catch (err) {
    alert("Ürünler alınamadı: " + err.message);
  }
}

function renderList(list) {
  ul.innerHTML = "";
  if (!list.length) return (ul.innerHTML = "<li>Ürün bulunamadı</li>");

  list.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <strong>${p.name}</strong> (${p.quantity} adet)<br>
        <small>${p.category} | ${p.brand} | ${p.type}</small>
      </div>
      <div>
        <button onclick="sale('${p._id}')">Sat</button>
        <button onclick="edit('${p._id}')">D</button>
        <button onclick="show('${p._id}')">?</button>
        <button onclick="del('${p._id}')">S</button>
      </div>`;
    if (p.minQuantity && p.quantity <= p.minQuantity)
      li.classList.add("critical-stock");
    ul.appendChild(li);
  });
}

window.edit = id => {
  const p = products.find(x => x._id === id);
  Object.entries(p).forEach(([k, v]) => {
    const el = form.elements[k];
    if (el) el.value = Array.isArray(v) ? v.join(", ") : v;
  });
  form.elements.id.value = p._id;
};

window.del = async id => {
  if (!confirm("Silmek istiyor musunuz?")) return;
  try {
    const res = await fetch(API + "/" + id, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token() }
    });
    if (!res.ok) throw new Error("Silinemedi");

    products = products.filter(p => p._id !== id);
    renderList(products);
  } catch (err) {
    alert("❌ " + err.message);
  }
};

window.sale = async id => {
  const adet = prompt("Kaç adet satıldı?");
  const quantity = parseInt(adet);
  if (!quantity || quantity <= 0) return;

  try {
    const res = await fetch(`${API}/sale/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token()
      },
      body: JSON.stringify({ quantity })
    });

    const updated = await res.json();
    if (!res.ok) throw new Error(updated.message);
    products = products.map(p => p._id === updated._id ? updated : p);
    renderList(products);
  } catch (err) {
    alert("❌ " + err.message);
  }
};

window.show = id => {
  const p = products.find(x => x._id === id);
  alert(`📦 ${p.name}
Kategori: ${p.category}
Marka: ${p.brand}
Tip: ${p.type}
Adet: ${p.quantity}
Raf: ${p.shelf}
Eklenme: ${new Date(p.createdAt).toLocaleString()}
Son Satış: ${p.sales?.length ? new Date(p.sales.slice(-1)[0].date).toLocaleString() : 'Yok'}
Toplam Satış: ${p.sales?.reduce((t, s) => t + s.quantity, 0) || 0} adet
Alış Fiyatı: ${p.buyPrice} ₺
Satış Fiyatı: ${p.sellPrice} ₺
Kodlar: ${p.codes?.join(", ")}
Açıklama: ${p.description || "-"}`);
};

function resetForm() {
  form.reset();
  form.elements.id.value = "";
  fetchProducts();
}

// Filtreleme
document.getElementById("filterBtn").onclick = applyFilters;
document.getElementById("clearBtn").onclick = () => {
  document.querySelectorAll("#searchTab input, #searchTab select").forEach(el => el.value = "");
  document.getElementById("onlyCriticalStock").checked = true;
  renderList(products);
};

document.getElementById("filterKeyword").addEventListener("keydown", e => {
  if (e.key === "Enter") applyFilters();
});

function applyFilters() {
  const key = document.getElementById("filterKeyword").value.trim().toLowerCase();
  const category = document.getElementById("filterCategory").value;
  const brand = document.getElementById("filterBrand").value;
  const type = document.getElementById("filterType").value;
  const from = new Date(document.getElementById("filterFrom").value || "2000-01-01");
  const to = new Date(document.getElementById("filterTo").value || Date.now());
  const saleFrom = new Date(document.getElementById("filterSaleFrom").value || "2000-01-01");
  const saleTo = new Date(document.getElementById("filterSaleTo").value || Date.now());
  const onlyCritical = document.getElementById("onlyCriticalStock").checked;

  const filtered = products.filter(p => {
    const nameMatch = !key || [p.name, p.description, ...(p.codes || [])].join(" ").toLowerCase().includes(key);
    const catMatch = !category || p.category === category;
    const brandMatch = !brand || p.brand === brand;
    const typeMatch = !type || p.type === type;
    const dateMatch = new Date(p.createdAt) >= from && new Date(p.createdAt) <= to;
    const saleMatch = p.sales?.some(s => {
      const d = new Date(s.date);
      return d >= saleFrom && d <= saleTo;
    }) || (!document.getElementById("filterSaleFrom").value && !document.getElementById("filterSaleTo").value);
    const criticalMatch = !onlyCritical || (p.minQuantity && p.quantity <= p.minQuantity);

    return nameMatch && catMatch && brandMatch && typeMatch && dateMatch && saleMatch && criticalMatch;
  });

  renderList(filtered);
}

function populateFilterOptions() {
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
  const types = [...new Set(products.map(p => p.type).filter(Boolean))];

  const fill = (id, items) => {
    const el = document.getElementById(id);
    el.innerHTML = `<option value="">Tümü</option>` + items.map(i => `<option>${i}</option>`).join("");
  };

  fill("filterCategory", categories);
  fill("filterBrand", brands);
  fill("filterType", types);
}

// Satış Raporu
document.getElementById("reportBtn")?.addEventListener("click", async () => {
  const from = document.getElementById("reportFrom").value;
  const to = document.getElementById("reportTo").value;

  const res = await fetch(`/api/products/sales-report?from=${from}&to=${to}`, {
    headers: { "Authorization": "Bearer " + token() }
  });
  const json = await res.json();
  document.getElementById("reportResult").innerText = JSON.stringify(json, null, 2);
});

// Sayfa Yüklendiğinde
document.addEventListener("DOMContentLoaded", fetchProducts);
