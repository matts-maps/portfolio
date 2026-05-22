export function initLightbox(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  let overlay = document.getElementById("lightbox-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "lightbox-overlay";
    overlay.innerHTML = `
      <div class="lightbox-content">
        <button id="lightbox-close" aria-label="Close">&times;</button>
        <img id="lightbox-image" alt="">
        <h3 id="lightbox-title"></h3>
        <p id="lightbox-meta"></p>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  const imgEl = overlay.querySelector("#lightbox-image");
  const titleEl = overlay.querySelector("#lightbox-title");
  const metaEl = overlay.querySelector("#lightbox-meta");
  const closeBtn = overlay.querySelector("#lightbox-close");

  function openLightbox(src, title, meta) {
    imgEl.src = src;
    imgEl.alt = title;
    titleEl.textContent = title;
    metaEl.textContent = meta || "";
    overlay.classList.add("open");
  }

  function closeLightbox() {
    overlay.classList.remove("open");
  }

  closeBtn.addEventListener("click", closeLightbox);
  overlay.addEventListener("click", e => {
    if (e.target === overlay) closeLightbox();
  });

  container.addEventListener("click", e => {
    const card = e.target.closest("[data-lightbox-item]");
    if (!card) return;
    const img = card.querySelector("img");
    const title = card.querySelector("h3")?.textContent || "";
    const meta = card.querySelector("p")?.textContent || "";
    if (img) openLightbox(img.src, title, meta);
  });
}
