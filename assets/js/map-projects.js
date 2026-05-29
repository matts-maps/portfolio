// /assets/js/map-projects.js

let map;
let clusterGroup;

export function initProjectsMap(projects) {
  const allProjects = projects; // <-- capture dataset safely

  const mapEl = document.getElementById("projects-map");
  if (!mapEl) return;

  map = L.map("projects-map", {
    scrollWheelZoom: true,
    worldCopyJump: true
  }).setView([20, 0], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  clusterGroup = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 40
  });

  map.addLayer(clusterGroup);

  /* --------------------------------------------------
     DETAILS PANEL
  -------------------------------------------------- */
  const panel = document.getElementById("project-details-panel");
  const closeBtn = document.getElementById("close-project-details");

  const titleEl = document.getElementById("project-title");
  const orgEl = document.getElementById("project-organisation");
  const typeEl = document.getElementById("project-type");
  const disasterEl = document.getElementById("project-disaster");
  const locationEl = document.getElementById("project-location");
  const countryEl = document.getElementById("project-country");
  const yearEl = document.getElementById("project-year");
  const descriptionEl = document.getElementById("project-description");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      panel.classList.add("hidden");
    });
  }

  function openDetails(item) {
    // Title
    titleEl.textContent = item.name || "";

    // Location
    if (item.location) {
      locationEl.textContent = Array.isArray(item.location)
        ? item.location.join(", ")
        : item.location;
      locationEl.style.display = "block";
    } else {
      locationEl.style.display = "none";
    }

    // Country · Year
    countryEl.textContent = item.country || "";
    yearEl.textContent = item.year || "";

    const countryYearRow = countryEl.parentElement;
    countryYearRow.style.display =
      item.country || item.year ? "block" : "none";

    // Type · Disaster
    typeEl.textContent = item.type || "";
    disasterEl.textContent = item.disaster || "";
    disasterEl.style.display = item.disaster ? "inline" : "none";

    const typeDisasterRow = typeEl.parentElement;
    typeDisasterRow.style.display =
      item.type || item.disaster ? "block" : "none";

    // Description
    descriptionEl.textContent = item.description || "";

    // Organisations
    if (item.organisation) {
      orgEl.textContent = Array.isArray(item.organisation)
        ? item.organisation.join(", ")
        : item.organisation;
      orgEl.style.display = "block";
    } else {
      orgEl.style.display = "none";
    }

    panel.classList.remove("hidden");
  }

  // Expose globally for table clicks
  window.openProjectDetails = openDetails;

  /* --------------------------------------------------
     MARKER BUILDING
  -------------------------------------------------- */

  function buildMarkers(list) {
    clusterGroup.clearLayers();

    const markers = list
      .filter(p => typeof p.lat === "number" && typeof p.lng === "number")
      .map(p => {
        const marker = L.marker([p.lat, p.lng], { title: p.name });
        marker.on("click", () => openDetails(p));
        clusterGroup.addLayer(marker);
        return marker;
      });

    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds(), { padding: [40, 40] });
    } else {
      map.setView([20, 0], 2);
    }
  }

  /* --------------------------------------------------
     FILTERS
  -------------------------------------------------- */

  const searchInput = document.getElementById("project-search");
  const themeSelect = document.getElementById("theme-filter");
  const continentSelect = document.getElementById("continent-filter");
  const countrySelect = document.getElementById("country-filter");
  const modalitySelect = document.getElementById("modality-filter");
  const resetBtn = document.getElementById("reset-filters");

  function applyFilters() {
    const q = searchInput?.value?.toLowerCase() || "";
    const theme = themeSelect?.value || "";
    const continent = continentSelect?.value || "";
    const country = countrySelect?.value || "";
    const modality = modalitySelect?.value || "";

    const filtered = allProjects.filter(p => {
      const countries = Array.isArray(p.country) ? p.country : [p.country];
      const continents = Array.isArray(p.continent) ? p.continent : [p.continent];
      const locations = Array.isArray(p.location) ? p.location : [p.location];

      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        countries.some(c => c?.toLowerCase().includes(q)) ||
        locations.some(l => l?.toLowerCase().includes(q));

      const matchesTheme =
        !theme ||
        (Array.isArray(p.themes)
          ? p.themes.includes(theme)
          : p.themes === theme);

      const matchesContinent =
        !continent || continents.includes(continent);

      const matchesCountry =
        !country || countries.includes(country);

      const matchesModality =
        !modality || p.modality === modality;

      return (
        matchesSearch &&
        matchesTheme &&
        matchesContinent &&
        matchesCountry &&
        matchesModality
      );
    });

    buildMarkers(filtered);

    // COUNTRY-LEVEL ZOOM OVERRIDE
    if (country && filtered.length > 0) {
      const first = filtered[0];

      if (typeof first.lat === "number" && typeof first.lng === "number") {
        map.setView([first.lat, first.lng], 5);
        return filtered;
      }
    }

    return filtered;
  }

  /* --------------------------------------------------
     RESET BUTTON
  -------------------------------------------------- */

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (themeSelect) themeSelect.value = "";
      if (continentSelect) continentSelect.value = "";
      if (countrySelect) countrySelect.value = "";
      if (modalitySelect) modalitySelect.value = "";

      buildMarkers(allProjects);
    });
  }

  /* --------------------------------------------------
     INITIAL LOAD + LISTENERS
  -------------------------------------------------- */

  buildMarkers(allProjects);

  [
    searchInput,
    themeSelect,
    continentSelect,
    countrySelect,
    modalitySelect
  ].forEach(el => {
    if (!el) return;
    el.addEventListener("input", applyFilters);
    el.addEventListener("change", applyFilters);
  });

  // Expose map update function for table → map sync
  window.updateMapMarkers = list => buildMarkers(list);
}
