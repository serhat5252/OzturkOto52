const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginMessage = document.getElementById("loginMessage");
const registerMessage = document.getElementById("registerMessage");
const showRegisterBtn = document.getElementById("showRegister");

// Giriş formu
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
    document.getElementById("dashboard").style.display = "block";

    if (json.username === "admin") {
      showRegisterBtn.style.display = "inline-block";
    }
  } catch (err) {
    loginMessage.innerText = err.message;
  }
};

// Kayıt formu (sadece admin için çalışır)
registerForm.onsubmit = async e => {
  e.preventDefault();
  const currentUser = sessionStorage.getItem("currentUser");
  if (currentUser !== "admin") {
    registerMessage.innerText = "Sadece admin kullanıcı ekleyebilir.";
    return;
  }

  const data = Object.fromEntries(new FormData(registerForm));
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

// Kayıt formunu göster
showRegisterBtn.onclick = () => {
  registerForm.style.display = "block";
  showRegisterBtn.style.display = "none";
};

// Oturumu kapat
function logout() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("currentUser");
  location.reload();
}

// Sayfa yüklenince oturum kontrolü
document.addEventListener("DOMContentLoaded", () => {
  const token = sessionStorage.getItem("token");
  const currentUser = sessionStorage.getItem("currentUser");

  if (token && currentUser) {
    document.getElementById("authBox").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    document.getElementById("currentUser").innerText = currentUser;

    if (currentUser === "admin") {
      showRegisterBtn.style.display = "inline-block";
    }
  }
});
