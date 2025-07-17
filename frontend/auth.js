const API = "http://localhost:5000/api/auth";
document.getElementById("loginForm").onsubmit = async e => {
  e.preventDefault();
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value.trim();
  const res = await fetch(`${API}/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: u, password: p })
  });
  if (!res.ok) return document.getElementById("loginMessage").innerText= (await res.json()).message;
  const d = await res.json();
  localStorage.setItem("token", d.token); localStorage.setItem("username", d.username);
  window.location.href = "dashboard.html";
};
async function register() {
  const u=prompt("Kullanıcı adı"),p=prompt("Şifre");
  if(!u||!p)return;
  const res = await fetch(`${API}/register`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: u, password: p })
  });
  alert(res.ok ? "Kayıt oldu" : "Hata: "+(await res.json()).message);
}
