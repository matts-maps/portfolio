import { images } from "./gallery-data.js";
import { openMapLightbox, setMapLightboxList } from "./map-lightbox.js";
import { initFilters } from "./filter-engine.js";

const map = L.map("map", {
  center: [15, 20],
  zoom: 2,
  worldCopyJump: true
});

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

let markers = L.markerClusterGroup();
map.addLayer(markers);

function renderMarkers(list) {
  markers.clearLayers();

  const bounds = [];

  list.forEach((item, index) => {
    if (!item.lat || !item.lng) return;

    const marker = L.marker([item.lat, item.lng]);

    marker.on("click", () => openMapLightbox(item, index));

    markers.addLayer(marker);
    bounds.push([item.lat, item.lng]);
  });

  if (bounds.length === 1) {
    map.setView(bounds[0], 8);
  } else if (bounds.length > 1) {
    map.fitBounds(bounds, { padding: [40, 40] });
  } else {
    map.setView([15, 20], 2);
  }
}

setMapLightboxList(images);

initFilters(images, filtered => {
  setMapLightboxList(filtered);
  renderMarkers(filtered);
});

renderMarkers(images);
