import { images } from "{{ site.baseurl }}/assets/js/gallery-data.js";

function initMapGallery() {
  const map = L.map("maps-map").setView([20, 0], 2);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
  }).addTo(map);

  images.forEach(img => {
    const marker = L.marker([img.lat, img.lng]).addTo(map);

    marker.bindPopup(`
      <strong>${img.name}</strong><br>
      ${img.location || img.country}<br>
      <img src="${img.file.startsWith("http") ? img.file : "{{ site.baseurl }}/" + img.file}" class="popup-thumb">
    `);
  });
}

document.addEventListener("DOMContentLoaded", initMapGallery);
