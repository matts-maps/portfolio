const toggle = document.getElementById("theme-toggle");
const logo = document.getElementById("site-logo");

// Read baseurl from HTML (works locally + GitHub Pages)
const BASE = logo.dataset.baseurl || "";

// Swap logo based on theme
function applyLogo() {
  if (document.body.classList.contains("dark")) {
    logo.src = `${BASE}/assets/images/logo/fantail-logo-white.svg`;
  } else {
    logo.src = `${BASE}/assets/images/logo/fantail-logo-black.svg`;
  }
}

// Load saved preference
const saved = localStorage.getItem("theme");

if (saved === "dark") {
  document.body.classList.add("dark");
} else if (saved === "light") {
  document.body.classList.remove("dark");
} else {
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.body.classList.add("dark");
  }
}

applyLogo();

toggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );

  applyLogo();
});
