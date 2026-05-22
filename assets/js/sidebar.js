const sidebar = document.querySelector("[data-sidebar]");
const toggle = document.querySelector("[data-sidebar-toggle]");

toggle.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});
