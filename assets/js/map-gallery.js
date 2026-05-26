// Import the images dataset (adjust path if needed)
import { images } from "./gallery-data.js";

// Main map initializer
export default function initMap(images) {
  // Create the map
  const map = L.map("map").setView([0, 0], 2);

  // Add the tile layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  // Create marker cluster group
  const markers = L.markerClusterGroup();

  // Add markers for each image
  images.forEach(item => {
    if (!item.lat || !item.lng) return;

    const marker = L.marker([item.lat, item.lng]);

    marker.on("click", () => {
      const lightbox = document.getElementById("map-lightbox");
      const img = document.getElementById("map-lightbox-img");
      const caption = document.getElementById("map-lightbox-caption");

      const base = lightbox.dataset.baseurl || "";
      const file = item.file; // your dataset uses "file", not "image"

      const path = file.startsWith("/")
        ? `${base}${file}`
        : `${base}/${file}`;

      img.src = path;
      caption.textContent = item.name || "";

      lightbox.classList.remove("hidden");
    });


    markers.addLayer(marker);
  });

  map.addLayer(markers);
}

// Auto‑initialize the map when this module loads
initMap(images);
