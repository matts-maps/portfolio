// /assets/js/map-projects.js
// FINAL PRODUCTION VERSION — GLOBAL LEAFLET, NO ESM IMPORTS

export function initProjectsMap(projects) {
  const mapEl = document.getElementById("projects-map");
  if (!mapEl) return;

  // ------------------------------------------------------------
  // MAP INITIALIZATION
  // ------------------------------------------------------------
  const map = L.map("projects-map", {
    scrollWheelZoom: true,
    worldCopyJump: true
  }).setView([20, 0], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  const clusterGroup = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 40
  });

  // ------------------------------------------------------------
  // DETAILS PANEL
  // ------------------------------------------------------------
  const panel = document.getElementById("project-details-panel");
  const panelContent = document.getElementById("project-details-content");
  const panelClose = document.getElementById("project-details-close");

  if (panelClose) {
    panelClose.addEventListener("click", () => {
      panel.classList.remove("open");
    });
  }

  function openDetails(item) {
    panelContent.innerHTML = `
      <h2>${item.name}</h2>
      <p><strong>Country:</strong> ${item.country || ""}</p>
      <p><strong>Location:</strong> ${item.location || ""}</p>
      <p><strong>Year:</strong> ${item.year || ""}</p>
      <p><strong>Type:</strong> ${item.type || ""}</p>
      <p>${item.description || ""}</p>
    `;
    panel.classList.add("open");
  }

  // ------------------------------------------------------------
  // MARKER CREATION
  // ------------------------------------------------------------
  let markers = [];

  function buildMarkers(list) {
    clusterGroup.clearLayers();
    markers = [];

    list.forEach(item => {
      if (typeof item.lat !== "number" || typeof item.lng !== "number") return;

      const marker = L.marker([item.lat, item.lng], {
        title: item.name
      });

      marker.on("click", () => openDetails(item));

      markers.push(marker);
      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);
  }

  // Initial load
  buildMarkers(projects);

  // ------------------------------------------------------------
  // FILTER SYSTEM
  // ------------------------------------------------------------
  const searchInput = document.getElementById("project-search");
  const typeSelect = document.getElementById("project-type");
  const yearSelect = document.getElementById("project-year");

  function applyFilters() {
    const q = searchInput?.value?.toLowerCase() || "";
    const type = typeSelect?.value || "";
    const year = yearSelect?.value || "";

    const filtered = projects.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        (p.country || "").toLowerCase().includes(q) ||
        (p.location || "").toLowerCase().includes(q);

      const matchesType = type === "" || p.type === type;
      const matchesYear = year === "" || String(p.year) === year;

      return matchesSearch && matchesType && matchesYear;
    });

    buildMarkers(filtered);
  }

  if (searchInput) searchInput.addEventListener("input", applyFilters);
  if (typeSelect) typeSelect.addEventListener("change", applyFilters);
  if (yearSelect) yearSelect.addEventListener("change", applyFilters);
}
