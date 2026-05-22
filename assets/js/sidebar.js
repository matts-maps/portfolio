(function () {
  const sidebar = document.getElementById("project-sidebar");
  if (!sidebar) return;

  const titleEl = document.getElementById("sidebar-title");
  const locEl = document.getElementById("sidebar-location");
  const tagsEl = document.getElementById("sidebar-tags");
  const descEl = document.getElementById("sidebar-description");
  const linkEl = document.getElementById("sidebar-link");
  const closeBtn = document.getElementById("sidebar-close");

  function open(item) {
    titleEl.textContent = item.title || "";
    locEl.textContent = item.location || "";
    tagsEl.textContent = item.tag ? `Tag: ${item.tag}` : "";
    descEl.textContent = item.description || "";
    if (item.link) {
      linkEl.href = item.link;
      linkEl.style.display = "inline-block";
    } else {
      linkEl.style.display = "none";
    }

    sidebar.classList.remove("closed");
    sidebar.classList.add("open");
  }

  function close() {
    sidebar.classList.remove("open");
    sidebar.classList.add("closed");
  }

  closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  window.ProjectSidebar = { open, close };
})();
