// assets/js/map-config.js
// Single place to configure the basemap for every Leaflet map on the site.
// Requires the global `L` (Leaflet), which each layout already loads.
// Esri's Light Gray Canvas needs no key or token.

const BASE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";
const LABELS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}";

const ATTRIBUTION = "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ";

// The tiles stop at zoom 16; beyond that Leaflet stretches the last level.
const NATIVE_MAX_ZOOM = 16;

/**
 * Adds the shared basemap (light grey base plus place labels) to a Leaflet map,
 * so every map on the site looks the same.
 *
 * @param {L.Map} map     The Leaflet map instance.
 * @param {object} extra  Optional Leaflet tileLayer options (maxZoom, minZoom, bounds, noWrap).
 * @returns {L.TileLayer} The base tile layer.
 */
export function addBaseLayer(map, extra = {}) {
  const options = {
    maxZoom: 20,
    maxNativeZoom: NATIVE_MAX_ZOOM,
    ...extra
  };

  const base = L.tileLayer(BASE_URL, { ...options, attribution: ATTRIBUTION }).addTo(map);

  // Labels sit in their own pane above the tiles but below markers.
  if (!map.getPane("basemapLabels")) {
    map.createPane("basemapLabels").style.zIndex = 250;
    map.getPane("basemapLabels").style.pointerEvents = "none";
  }
  L.tileLayer(LABELS_URL, { ...options, pane: "basemapLabels" }).addTo(map);

  return base;
}
