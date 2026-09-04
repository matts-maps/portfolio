import { initFilterEngine, SORT } from "./filter-engine.js";
import { loadProjects } from "./data-adapter.js";

// Start the fetch as soon as the module runs, so it's already in flight by
// the time DOMContentLoaded fires below.
const projectsPromise = loadProjects();

document.addEventListener("DOMContentLoaded", async () => {

  const projects = await projectsPromise;

  // Assign unique IDs to every project
  projects.forEach((p, index) => {
    p.id = index;
  });

  const mapEl = document.getElementById("projects-map");
  const tableBody = document.getElementById("project-table-body");
  const panel = document.getElementById("project-details-panel");
  const closeBtn = document.getElementById("panel-close-btn");

  const titleEl = document.getElementById("project-title");
  const metaEl = document.getElementById("project-meta-line");
  const parentLineEl = document.getElementById("project-parent-line");
  const parentValueEl = document.getElementById("project-parent-value");
  const descEl = document.getElementById("project-description");
  const partnersHeading = document.getElementById("partners-heading");
  const partnersList = document.getElementById("project-partners-list");

  const mobilePanelQuery = window.matchMedia("(max-width: 900px)");

  // On mobile the panel is a bottom sheet that should start closed until
  // the user taps a marker or table row, rather than always covering the
  // filter bar on load.
  if (mobilePanelQuery.matches) {
    panel.classList.add("hidden");
  }

  closeBtn?.addEventListener("click", () => {
    panel.classList.add("hidden");
  });

  // Tracks the current filtered list so the panel can be (re)populated if
  // the viewport crosses the mobile breakpoint after load, since on mobile
  // the panel is never filled in until the user taps a marker/row.
  let latestFilteredProjects = [];

  mobilePanelQuery.addEventListener("change", (e) => {
    if (e.matches) {
      panel.classList.add("hidden");
    } else if (latestFilteredProjects.length) {
      fillPanelOnly(latestFilteredProjects[0]);
    }
  });

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

  // A project can have more than one location (e.g. a regional programme),
  // so each id maps to an array of markers, not a single marker.
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
      const markers = (p.locations || []).map(loc => {
        const marker = L.marker([loc.lat, loc.lng], { icon: getMarkerIcon(p) });
        marker.on("click", () => openDetails(p));
        return marker;
      });
      markerById.set(p.id, markers);
    });
  }

  /* --------------------------------------------------
      PANEL-ONLY UPDATE (NO MAP ZOOM)
  -------------------------------------------------- */
  function fillPanelOnly(p) {
    titleEl.textContent = p.name;

    metaEl.textContent = [
      p.countries.join(', '),
      p.year,
      p.type,
      p.disaster
    ].filter(Boolean).join(" · ");

    // "Part of" note — shown only for projects that belong to a wider,
    // multi-country programme (e.g. entries duplicated per-country that
    // share a parentProject name), tying them back together in the panel.
    if (p.parentProject && p.parentProject.trim() !== "") {
      const parentDescription = p.parentProjectDescription?.trim();
      parentValueEl.textContent = parentDescription
        ? `${p.parentProject.trim()} — ${parentDescription}`
        : p.parentProject.trim();
      parentLineEl.style.display = "block";
    } else {
      parentLineEl.style.display = "none";
    }

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
    fullscreenDetails(p);

    const markers = markerById.get(p.id) || [];
    if (markers.length === 1) {
      map.setView(markers[0].getLatLng(), 6, { animate: true });
    } else if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map(m => m.getLatLng()));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6, animate: true });
    }
  }

  // Backwards-compatible alias for explicit initialization routines
  function fullscreenDetails(p) {
    fillPanelOnly(p);
  }

  /* --------------------------------------------------
      UPDATE MAP BASED ON FILTERED RESULTS
  -------------------------------------------------- */
  function updateMap(list) {
    cluster.clearLayers();

    const coords = [];
    list.forEach(p => {
      const markers = markerById.get(p.id) || [];
      markers.forEach(marker => {
        cluster.addLayer(marker);
        coords.push(marker.getLatLng());
      });
    });

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
      UPDATE TABLE — ALIGNED WITH REVISED HEADERS
  -------------------------------------------------- */
  function updateTable(list) {
    tableBody.innerHTML = "";

    list.forEach(p => {
      const tr = document.createElement("tr");
      // CHANGED: Replaced p.themes array display with a cleaner p.type string column and removed the location column cell
      tr.innerHTML = `
        <td>${p.name}</td>
        <td>${p.year}</td>
        <td>${p.type || ""}</td>
        <td>${p.countries.join(', ')}</td>
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

  initFilterEngine(projects, filtered => {
    updateMap(filtered);
    updateTable(filtered);
    latestFilteredProjects = filtered;

    // Show most recent project in panel, but DO NOT zoom map.
    // Skipped on mobile, where the panel is a bottom sheet that should stay
    // closed until the user explicitly taps a marker or table row.
    if (filtered.length && !mobilePanelQuery.matches) {
      fillPanelOnly(filtered[0]);
    }
  }, {
    sortEl: "sort-select",
    resetEl: "reset-filters",
    fields: [
      { key: "continent", prop: "continents", elId: "filter-continent", arrayValued: true },
      { key: "country", prop: "countries", elId: "filter-country", arrayValued: true },
      { key: "disaster", elId: "filter-disaster", arrayValued: true },
      { key: "type", elId: "filter-type" },
      { key: "modality", elId: "filter-modality", arrayValued: true },
      { key: "level", elId: "filter-level", arrayValued: true },
      { key: "status", elId: "filter-status" }
    ],
    sort: {
      alpha: SORT.alpha,
      year: SORT.year,
      yearmonth: SORT.yearmonth,
      type: SORT.byField("type")
    }
  });

});