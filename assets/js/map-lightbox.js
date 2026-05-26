// assets/js/map-lightbox.js

export function openMapLightbox(item) {
  const box = document.getElementById("map-lightbox");
  const img = document.getElementById("map-lightbox-img");
  const caption = document.getElementById("map-lightbox-caption");

  const base = box.dataset.baseurl || "";
  const file = item.file;

  const path = file.startsWith("/")
    ? `${base}${file}`
    : `${base}/${file}`;

  img.src = path;
  img.alt = item.name || "";

  caption.innerHTML = `
    <strong>${item.name || ""}</strong><br>
    ${item.location || ""}${item.country ? ", " + item.country : ""} • ${item.year || ""}
  `;

  box.classList.remove("hidden");
}

function closeMapLightbox() {
  const box = document.getElementById("map-lightbox");
  if (box) box.classList.add("hidden");
}

const closeBtn = document.getElementById("map-lightbox-close");
if (closeBtn) {
  closeBtn.addEventListener("click", closeMapLightbox);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMapLightbox();
});
