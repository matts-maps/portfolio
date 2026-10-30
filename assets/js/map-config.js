// assets/js/map-config.js
// Single place to configure the basemap for every Leaflet map on the site.
// Requires the global `L` (Leaflet), which each layout already loads.

// Mapbox PUBLIC access token (starts with "pk."). Never put a secret token ("sk.") here.
// Public tokens are visible in the page source by design, so restrict this one to your
// site's URL in the Mapbox account (Tokens > your token > URL restrictions).
export const MAPBOX_TOKEN = "PASTE_YOUR_PK_TOKEN_HERE";

// One shared style so every map looks the same. light-v11 is the closest Mapbox match
// to the CARTO "light_all" look the site uses now.
export const MAPBOX_STYLE = "mapbox/light-v11";

const ATTRIBUTION =
  '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> ' +
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
  '<strong><a href="https://www.mapbox.com/map-feedback/" target="_blank" rel="noopener noreferrer">Improve this map</a></strong>';

/**
 * Adds the shared Mapbox basemap to a Leaflet map.
 * Uses the 256-pixel tile endpoint so zoom levels behave exactly as they do today.
 * Falls back to OpenStreetMap tiles if no token has been filled in, so the site never goes blank.
 *
 * @param {L.Map} map     The Leaflet map instance.
 * @param {object} extra  Optional Leaflet tileLayer options (maxZoom, bounds, noWrap, attribution).
 * @returns {L.TileLayer}
 */
export function addBaseLayer(map, extra = {}) {
  const hasToken = MAPBOX_TOKEN && !MAPBOX_TOKEN.startsWith("PASTE_");

  if (!hasToken) {
    console.warn("map-config.js: no Mapbox token set, using OpenStreetMap tiles.");
    return L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap contributors",
      ...extra
    }).addTo(map);
  }

  return L.tileLayer(
    `https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/tiles/256/{z}/{x}/{y}{r}?access_token=${MAPBOX_TOKEN}`,
    {
      maxZoom: 20,
      attribution: ATTRIBUTION,
      ...extra
    }
  ).addTo(map);
}
