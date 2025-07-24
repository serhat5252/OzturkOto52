const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginMessage = document.getElementById("loginMessage");
const registerMessage = document.getElementById("registerMessage");
const showRegisterBtn = document.getElementById("showRegister");

// GİRİŞ
loginForm.onsubmit = async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(loginForm));

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const json = await res.json(); // ← bu satır çok önemli

    if (!res.ok) throw new Error(json.message || "Giriş başarısız");

    sessionStorage.setItem("token", json.token); // ← token kaydediliyor
    document.getElementById("currentUser").innerText = json.username;
    document.getElementById("authBox").style.display = "none";
    document.getElementById("dashboard").style.display = "flex";
  } catch (err) {
    loginMessage.innerText = err.message;
  }
};
// KAYIT
registerForm.onsubmit = async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(registerForm));
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + sessionStorage.getItem("token")
      },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Kayıt başarısız");

    registerMessage.innerText = "✅ Kayıt başarılı!";
    registerForm.reset();
  } catch (err) {
    registerMessage.innerText = "❌ " + err.message;
  }
};

// "Yeni Kullanıcı Ekle" butonuna tıklanınca formu göster
showRegisterBtn.onclick = () => {
  registerForm.style.display = "block";
  showRegisterBtn.style.display = "none";
};

// ÇIKIŞ
function logout() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("currentUser");
  location.reload();
}

// OTOMATİK GİRİŞ (sayfa yenilendiğinde)
document.addEventListener("DOMContentLoaded", () => {
  const token = sessionStorage.getItem("token");
  const currentUser = sessionStorage.getItem("currentUser");

  if (token) {
    document.getElementById("authBox").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    document.getElementById("currentUser").innerText = currentUser;

    if (currentUser === "admin") {
      showRegisterBtn.style.display = "inline-block";
    }
  }

  // TAB GEÇİŞLERİ
  const tabs = document.querySelectorAll(".tab");
  const contents = document.querySelectorAll(".tabContent");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));
      tab.classList.add("active");

      const targetId = tab.getAttribute("data-tab");
      document.getElementById(targetId).classList.add("active");
    });
  });
});