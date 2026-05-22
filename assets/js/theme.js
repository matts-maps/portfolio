// assets/js/theme.js
// Handles dark/light mode toggle and logo switching

export function initThemeToggle() {
  const toggle = document.getElementById("dark-toggle");
  const logo = document.getElementById("site-logo");

  if (!toggle) return;

  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (prefersDark) {
    document.body.classList.add("dark");
    if (logo) logo.src = "assets/images/logos/fantail-logo-white.svg";
    toggle.textContent = "☀️";
  } else {
    toggle.textContent = "🌙";
  }

  toggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");

    if (logo) {
      logo.src = isDark
        ? "assets/images/logos/fantail-logo-white.svg"
        : "assets/images/logos/fantail-logo-black.svg";
    }

    toggle.textContent = isDark ? "☀️" : "🌙";
  });
}

document.addEventListener("DOMContentLoaded", initThemeToggle);
