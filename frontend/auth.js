const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const showRegisterBtn = document.getElementById("showRegister");
const loginMessage = document.getElementById("loginMessage");
const registerMessage = document.getElementById("registerMessage");
const authBox = document.getElementById("authBox");
const dashboard = document.getElementById("dashboard");
const currentUser = document.getElementById("currentUser");

// Giriş işlemi
loginForm.onsubmit = async e => {
  e.preventDefault();
  loginMessage.innerText = "";
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
    currentUser.innerText = json.username;
    authBox.style.display = "none";
    dashboard.style.display = "block";
  } catch (err) {
    loginMessage.innerText = "❌ " + err.message;
  }
};

// Kayıt formunu göster
showRegisterBtn.style.display = "block";
showRegisterBtn.onclick = () => {
  registerForm.style.display = "block";
};

// Kayıt işlemi
registerForm.onsubmit = async e => {
  e.preventDefault();
  registerMessage.innerText = "";
  const data = Object.fromEntries(new FormData(registerForm));

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Kayıt başarısız");

    alert("✅ Kayıt başarılı! Giriş yapabilirsiniz.");
    registerForm.reset();
    registerForm.style.display = "none";
  } catch (err) {
    registerMessage.innerText = "❌ " + err.message;
  }
};

// Çıkış işlemi
window.logout = () => {
  sessionStorage.removeItem("token");
  dashboard.style.display = "none";
  authBox.style.display = "block";
  loginForm.reset();
};
