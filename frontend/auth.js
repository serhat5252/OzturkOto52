const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

// Giriş
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

    document.getElementById("authBox").style.display = "none";
    document.getElementById("dashboard").style.display = "flex";
    document.getElementById("currentUser").innerText = json.username;
  } catch (err) {
    loginMessage.innerText = "❌ " + err.message;
  }
};

// Çıkış
function logout() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("currentUser");
  location.reload();
}

// Sayfa yüklendiğinde
document.addEventListener("DOMContentLoaded", () => {
  const token = sessionStorage.getItem("token");
  const currentUser = sessionStorage.getItem("currentUser");

  if (token && currentUser) {
    document.getElementById("authBox").style.display = "none";
    document.getElementById("dashboard").style.display = "flex";
    document.getElementById("currentUser").innerText = currentUser;
  }

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

  // Kullanıcı ekleme (varsayılan açık)
  const userForm = document.getElementById("userForm");
  userForm?.addEventListener("submit", async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(userForm));
    const userMsg = document.getElementById("userMsg");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + sessionStorage.getItem("token") },
        body: JSON.stringify(data)
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Kayıt başarısız");

      userForm.reset();
      userMsg.innerText = "✅ Kullanıcı eklendi.";
    } catch (err) {
      userMsg.innerText = "❌ " + err.message;
    }
  });
});
