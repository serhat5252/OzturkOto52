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

    showTab("urunIslemleri");
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

// Sayfa yüklenince
document.addEventListener("DOMContentLoaded", () => {
  const token = sessionStorage.getItem("token");
  const user = sessionStorage.getItem("currentUser");

  if (token && user) {
    document.getElementById("authBox").style.display = "none";
    document.getElementById("dashboard").style.display = "flex";
    document.getElementById("currentUser").innerText = user;
  }

  const tabs = document.querySelectorAll(".tab");
  const contents = document.querySelectorAll(".tabContent");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));

      tab.classList.add("active");
      const id = tab.getAttribute("data-tab");
      document.getElementById(id).classList.add("active");
    });
  });
});

function showTab(tabId) {
  const tabs = document.querySelectorAll(".tab");
  const contents = document.querySelectorAll(".tabContent");

  tabs.forEach(t => t.classList.remove("active"));
  contents.forEach(c => c.classList.remove("active"));

  const tab = document.querySelector(`.tab[data-tab="${tabId}"]`);
  const content = document.getElementById(tabId);

  if (tab && content) {
    tab.classList.add("active");
    content.classList.add("active");
  }
}
