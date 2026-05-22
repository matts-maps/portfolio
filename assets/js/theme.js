const THEME_KEY = "fantail-theme";

function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  const logo = document.getElementById("site-logo");
  if (!logo) return;

  if (theme === "dark") {
    logo.src = "assets/images/logo/fantail-logo-white.svg";
  } else {
    logo.src = "assets/images/logo/fantail-logo-black.svg";
  }
}

function getStoredTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
}

function toggleTheme() {
  const current = getStoredTheme();
  const next = current === "light" ? "dark" : "light";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

export function initTheme() {
  applyTheme(getStoredTheme());
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.addEventListener("click", toggleTheme);
}

document.addEventListener("DOMContentLoaded", initTheme);
