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
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Giriş başarısız");

    sessionStorage.setItem("token", json.token);
    sessionStorage.setItem("currentUser", json.username);

    document.getElementById("authBox").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    document.getElementById("currentUser").innerText = json.username;

    if (json.username === "admin") {
      showRegisterBtn.style.display = "inline-block";
    }
  } catch (err) {
    loginMessage.innerText = "❌ " + err.message;
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

showRegisterBtn.onclick = () => {
  registerForm.style.display = "block";
  showRegisterBtn.style.display = "none";
};

function logout() {
  sessionStorage.clear();
  location.reload();
}

// TAB GEÇİŞLERİ ve OTOMATİK GİRİŞ
document.addEventListener("DOMContentLoaded", () => {
  const token = sessionStorage.getItem("token");
  const user = sessionStorage.getItem("currentUser");
  if (token && user) {
    document.getElementById("authBox").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    document.getElementById("currentUser").innerText = user;

    if (user === "admin") {
      showRegisterBtn.style.display = "inline-block";
    }
  }

  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tabContent").forEach(c => c.classList.remove("active"));

      tab.classList.add("active");
      const target = tab.getAttribute("data-tab");
      document.getElementById(target).classList.add("active");
    });
  });
});
