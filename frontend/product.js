const API = "/api/products";
const token = () => sessionStorage.getItem("token");
const form = document.getElementById("productForm");
const ul = document.getElementById("productsUl");
const searchUl = document.getElementById("searchProductsUl");

let products = [];

form.onsubmit = async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));

  if (!data.name) return alert("Ürün adı zorunludur");

  ["quantity", "minQuantity"].forEach(k => data[k] = parseInt(data[k]) || 0);
  ["buyPrice", "sellPrice"].forEach(k => data[k] = parseFloat(data[k]) || 0);
  data.codes = data.codes?.split(",").map(s => s.trim()) || [];

  const isUpdate = Boolean(data.id);
  if (!data.id) delete data.id;

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

async function fetchProducts() {
  try {
    const res = await fetch(API, {
      headers: {
        "Authorization": "Bearer " + token()
      }
    });
    if (!res.ok) throw new Error("Yetki veya bağlantı hatası");

    products = await res.json();
    renderList(products, ul);
    populateFilterOptions();
  } catch (err) {
    alert("Ürünler alınamadı: " + err.message);
  }
}

function renderSearchList(list) {
  const ul = document.getElementById("searchResultsUl");
  ul.innerHTML = "";

  if (!list.length) {
    ul.innerHTML = "<li>Sonuç bulunamadı.</li>";
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
        <button onclick="sell('${p._id}')">Sat</button>
        <button onclick="edit('${p._id}')">Düzenle</button>
        <button onclick="del('${p._id}')">Sil</button>
        <button onclick="details('${p._id}')">Detay</button>
      </div>`;
    if (p.minQuantity > 0 && p.quantity <= p.minQuantity)
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

function resetForm() {
  form.reset();
  form.elements.id.value = "";
  fetchProducts();
}

function populateFilterOptions() {
  const catSel = document.getElementById("filterCategory");
  const brandSel = document.getElementById("filterBrand");
  const typeSel = document.getElementById("filterType");

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
  const types = [...new Set(products.map(p => p.type).filter(Boolean))];

  const fill = (select, items) => {
    select.innerHTML = `<option value="">Tümü</option>` + items.map(i => `<option>${i}</option>`).join("");
  };

  fill(catSel, categories);
  fill(brandSel, brands);
  fill(typeSel, types);
}

// SAT
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

// DETAY
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

// ARAMA
document.getElementById("filterKeyword")?.addEventListener("keydown", e => {
  if (e.key === "Enter") applyFilters();
});
document.getElementById("filterBtn")?.addEventListener("click", applyFilters);
document.getElementById("clearBtn")?.addEventListener("click", () => {
  document.getElementById("filterKeyword").value = "";
  document.getElementById("filterCategory").value = "";
  document.getElementById("filterBrand").value = "";
  document.getElementById("filterType").value = "";
  renderList(products, searchUl);
});

let products = [];

async function ensureProductsLoaded() {
  if (products.length === 0) {
    try {
      const res = await fetch(API, {
        headers: { "Authorization": "Bearer " + token() }
      });
      if (!res.ok) throw new Error("Yetki veya bağlantı hatası");
      products = await res.json();
    } catch (err) {
      alert("Ürünler alınamadı: " + err.message);
    }
  }
}

async function applyFilters() {
  await ensureProductsLoaded();

  const key = document.getElementById("filterKeyword").value.trim().toLowerCase();
  const category = document.getElementById("filterCategory").value;
  const brand = document.getElementById("filterBrand").value;
  const type = document.getElementById("filterType").value;
  const onlyCritical = document.getElementById("onlyCriticalStock")?.checked;

  const filtered = products.filter(p => {
    const nameMatch = !key || p.name.toLowerCase().includes(key) || p.description?.toLowerCase().includes(key) || p.codes?.some(c => c.toLowerCase().includes(key));
    const categoryMatch = !category || p.category === category;
    const brandMatch = !brand || p.brand === brand;
    const typeMatch = !type || p.type === type;
    const criticalMatch = !onlyCritical || (p.minQuantity > 0 && p.quantity <= p.minQuantity);
    return nameMatch && categoryMatch && brandMatch && typeMatch && criticalMatch;
  });

  renderSearchList(filtered);
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

document.getElementById("reportClearBtn")?.addEventListener("click", () => {
  document.getElementById("reportFrom").value = "";
  document.getElementById("reportTo").value = "";
  document.getElementById("reportResult").innerText = "";
});

document.addEventListener("DOMContentLoaded", () => {
  const token = sessionStorage.getItem("token");
  const currentUser = sessionStorage.getItem("currentUser");

  if (token && currentUser) {
    document.getElementById("authBox").style.display = "none";
    document.getElementById("dashboard").style.display = "flex";
    document.getElementById("currentUser").innerText = currentUser;

    // Yalnızca ürün işlemleri sekmesi ilk açıldığında listele
    const activeTab = document.querySelector(".tab.active")?.getAttribute("data-tab");
    if (activeTab === "urunIslemleri") fetchProducts();
  }
});
