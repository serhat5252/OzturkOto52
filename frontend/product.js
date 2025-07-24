const API = "/api/products";
const token = () => sessionStorage.getItem("token");

const form = document.getElementById("productForm");
const ul = document.getElementById("productsUl");
let products = [];

// Ürün Kaydetme
form.onsubmit = async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  if (!data.name) return alert("Ürün adı zorunludur");

  // Dönüştürme
  ["quantity", "minQuantity"].forEach(k => data[k] = parseInt(data[k]) || 0);
  ["buyPrice", "sellPrice"].forEach(k => data[k] = parseFloat(data[k]) || 0);
  data.codes = data.codes?.split(",").map(s => s.trim()) || [];

  const isUpdate = Boolean(data.id);
  if (!isUpdate) delete data.id;

  // Aynı ürün adı kontrolü (büyük küçük harf duyarsız)
  const nameExists = products.some(p =>
    p.name.toLowerCase() === data.name.toLowerCase() &&
    (!isUpdate || p._id !== data.id)
  );
  if (nameExists) return alert("Bu ürün adı zaten kayıtlı!");

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

// Ürünleri Getir
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

// Listeyi Göster
function renderList(list) {
  ul.innerHTML = "";
  if (!list.length) {
    ul.innerHTML = "<li>Ürün bulunamadı.</li>";
    return;
  }

  list.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <strong>${p.name}</strong> (${p.quantity} adet)
        <br><small>${p.category || ""} | ${p.brand || ""} | ${p.type || ""}</small>
      </div>
      <div>
        <button onclick="edit('${p._id}')">D</button>
        <button onclick="del('${p._id}')">S</button>
      </div>`;
    if (p.minQuantity > 0 && p.quantity <= p.minQuantity)
      li.classList.add("critical-stock");
    ul.appendChild(li);
  });
}

// Ürün Düzenle
window.edit = id => {
  const p = products.find(x => x._id === id);
  Object.entries(p).forEach(([k, v]) => {
    const el = form.elements[k];
    if (el) el.value = Array.isArray(v) ? v.join(", ") : v;
  });
  form.elements.id.value = p._id;
};

// Ürün Sil
window.del = async id => {
  if (!confirm("Silmek istediğinize emin misiniz?")) return;
  try {
    const res = await fetch(API + "/" + id, {
      method: "DELETE",
      headers: { "Authorization": "Bearer " + token() }
    });
    if (!res.ok) throw new Error("Silinemedi");
    products = products.filter(p => p._id !== id);
    renderList(products);
  } catch (err) {
    alert("❌ " + err.message);
  }
};

// Filtreleri Uygula
function applyFilters() {
  const key = document.getElementById("filterKeyword").value.trim().toLowerCase();
  const category = document.getElementById("filterCategory").value;
  const brand = document.getElementById("filterBrand").value;
  const type = document.getElementById("filterType").value;
  const from = new Date(document.getElementById("fromDate").value || "2000-01-01");
  const to = new Date(document.getElementById("toDate").value || Date.now());
  const saleFrom = new Date(document.getElementById("filterSaleFrom")?.value || "2000-01-01");
  const saleTo = new Date(document.getElementById("filterSaleTo")?.value || Date.now());
  const onlyCritical = document.getElementById("onlyCriticalStock").checked;

  const filtered = products.filter(p => {
    const nameMatch = !key || p.name.toLowerCase().includes(key) || (p.codes || []).some(c => c.toLowerCase().includes(key));
    const categoryMatch = !category || p.category === category;
    const brandMatch = !brand || p.brand === brand;
    const typeMatch = !type || p.type === type;
    const createMatch = new Date(p.createdAt) >= from && new Date(p.createdAt) <= to;
    const saleMatch = !p.sales?.length || p.sales.some(s => {
      const d = new Date(s.date);
      return d >= saleFrom && d <= saleTo;
    });
    const criticalMatch = !onlyCritical || (p.minQuantity && p.quantity <= p.minQuantity);

    return nameMatch && categoryMatch && brandMatch && typeMatch && createMatch && saleMatch && criticalMatch;
  });

  renderList(filtered);
  document.getElementById("filterMatches").innerText = `${filtered.length} ürün listelendi.`;
}

// Filtreleri Temizle
function resetFilters() {
  document.getElementById("filterForm")?.reset();
  renderList(products);
}

// Formu Temizle
function resetForm() {
  form.reset();
  form.elements.id.value = "";
  fetchProducts();
}

// Kategori / Marka / Tip seçeneklerini filtreye aktar
function populateFilterOptions() {
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
  const types = [...new Set(products.map(p => p.type).filter(Boolean))];

  const fillSelect = (id, items) => {
    const sel = document.getElementById(id);
    if (sel) {
      sel.innerHTML = `<option value="">Tümü</option>` + items.map(i => `<option>${i}</option>`).join("");
    }
  };

  fillSelect("filterCategory", categories);
  fillSelect("filterBrand", brands);
  fillSelect("filterType", types);
}

// Satış Raporu
document.getElementById("reportBtn")?.addEventListener("click", async () => {
  const from = document.getElementById("fromDateReport").value;
  const to = document.getElementById("toDateReport").value;
  try {
    const res = await fetch(`/api/products/sales-report?from=${from}&to=${to}`, {
      headers: { "Authorization": "Bearer " + token() }
    });
    const data = await res.json();
    document.getElementById("reportResult").innerText = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById("reportResult").innerText = "Rapor alınamadı: " + err.message;
  }
});

// Enter tuşu ile filtreleme
document.getElementById("filterKeyword")?.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    applyFilters();
  }
});

// Buton Bağlamaları
document.getElementById("filterBtn")?.addEventListener("click", applyFilters);
document.getElementById("clearBtn")?.addEventListener("click", resetFilters);
document.getElementById("clearFormBtn")?.addEventListener("click", resetForm);

// Sayfa yüklendiğinde
document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
});
