const loginForm = document.getElementById("loginForm"),
      registerForm = document.getElementById("registerForm");
const loginMessage = document.getElementById("loginMessage"),
      registerMessage = document.getElementById("registerMessage");

document.getElementById("showRegister").onclick = e => {
  e.preventDefault();
  loginForm.style.display = "none";
  document.getElementById("showRegister").parentElement.style.display = "none";
  registerForm.style.display = "block";
  document.getElementById("backToLogin").style.display = "block";
};

document.getElementById("showLogin").onclick = e => {
  e.preventDefault();
  loginForm.style.display = "block";
  document.getElementById("showRegister").parentElement.style.display = "block";
  registerForm.style.display = "none";
  document.getElementById("backToLogin").style.display = "none";
};

// Kayıt işlemi
registerForm.onsubmit = async e => {
  e.preventDefault();
  registerMessage.innerText = "";
  const data = Object.fromEntries(new FormData(registerForm));
  try {
    const res = await fetch("/api/auth/register", {
      method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data)
    });
    const body = await res.json();
    if (!res.ok) throw body.message;
    registerMessage.style.color = "green";
    registerMessage.innerText = "Kayıt başarılı! Giriş yapabilirsiniz.";
  } catch(err) {
    registerMessage.style.color = "red";
    registerMessage.innerText = err;
  }
};

// Giriş işlemi
loginForm.onsubmit = async e => {
  e.preventDefault();
  loginMessage.innerText = "";
  const data = Object.fromEntries(new FormData(loginForm));
  try {
    const res = await fetch("/api/auth/login", {
      method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data)
    });
    const body = await res.json();
    if (!res.ok) throw body.message;
    localStorage.setItem("token", body.token);
    localStorage.setItem("username", body.username);
    document.body.className = "dashboard";
    document.getElementById("authBox").style.display = "none";
    document.getElementById("dashboard").style.display = "flex";
    document.getElementById("currentUser").innerText = body.username;
    fetchProducts(); setupSocket();
  } catch(err) {
    loginMessage.innerText = err;
  }
};

function logout(){
  localStorage.clear();
  location.reload();
}

