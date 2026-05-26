// assets/js/map-gallery.js

import { images } from "./gallery-data.js";
import { openMapLightbox } from "./map-lightbox.js";

export default function initMap(images) {
  const map = L.map("map").setView([0, 0], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  const markers = L.markerClusterGroup();

  images.forEach(item => {
    if (!item.lat || !item.lng) return;

    const marker = L.marker([item.lat, item.lng]);

    marker.on("click", () => {
      openMapLightbox(item);
    });

    markers.addLayer(marker);
  });

  map.addLayer(markers);
}

initMap(images);
