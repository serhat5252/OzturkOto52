const API = "/api/products";
const token = () => sessionStorage.getItem("token");
const form = document.getElementById("productForm");
const ul = document.getElementById("productsUl");
let products = [];

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

async function fetchProducts() {
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
        <strong>${p.name}</strong> (${p.quantity} adet)<br/>
        <small>${p.category || ""} | ${p.brand || ""} | ${p.type || ""}</small>
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
    renderList(products);
  } catch (err) {
    alert("❌ " + err.message);
  }
};

function resetForm() {
  form.reset();
  form.elements.id.value = "";
  renderList(products);
}

document.getElementById("clearFormBtn")?.addEventListener("click", resetForm);

// SAT
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

// DETAY
window.details = id => {
  const p = products.find(x => x._id === id);
  const salesList = p.sales.map(s => `- ${s.quantity} adet ₺${s.price} (${new Date(s.date).toLocaleDateString()})`).join("\n") || "Yok";
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
Eklenme: ${new Date(p.createdAt).toLocaleDateString()}
Satışlar:
${salesList}`);
};

// FİLTRELEME
document.getElementById("filterBtn")?.addEventListener("click", () => {
  const key = document.getElementById("filterKeyword").value.trim().toLowerCase();
  const cat = document.getElementById("filterCategory").value;
  const brand = document.getElementById("filterBrand").value;
  const type = document.getElementById("filterType").value;

  const filtered = products.filter(p => {
    const matches = [
      !key || p.name.toLowerCase().includes(key) || p.description?.toLowerCase().includes(key) || p.codes?.some(c => c.toLowerCase().includes(key)),
      !cat || p.category === cat,
      !brand || p.brand === brand,
      !type || p.type === type
    ];
    return matches.every(Boolean);
  });

  renderList(filtered);
});

document.getElementById("clearBtn")?.addEventListener("click", () => {
  document.getElementById("filterKeyword").value = "";
  document.getElementById("filterCategory").value = "";
  document.getElementById("filterBrand").value = "";
  document.getElementById("filterType").value = "";
  document.getElementById("onlyCriticalStock").checked = false;
  renderList(products);
});

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

document.getElementById("clearReportBtn")?.addEventListener("click", () => {
  document.getElementById("reportFrom").value = "";
  document.getElementById("reportTo").value = "";
  document.getElementById("reportResult").innerText = "";
});

// Sayfa yüklendiğinde
document.addEventListener("DOMContentLoaded", async () => {
  await fetchProducts();
  renderList(products);

  // 🔁 Enter ile barkod arama
  document.getElementById("filterKeyword")?.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      const barcode = e.target.value.trim();
      const match = products.find(p => p.codes?.includes(barcode));
      if (match) renderList([match]);
      else renderList([]); // veya alert("Barkod bulunamadı");
    }
  });
});


// BARKOD DESTEKLİ (Mobil Kamera ile)
document.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const barcode = document.getElementById("filterKeyword")?.value.trim();
    if (!barcode) return;
    const match = products.find(p => p.codes?.includes(barcode));
    if (match) renderList([match]);
    else alert("Barkod bulunamadı");
  }
});
