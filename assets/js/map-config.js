// assets/js/map-config.js
// Single place to configure the basemap for every Leaflet map on the site.
// Requires the global `L` (Leaflet), which each layout already loads.
// CARTO's light basemap needs no key or token.

const BASEMAP_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors ' +
  '&copy; <a href="https://carto.com/attributions">CARTO</a>';

/**
 * Adds the shared basemap to a Leaflet map so every map on the site looks the same.
 *
 * @param {L.Map} map     The Leaflet map instance.
 * @param {object} extra  Optional Leaflet tileLayer options (maxZoom, minZoom, bounds, noWrap).
 * @returns {L.TileLayer}
 */
export function addBaseLayer(map, extra = {}) {
  return L.tileLayer(BASEMAP_URL, {
    maxZoom: 20,
    attribution: ATTRIBUTION,
    ...extra
  }).addTo(map);
}
