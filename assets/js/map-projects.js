(function () {
  const mapEl = document.getElementById("projects-map");
  if (!mapEl || !window.PROJECTS || !window.FilterUtils || !L) return;

  const map = L.map(mapEl).setView([14.5995, 120.9842], 5);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  let markersLayer = L.layerGroup().addTo(map);

  function renderMarkers() {
    markersLayer.clearLayers();
    const items = window.FilterUtils.applyFiltersToItems(window.PROJECTS);
    items.forEach((item) => {
      if (typeof item.lat !== "number" || typeof item.lng !== "number") return;
      const marker = L.marker([item.lat, item.lng]).addTo(markersLayer);
      marker.on("click", () => {
        if (window.ProjectSidebar) {
          window.ProjectSidebar.open(item);
        }
      });
    });
    if (items.length > 0) {
      const bounds = L.latLngBounds(
        items
          .filter((i) => typeof i.lat === "number" && typeof i.lng === "number")
          .map((i) => [i.lat, i.lng])
      );
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }

  window.addEventListener("filters:changed", renderMarkers);
  renderMarkers();
})();
