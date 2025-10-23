document.getElementById("loginBtn").addEventListener("click", () => {
  const password = document.getElementById("password").value.trim();

  // ✅ Set your admin password here
  const ADMIN_PASSWORD = "GuildAdmin123"; // change this to your preferred password

  if (password === ADMIN_PASSWORD) {
    // Save login session so reload won't ask again
    localStorage.setItem("guild_admin_logged_in", "true");
    window.location.href = "admin.html";
  } else {
    const msg = document.getElementById("errorMsg");
    msg.classList.remove("hidden");
    msg.textContent = "Invalid password. Try again.";
  }
});

// Optional: If already logged in, go straight to admin
if (localStorage.getItem("guild_admin_logged_in") === "true") {
  window.location.href = "admin.html";
}