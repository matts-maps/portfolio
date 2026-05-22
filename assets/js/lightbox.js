(function () {
  const root = document.getElementById("lightbox");
  if (!root) return;

  const img = document.getElementById("lightbox-image");
  const titleEl = document.getElementById("lightbox-title");
  const descEl = document.getElementById("lightbox-description");
  const closeBtn = document.getElementById("lightbox-close");
  const backdrop = root.querySelector(".lightbox-backdrop");

  function open(item) {
    img.src = item.image || "";
    img.alt = item.title || "";
    titleEl.textContent = item.title || "";
    descEl.textContent = item.description || "";
    root.classList.remove("hidden");
  }

  function close() {
    root.classList.add("hidden");
  }

  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  window.Lightbox = { open, close };
})();
