const map = L.map("projects-map").setView([20, 0], 2);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19
}).addTo(map);

projects.forEach(p => {
  L.marker([p.lat, p.lng])
    .addTo(map)
    .bindPopup(`<strong>${p.title}</strong>`);
});
