// Detect system preference
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

// Load saved preference
const savedTheme = localStorage.getItem("theme");

// Apply theme
if (savedTheme === "light") {
  document.body.classList.add("light");
} else if (savedTheme === "dark") {
  document.body.classList.add("dark");
} else {
  if (systemPrefersDark) {
    document.body.classList.add("dark");
  }
}

// Toggle button (safe)
const toggle = document.getElementById("theme-toggle");

if (toggle) {
  toggle.addEventListener("click", () => {
    if (document.body.classList.contains("dark")) {
      document.body.classList.remove("dark");
      document.body.classList.add("light");
      localStorage.setItem("theme", "light");
    } else {
      document.body.classList.remove("light");
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  });
}
