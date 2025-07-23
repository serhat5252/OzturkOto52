const API_AUTH = "/api/auth";

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginMsg = document.getElementById("loginMessage");
const registerMsg = document.getElementById("registerMessage");
const showRegisterBtn = document.getElementById("showRegister");

loginForm.onsubmit = async e => {
  e.preventDefault();
  loginMsg.innerText = "";
  const data = Object.fromEntries(new FormData(loginForm));
  const res = await fetch(API_AUTH + "/login", {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(data)
  });
  const body = await res.json();
  if (!res.ok) return loginMsg.innerText = body.message;
  sessionStorage.setItem("token", body.token);
  sessionStorage.setItem("username", body.username);
  afterLogin();
};

showRegisterBtn.onclick = () => {
  registerForm.style.display = "block";
  loginForm.style.display = "none";
};

registerForm.onsubmit = async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(registerForm));
  const res = await fetch(API_AUTH + "/register", {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(data)
  });
  const body = await res.json();
  registerMsg.innerText = body.message || "Başarılı";
  registerMsg.style.color = res.ok ? "green" : "red";
};

function afterLogin(){
  document.getElementById("authBox").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("currentUser").innerText = sessionStorage.getItem("username");
}

function logout(){
  sessionStorage.clear();
  location.reload();
}

window.onload = () => {
  if (sessionStorage.getItem("token")) afterLogin();
};
