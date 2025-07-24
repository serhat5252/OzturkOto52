const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

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

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Giriş başarısız");

    sessionStorage.setItem("token", json.token);
    sessionStorage.setItem("currentUser", json.username);
    document.getElementById("currentUser").innerText = json.username;

    document.getElementById("authBox").style.display = "none";
    document.getElementById("dashboard").style.display = "flex";

    // Sadece admin'e kullanıcı yönetimi sekmesini göster
    if (json.username === "admin") {
      document.getElementById("kullaniciTab").style.display = "block";
    }
  } catch (err) {
    loginMessage.innerText = "❌ " + err.message;
  }
};

// ÇIKIŞ
function logout() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("currentUser");
  location.reload();
}

// OTOMATİK GİRİŞ
document.addEventListener("DOMContentLoaded", () => {
  const token = sessionStorage.getItem("token");
  const currentUser = sessionStorage.getItem("currentUser");

  if (token && currentUser) {
    document.getElementById("authBox").style.display = "none";
    document.getElementById("dashboard").style.display = "flex";
    document.getElementById("currentUser").innerText = currentUser;

    if (currentUser === "admin") {
      document.getElementById("kullaniciTab").style.display = "block";
    }
  }

// User
document.getElementById("userForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + sessionStorage.getItem("token") },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  document.getElementById("userMsg").innerText = res.ok ? "✅ Eklendi" : "❌ " + json.message;
});


  // Sekme geçişleri
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
