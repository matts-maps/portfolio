(function () {
  const toggle = document.getElementById("theme-toggle");
  const body = document.body;

  // Load saved theme
  const saved = localStorage.getItem("theme");
  if (saved === "dark") body.classList.add("dark");

  toggle.addEventListener("click", () => {
    body.classList.toggle("dark");
    const mode = body.classList.contains("dark") ? "dark" : "light";
    localStorage.setItem("theme", mode);
  });
})();
