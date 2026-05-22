import { images } from "./gallery-data.js";

function initMapGallery() {
  const mapContainer = document.getElementById("maps-map");
  if (!mapContainer) return;

  const map = L.map("maps-map").setView([20, 0], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  images.forEach(item => {
    if (typeof item.lat !== "number" || typeof item.lng !== "number") return;

    const marker = L.marker([item.lat, item.lng]).addTo(map);
    const title = item.name;
    const meta = `${item.country || ""}${item.location ? " — " + item.location : ""}`;

    marker.bindPopup(`
      <strong>${title}</strong><br>
      ${meta}<br>
      ${item.disaster || ""} ${item.themes && item.themes.length ? "— " + item.themes.join(", ") : ""}
    `);
  });
}

document.addEventListener("DOMContentLoaded", initMapGallery);
