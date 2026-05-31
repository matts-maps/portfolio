import { initFilters } from "/portfolio/assets/js/filter-engine.js";
import { projects } from "/portfolio/assets/js/projects-data.js";

// Assign unique IDs to every project
projects.forEach((p, index) => {
  p.id = index;
});

document.addEventListener("DOMContentLoaded", () => {

  const mapEl = document.getElementById("projects-map");
  const tableBody = document.getElementById("project-table-body");
  const panel = document.getElementById("project-details-panel");

  const titleEl = document.getElementById("project-title");
  const metaEl = document.getElementById("project-meta-line");
  const descEl = document.getElementById("project-description");
  const partnersHeading = document.getElementById("partners-heading");
  const partnersList = document.getElementById("project-partners-list");

  /* --------------------------------------------------
     MAP INITIALIZATION — GLOBAL VIEW
  -------------------------------------------------- */
  const map = L.map(mapEl).setView([20, 0], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    minZoom: 2
  }).addTo(map);

  const cluster = L.markerClusterGroup({
    maxClusterRadius: 40,
    showCoverageOnHover: false
  });
  map.addLayer(cluster);

  const markerById = new Map();

  /* --------------------------------------------------
     MARKER ICONS — MATCH LEGEND
  -------------------------------------------------- */
  function getMarkerIcon(project) {
    const typeColors = {
      "Response": "#e63946",
      "Training": "#457b9d",
      "Preparedness and anticipatory action": "#2a9d8f",
      "Development": "#f4a261",
      "Other": "#999999"
    };

    const color = typeColors[project.type] || "#555";

    const isCurrent = project.status?.toLowerCase() === "current";

    const html = isCurrent
      ? `<div class="marker-star" style="color:${color}">★</div>`
      : `<div class="marker-circle" style="background:${color}"></div>`;

    return L.divIcon({
      html,
      className: "custom-marker",
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  }

  /* --------------------------------------------------
     CREATE MARKERS
  -------------------------------------------------- */
  function createMarkers() {
    projects.forEach(p => {
      if (p.lat == null || p.lng == null || p.lat === "" || p.lng === "") return;

      const marker = L.marker(
        [Number(p.lat), Number(p.lng)],
        { icon: getMarkerIcon(p) }
      );

      marker.on("click", () => openDetails(p));
      markerById.set(p.id, marker);
    });
  }

  /* --------------------------------------------------
     PANEL-ONLY UPDATE (NO MAP ZOOM)
  -------------------------------------------------- */
  function fillPanelOnly(p) {
    titleEl.textContent = p.name;

    metaEl.textContent = [
      p.country,
      p.year,
      p.type,
      p.disaster
    ].filter(Boolean).join(" · ");

    descEl.textContent = p.description || "";

    partnersList.innerHTML = "";
    if (p.organisation?.length) {
      partnersHeading.style.display = "block";
      p.organisation.forEach(org => {
        const li = document.createElement("li");
        li.textContent = org;
        partnersList.appendChild(li);
      });
    } else {
      partnersHeading.style.display = "none";
    }

    panel.classList.remove("hidden");
  }

  /* --------------------------------------------------
     FULL PANEL UPDATE + MAP ZOOM
  -------------------------------------------------- */
  function openDetails(p) {
    fillPanelOnly(p);

    const marker = markerById.get(p.id);
    if (marker) map.setView(marker.getLatLng(), 6, { animate: true });
  }

  /* --------------------------------------------------
     UPDATE MAP BASED ON FILTERED RESULTS
  -------------------------------------------------- */
  function updateMap(list) {
    cluster.clearLayers();

    list.forEach(p => {
      const marker = markerById.get(p.id);
      if (marker) cluster.addLayer(marker);
    });

    const coords = list
      .map(p => [Number(p.lat), Number(p.lng)])
      .filter(([lat, lng]) =>
        !isNaN(lat) &&
        !isNaN(lng) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lng) <= 180
      );

    if (coords.length === 0) return;

    if (coords.length === 1) {
      map.setView(coords[0], 6, { animate: true });
      return;
    }

    const bounds = L.latLngBounds(coords);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }

  /* --------------------------------------------------
     UPDATE TABLE
  -------------------------------------------------- */
  function updateTable(list) {
    tableBody.innerHTML = "";

    list.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.name}</td>
        <td>${p.year}</td>
        <td>${p.themes.join(", ")}</td>
        <td>${p.country}</td>
        <td>${p.location}</td>
        <td>${(p.organisation || []).join(", ")}</td>
        <td>${p.status}</td>
      `;
      tr.onclick = () => openDetails(p);
      tableBody.appendChild(tr);
    });
  }

  /* --------------------------------------------------
     INITIALIZE EVERYTHING
  -------------------------------------------------- */
  createMarkers();

  initFilters(projects, filtered => {
    updateMap(filtered);
    updateTable(filtered);

    // Show most recent project in panel, but DO NOT zoom map
    if (filtered.length) {
      fillPanelOnly(filtered[0]);
    }
  });

});
