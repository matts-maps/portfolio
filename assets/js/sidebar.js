// assets/js/sidebar.js
// Simple sidebar toggle for the projects page

export function initSidebar() {
  const sidebar = document.querySelector("[data-sidebar]");
  const toggle = document.querySelector("[data-sidebar-toggle]");

  if (!sidebar || !toggle) return;

  toggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });
}

document.addEventListener("DOMContentLoaded", initSidebar);
