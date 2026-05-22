export function openLightbox(img) {
  const overlay = document.getElementById("lightbox-overlay");
  const image = document.getElementById("lightbox-image");
  const title = document.getElementById("lightbox-title");
  const meta = document.getElementById("lightbox-meta");

  image.src = img.file.startsWith("http")
    ? img.file
    : "{{ site.baseurl }}/" + img.file;

  title.textContent = img.name;
  meta.textContent = `${img.location || img.country} • ${img.year}`;

  overlay.classList.add("open");
}

document.getElementById("lightbox-close").addEventListener("click", () => {
  document.getElementById("lightbox-overlay").classList.remove("open");
});
