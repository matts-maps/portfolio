export function openLightbox(item) {
  const box = document.getElementById("lightbox");
  const img = document.getElementById("lightbox-img");
  const caption = document.getElementById("lightbox-caption");

  img.src = item.file;
  img.alt = item.name || "";

  caption.innerHTML = `
    <strong>${item.name || ""}</strong><br>
    ${item.location || ""}${item.country ? ", " + item.country : ""} • ${item.year || ""}
  `;

  box.classList.remove("hidden");
}

function closeLightbox() {
  document.getElementById("lightbox").classList.add("hidden");
}

document.getElementById("lightbox-close")
  .addEventListener("click", closeLightbox);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});
