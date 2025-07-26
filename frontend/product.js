const API = "/api/products";
const token = () => sessionStorage.getItem("token");
const form = document.getElementById("productForm");
const ul = document.getElementById("productsUl");
const searchUl = document.getElementById("searchResultsUl");

let products = [];

form?.addEventListener("submit", async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));

  ["quantity", "minQuantity"].forEach(k => data[k] = parseInt(data[k]) || 0);
  ["buyPrice", "sellPrice"].forEach(k => data[k] = parseFloat(data[k]) || 0);
  data.codes = data.codes?.split(",").map(s => s.trim()) || [];

  const isUpdate = Boolean(data.id);
  if (!data.id) delete data.id;

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

    fetchProducts();
    form.reset();
    form.elements.id.value = "";
    alert("✅ Başarılı!");
  } catch (err) {
    alert("❌ " + err.message);
  }
});

async function fetchProducts() {
  try {
    const res = await fetch(API, {
      headers: { "Authorization": "Bearer " + token() }
    });
    if (!res.ok) throw new Error("Yetki veya bağlantı hatası");

    products = await res.json();
    renderList(products, ul);
    populateFilterOptions();
  } catch (err) {
    alert("Ürünler alınamadı: " + err.message);
  }
}

function renderList(list, container) {
  container.innerHTML = "";
  if (!list.length) {
    container.innerHTML = "<li>Ürün bulunamadı.</li>";
    return;
  }

  list.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <strong>${p.name}</strong> (${p.quantity} adet)
        <br><small>${p.category} | ${p.brand} | ${p.type}</small>
      </div>
      <div>
        <button onclick="sell('${p._id}')">Sat</button>
        <button onclick="edit('${p._id}')">Düzenle</button>
        <button onclick="del('${p._id}')">Sil</button>
        <button onclick="details('${p._id}')">Detay</button>
      </div>
    `;
    if (p.minQuantity > 0 && p.quantity <= p.minQuantity)
      li.classList.add("critical-stock");
    container.appendChild(li);
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
  if (!confirm("Silmek istediğinize emin misiniz?")) return;
  try {
    const res = await fetch(API + "/" + id, {
      method: "DELETE",
      headers: { "Authorization": "Bearer " + token() }
    });
    if (!res.ok) throw new Error("Silinemedi");

    products = products.filter(p => p._id !== id);
    renderList(products, ul);
  } catch (err) {
    alert("❌ " + err.message);
  }
};

window.sell = async id => {
  const price = prompt("Satış fiyatı?");
  if (!price) return;

  try {
    const res = await fetch(API + "/sell/" + id, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token()
      },
      body: JSON.stringify({ price })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Satış başarısız");

    fetchProducts();
  } catch (err) {
    alert("❌ " + err.message);
  }
};

window.details = id => {
  const p = products.find(x => x._id === id);
  alert(`
🧾 Ürün Detayları:
Ad: ${p.name}
Kategori: ${p.category}
Marka: ${p.brand}
Tip: ${p.type}
Stok: ${p.quantity}
Kritik Stok: ${p.minQuantity}
Raf: ${p.shelf}
Alış: ${p.buyPrice}
Satış: ${p.sellPrice}
Kodlar: ${p.codes?.join(", ")}
Açıklama: ${p.description}
Eklenme: ${new Date(p.createdAt).toLocaleDateString()}
Son Satış: ${p.sales?.slice(-1)[0]?.price || "Yok"}
`);
};

function populateFilterOptions() {
  const catSel = document.getElementById("filterCategory");
  const brandSel = document.getElementById("filterBrand");
  const typeSel = document.getElementById("filterType");

  const unique = (key) => [...new Set(products.map(p => p[key]).filter(Boolean))];
  const fill = (el, values) => {
    if (el)
      el.innerHTML = `<option value="">Tümü</option>` + values.map(v => `<option>${v}</option>`).join("");
  };

  fill(catSel, unique("category"));
  fill(brandSel, unique("brand"));
  fill(typeSel, unique("type"));
}

document.getElementById("filterBtn")?.addEventListener("click", applyFilters);
document.getElementById("clearBtn")?.addEventListener("click", () => {
  document.getElementById("filterKeyword").value = "";
  document.getElementById("filterCategory").value = "";
  document.getElementById("filterBrand").value = "";
  document.getElementById("filterType").value = "";
  document.getElementById("onlyCriticalStock").checked = false;
  searchUl.innerHTML = "";
});

function applyFilters() {
  const key = document.getElementById("filterKeyword").value.trim().toLowerCase();
  const category = document.getElementById("filterCategory").value;
  const brand = document.getElementById("filterBrand").value;
  const type = document.getElementById("filterType").value;
  const onlyCritical = document.getElementById("onlyCriticalStock").checked;

  const filtered = products.filter(p => {
    const matchKey =
      !key || p.name.toLowerCase().includes(key) ||
      p.description?.toLowerCase().includes(key) ||
      p.codes?.some(code => code.toLowerCase().includes(key));

    const matchCat = !category || p.category === category;
    const matchBrand = !brand || p.brand === brand;
    const matchType = !type || p.type === type;
    const matchCritical = !onlyCritical || (p.minQuantity > 0 && p.quantity <= p.minQuantity);

    return matchKey && matchCat && matchBrand && matchType && matchCritical;
  });

  renderList(filtered, searchUl);
}

// RAPOR
document.getElementById("reportBtn")?.addEventListener("click", async () => {
  const from = document.getElementById("reportFrom").value;
  const to = document.getElementById("reportTo").value;

  const res = await fetch(`/api/products/sales-report?from=${from}&to=${to}`, {
    headers: { "Authorization": "Bearer " + token() }
  });

  const json = await res.json();
  document.getElementById("reportResult").innerText = JSON.stringify(json, null, 2);
});

// Sayfa yüklendiğinde
document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
});
