// /assets/js/map-projects.js

let map;
let clusterGroup;

/* --------------------------------------------------
   COLOR PALETTE BY TYPE
-------------------------------------------------- */
const typeColors = {
  "Response": "#e63946",
  "Training": "#457b9d",
  "Preparedness and anticipatory action": "#2a9d8f",
  "Development": "#f4a261",
  "Other": "#999999",
  "": "#999999"
};

/* --------------------------------------------------
   MARKER FACTORIES
-------------------------------------------------- */
function createCircleMarker(p, color) {
  const marker = L.circleMarker([p.lat, p.lng], {
    radius: 7,
    color,
    weight: 2,
    fillColor: color,
    fillOpacity: 0.7
  });
  marker.projectId = p.name;
  marker.projectType = p.type || "Other";
  marker.projectStatus = p.status || "";
  return marker;
}

function createStarMarker(p, color) {
  const svg = "<svg width='20' height='20' viewBox='0 0 40 40'><polygon points='20,4 25,15 37,15 27,23 31,35 20,28 9,35 13,23 3,15 15,15' fill='" + color + "' stroke='" + color + "' stroke-width='2'/></svg>";

  const icon = L.divIcon({
    html: svg,
    className: "star-icon",
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  const marker = L.marker([p.lat, p.lng], { icon });
  marker.projectId = p.name;
  marker.projectType = p.type || "Other";
  marker.projectStatus = p.status || "";
  return marker;
}

/* --------------------------------------------------
   CLUSTER ICON (TYPE-BASED, MAJORITY)
-------------------------------------------------- */
function createClusterIcon(cluster) {
  const markers = cluster.getAllChildMarkers();
  const counts = {};

  markers.forEach(m => {
    const t = m.projectType || "Other";
    counts[t] = (counts[t] || 0) + 1;
  });

  let dominantType = "Other";
  let maxCount = -1;
  Object.keys(counts).forEach(t => {
    if (counts[t] > maxCount) {
      maxCount = counts[t];
      dominantType = t;
    }
  });

  const color = typeColors[dominantType] || typeColors["Other"];
  const count = cluster.getChildCount();

  const sizeClass =
    count < 10 ? "cluster-small" :
    count < 50 ? "cluster-medium" :
    "cluster-large";

  const html = "<div class='cluster-inner' style='background:" + color + ";'><span>" + count + "</span></div>";

  return L.divIcon({
    html,
    className: "custom-cluster-icon " + sizeClass,
    iconSize: [40, 40]
  });
}

/* --------------------------------------------------
   INITIALISE MAP
-------------------------------------------------- */
export function initProjectsMap(projects) {
  const allProjects = projects;

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
    maxClusterRadius: 40,
    iconCreateFunction: createClusterIcon
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
    if (!item) return;

    titleEl.textContent = item.name || "";

    if (item.location) {
      locationEl.textContent = Array.isArray(item.location)
        ? item.location.join(", ")
        : item.location;
      locationEl.style.display = "block";
    } else {
      locationEl.style.display = "none";
    }

    countryEl.textContent = item.country || "";
    yearEl.textContent = item.year || "";

    const countryYearRow = countryEl.parentElement;
    countryYearRow.style.display =
      item.country || item.year ? "block" : "none";

    typeEl.textContent = item.type || "";
    disasterEl.textContent = item.disaster || "";
    disasterEl.style.display = item.disaster ? "inline" : "none";

    const typeDisasterRow = typeEl.parentElement;
    typeDisasterRow.style.display =
      item.type || item.disaster ? "block" : "none";

    descriptionEl.textContent = item.description || "";

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

  window.openProjectDetails = openDetails;

  /* --------------------------------------------------
     BUILD MARKERS
  -------------------------------------------------- */
  function buildMarkers(list) {
    clusterGroup.clearLayers();

    const pts = list.filter(
      p => typeof p.lat === "number" && typeof p.lng === "number"
    );

    pts.forEach(p => {
      const color = typeColors[p.type] || typeColors["Other"];

      const marker =
        p.status === "Current"
          ? createStarMarker(p, color)
          : createCircleMarker(p, color);

      marker.on("click", () => {
        openDetails(p);
      });

      clusterGroup.addLayer(marker);
    });

    if (pts.length > 0) {
      const group = L.featureGroup(
        pts.map(p => L.marker([p.lat, p.lng]))
      );
      map.fitBounds(group.getBounds(), {
        padding: [40, 40],
        animate: true,
        duration: 1.0,
        easeLinearity: 0.25
      });
    } else {
      map.setView([20, 0], 2);
    }
  }

  buildMarkers(allProjects);

  /* --------------------------------------------------
     EXPOSE UPDATE FUNCTION FOR FILTERS
  -------------------------------------------------- */
  window.updateMapMarkers = list => buildMarkers(list);
}
