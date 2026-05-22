const map = L.map("maps-map").setView([20, 0], 2);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19
}).addTo(map);

galleryData.forEach(item => {
  L.marker([item.lat, item.lng])
    .addTo(map)
    .bindPopup(`<strong>${item.name}</strong>`);
});
