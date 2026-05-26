// Map Lightbox Logic (fixed for GitHub Pages baseurl)

const mapLightbox = document.getElementById("map-lightbox");
const mapLightboxImg = document.getElementById("map-lightbox-img");
const mapLightboxCaption = document.getElementById("map-lightbox-caption");
const mapLightboxClose = document.getElementById("map-lightbox-close");

// Read baseurl from HTML (works locally + GitHub Pages)
const MAP_BASE = mapLightbox.dataset.baseurl || "";

// Open the map lightbox
export function openMapLightbox(item) {
  // Prepend baseurl to the image path
  mapLightboxImg.src = `${MAP_BASE}${item.file}`;
  mapLightboxImg.alt = item.name || "";

  mapLightboxCaption.textContent = item.name || "";

  mapLightbox.classList.remove("hidden");
}

// Close on background click
mapLightbox.addEventListener("click", (e) => {
  if (e.target === mapLightbox) {
    mapLightbox.classList.add("hidden");
  }
});

// Close button
mapLightboxClose.addEventListener("click", () => {
  mapLightbox.classList.add("hidden");
});

// Close on Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    mapLightbox.classList.add("hidden");
  }
});
