const API = "/api/products";
const token = () => sessionStorage.getItem("token");
const form = document.getElementById("productForm");
const ul = document.getElementById("productsUl");
let products = [];

// Ürünleri API'den al
async function fetchProducts() {
  try {
    const res = await fetch(API, {
      headers: {
        "Authorization": "Bearer " + token()
      }
    });
    if (!res.ok) throw new Error("Yetki veya bağlantı hatası");

    products = await res.json();
  } catch (err) {
    alert("Ürünler alınamadı: " + err.message);
  }
}

// Listeyi göster
function renderList(list) {
  if (!ul) return;
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
      <div class="btn-group">
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

// Form gönderimi
form?.addEventListener("submit", async e => {
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
});

// Buton işlemleri
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
    renderList(products);
  } catch (err) {
    alert("❌ " + err.message);
  }
};

function resetForm() {
  form.reset();
  form.elements.id.value = "";
  fetchProducts().then(() => renderList(products));
}

document.getElementById("clearFormBtn")?.addEventListener("click", resetForm);

// Satış işlemi
window.sell = async id => {
  const quantity = prompt("Kaç adet satıldı?");
  const price = prompt("Toplam satış fiyatı?");
  if (!quantity || !price) return;

  try {
    const res = await fetch(API + `/${id}/sell`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token()
      },
      body: JSON.stringify({ quantity, price })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Satış başarısız");

    fetchProducts().then(() => renderList(products));
  } catch (err) {
    alert("❌ " + err.message);
  }
};

// Detay göster
window.details = id => {
  const p = products.find(x => x._id === id);
  const sales = p.sales?.map(s => `📆 ${new Date(s.date).toLocaleDateString()} - 💰 ${s.price} ₺`).join("\n") || "Satış yok";
  alert(`🧾 Ürün Detayları:
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
Satış Geçmişi:\n${sales}`);
};

// Filtreleme
document.getElementById("filterBtn")?.addEventListener("click", () => {
  const key = document.getElementById("filterKeyword").value.trim().toLowerCase();
  const category = document.getElementById("filterCategory").value;
  const brand = document.getElementById("filterBrand").value;
  const type = document.getElementById("filterType").value;

  const filtered = products.filter(p => {
    const matchKeyword = !key || p.name.toLowerCase().includes(key) || p.description?.toLowerCase().includes(key) || p.codes?.some(c => c.toLowerCase().includes(key));
    const matchCategory = !category || p.category === category;
    const matchBrand = !brand || p.brand === brand;
    const matchType = !type || p.type === type;
    return matchKeyword && matchCategory && matchBrand && matchType;
  });

  renderList(filtered);
});

document.getElementById("clearBtn")?.addEventListener("click", () => {
  ["filterKeyword", "filterCategory", "filterBrand", "filterType"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  ul.innerHTML = "";
});

// Rapor işlemleri
document.getElementById("reportBtn")?.addEventListener("click", async () => {
  const from = document.getElementById("reportFrom").value;
  const to = document.getElementById("reportTo").value;

  const res = await fetch(`/api/products/sales-report?from=${from}&to=${to}`, {
    headers: { "Authorization": "Bearer " + token() }
  });
  const json = await res.json();
  document.getElementById("reportResult").innerText = JSON.stringify(json, null, 2);
});

document.getElementById("clearReportBtn")?.addEventListener("click", () => {
  document.getElementById("reportFrom").value = "";
  document.getElementById("reportTo").value = "";
  document.getElementById("reportResult").innerText = "";
});

// Barkod arama desteği
document.addEventListener("keydown", e => {
  const isScanner = e.key.length > 1 && e.key !== "Enter";
  if (!isScanner) return;

  const barcodeInput = document.getElementById("filterKeyword");
  barcodeInput.focus();
});

document.addEventListener("DOMContentLoaded", async () => {
  await fetchProducts();
});
