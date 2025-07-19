const API = "https://ozturkoto52.onrender.com/api/products",
      form = document.getElementById("productForm"),
      productList = document.getElementById("productsUl");

let products = [];

/** Submit / Kaydet */
form.onsubmit = async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  // sayısal dönüşüm, dizi dönüştürme...
  const saved = await /* POST veya PUT işlemi */;
  await fetchProducts();
};

/** Temizle Butonu */
document.getElementById("clearFormBtn").onclick = () => {
  form.reset();
  form.id.value = "";
};

/** Ürünleri getir */
async function fetchProducts(){
  const res = await fetch(API, { headers: {/* auth */} });
  products = await res.json();
  renderProducts();
}

/** Render fonksiyonu */
function renderProducts(list = products) {
  productList.innerHTML = "";
  if (!list.length) {
    productList.style.display = "none";
    return;
  }
  productList.style.display = "block";
  list.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `...`; // üretici format
    productList.appendChild(li);
  });
}

/** Arama */
function applySearch() {
  const key = document.getElementById("filterKeyword").value.toLowerCase().trim();
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(key) ||
    (p.codes||[]).join(", ").toLowerCase().includes(key) ||
    p.description.toLowerCase().includes(key)
  );
  renderProducts(filtered);
  document.getElementById("filterMatches").innerText = `${filtered.length} ürün bulundu.`;
}

/** Arama temizleme */
function clearSearch() {
  document.getElementById("filterKeyword").value = "";
  renderProducts();
  document.getElementById("filterMatches").innerText = "";
}

/** Tab geçişleri */
document.querySelectorAll('.tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t===tab));
    document.querySelectorAll('.tabContent').forEach(tc => {
      tc.style.display = tc.id===tab.dataset.tab ? 'block' : 'none';
    });
    renderProducts(); // arama ya da rapor sonrası göster
  };
});

/** İlk yüklemede */
fetchProducts();

/** Rapor alma */
function getSalesReport(){
  const from = document.getElementById("fromDate").value;
  const to   = document.getElementById("toDate").value;
  const list = products.flatMap(p => p.sales
    .filter(s => s.date>=from && s.date<=to).map(s => s));
  const qty = list.reduce((a,b)=>a+b.quantity,0);
  const total = list.reduce((a,b)=>a+b.quantity*b.price,0);
  document.getElementById("reportResult").innerText = 
    `${list.length} satış, toplam ${qty} adet, ₺${total.toFixed(2)}`;
}

/** Socket.IO ile canlı güncelleme */
if (window.io) {
  const socket = io("https://ozturkoto52.onrender.com");
  socket.on("update", fetchProducts);
}



