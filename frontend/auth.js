const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginMessage = document.getElementById("loginMessage");
const registerMessage = document.getElementById("registerMessage");
const showRegisterBtn = document.getElementById("showRegister");

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
    document.getElementById("currentUser").innerText = json.username;
    document.getElementById("authBox").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
  } catch (err) {
    loginMessage.innerText = err.message;
  }
};

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

    registerMessage.innerText = "Kayıt başarılı!";
    registerForm.reset();
  } catch (err) {
    registerMessage.innerText = err.message;
  }
};

showRegisterBtn.onclick = () => {
  registerForm.style.display = "block";
  showRegisterBtn.style.display = "none";
};

function logout() {
  sessionStorage.removeItem("token");
  location.reload();
}

// Eğer token varsa otomatik giriş yap
document.addEventListener("DOMContentLoaded", () => {
  const token = sessionStorage.getItem("token");
  if (token) {
    document.getElementById("authBox").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
  }
});
