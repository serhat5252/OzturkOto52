const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

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
  } catch (err) {
    loginMessage.innerText = "❌ " + err.message;
  }
};

function logout() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("currentUser");
  location.reload();
}

document.addEventListener("DOMContentLoaded", () => {
  const token = sessionStorage.getItem("token");
  const currentUser = sessionStorage.getItem("currentUser");

  if (token && currentUser) {
    document.getElementById("authBox").style.display = "none";
    document.getElementById("dashboard").style.display = "flex";
    document.getElementById("currentUser").innerText = currentUser;
  }

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

// Kullanıcı ekleme
const userForm = document.getElementById("userForm");
if (userForm) {
  userForm.onsubmit = async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(userForm));
    const msgEl = document.getElementById("userMsg");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token()
        },
        body: JSON.stringify(data)
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Kayıt başarısız");

      msgEl.innerText = "✅ Kullanıcı eklendi!";
      userForm.reset();
    } catch (err) {
      msgEl.innerText = "❌ " + err.message;
    }
  };
}
