// Bridges the normalized data schema (assets/data/projects.json, maps.json,
// organisations.json) back to the flat shapes that map-projects.js,
// image-map.js, image-lightbox.js, map-viewer.js and the webmaps layout were
// built around, so those consumers can switch data sources without any
// internal changes. Each record also carries its full `locations` array (and
// derived `countries`/`continents` on projects) so renderers that have been
// upgraded to plot every location a record has can do so; `country`/`lat`/
// `lng` stay as a single-value fallback (first usable location) for anything
// that hasn't been upgraded yet.
//
// Parent projects (isParent: true) are umbrella/programme records used to
// group their children in the data-editor — they aren't themselves real,
// individually-delivered work, so loadProjects() excludes them: the
// Projects page's map and table should list the actual (child) projects,
// not the umbrella row above them. A child still shows its parent's name
// via `parentProject` (the "Part of" note in the detail panel), so the
// grouping isn't lost, just not rendered as its own row/pin.

const DATA_BASE = new URL("../data/", import.meta.url);

function fetchJson(name) {
  return fetch(new URL(name, DATA_BASE)).then((res) => {
    if (!res.ok) throw new Error(`data-adapter: failed to load ${name} (${res.status})`);
    return res.json();
  });
}

let rawProjectsPromise = null;
let rawMapsPromise = null;
let rawOrganisationsPromise = null;

// Raw (normalized-schema) loaders, exposed for future work that reads the
// new shape directly instead of going through the legacy adapters below.
export function loadRawProjects() {
  if (!rawProjectsPromise) rawProjectsPromise = fetchJson("projects.json");
  return rawProjectsPromise;
}

export function loadRawMaps() {
  if (!rawMapsPromise) rawMapsPromise = fetchJson("maps.json");
  return rawMapsPromise;
}

export function loadRawOrganisations() {
  if (!rawOrganisationsPromise) rawOrganisationsPromise = fetchJson("organisations.json");
  return rawOrganisationsPromise;
}

// A location entry with no resolved coordinate (a placeholder left blank, or
// still awaiting geocoding) isn't plottable — drop it rather than pass a
// null/NaN lat/lng down to Leaflet.
function usableLocations(locations) {
  return (locations || []).filter((l) => l && Number.isFinite(l.lat) && Number.isFinite(l.lng));
}

function uniqueValues(values) {
  return [...new Set(values.filter((v) => v != null && v !== ""))];
}

// A few countries' common English name conventionally takes a "the" article
// (e.g. "The Bahamas", "The Philippines") even though the location data
// stores the plain ISO-style name. Add more entries here as needed — this is
// the one place display names are corrected before reaching any table,
// panel, or filter dropdown.
const COUNTRY_DISPLAY_NAMES = {
  "Bahamas": "The Bahamas",
  "Philippines": "The Philippines",
};

function displayCountry(country) {
  return COUNTRY_DISPLAY_NAMES[country] || country;
}

// Alphabetical sort key for a country's display name: strips a leading
// "The " so e.g. "The Bahamas" sorts next to "Bangladesh" (under B) and
// "The Philippines" sorts next to "Peru"/"Portugal" (under P), rather than
// both falling under "T" alongside "Thailand".
function countrySortKey(name) {
  return name.replace(/^The\s+/i, "");
}

// Multi-country projects should list their countries alphabetically rather
// than in whatever order the locations happened to be entered.
function displayCountries(locations) {
  return uniqueValues(locations.map((l) => displayCountry(l.country)))
    .sort((a, b) => countrySortKey(a).localeCompare(countrySortKey(b)));
}

// A map/webmap with no usable location of its own inherits its linked
// project's locations, per the schema's documented "empty locations[] means
// inherit the project" convention.
function resolveLocations(record, projectById) {
  const own = usableLocations(record.locations);
  if (own.length) return own;
  const project = record.projectId ? projectById.get(record.projectId) : null;
  return usableLocations(project?.locations);
}

function toLegacyProject(p, projectById) {
  const locations = usableLocations(p.locations);
  const loc = locations[0] || null;
  const parent = p.parentId ? projectById.get(p.parentId) : null;
  return {
    name: p.name || "",
    continent: loc?.continent || "",
    country: displayCountry(loc?.country || ""),
    countries: displayCountries(locations),
    continents: uniqueValues(locations.map((l) => l.continent)),
    locations,
    location: loc?.settlement || "",
    year: p.year != null ? String(p.year) : "",
    month: p.month || "",
    themes: p.themes || [],
    disaster: p.disaster || [],
    lat: loc?.lat ?? null,
    lng: loc?.lng ?? null,
    description: p.description || "",
    type: p.type || "",
    modality: p.modality || [],
    organisation: p.organisation || [],
    level: p.level || [],
    startDate: p.startDate || "",
    endDate: p.endDate || "",
    status: p.status || "",
    // Old data never had a real "parent" row: parentProject/
    // parentProjectDescription were just a name+text pair repeated on every
    // child row. Reproduce that by pulling the linked parent record's own
    // name/description; legacyParentName covers rows the migration couldn't
    // resolve to a parentId.
    parentProject: parent ? parent.name || "" : p.legacyParentName || "",
    parentProjectDescription: parent?.description || "",
  };
}

// Legacy `projects-data.js` shape (plus `locations`/`countries`/`continents`)
// — for map-projects.js.
export async function loadProjects() {
  const projects = await loadRawProjects();
  const projectById = new Map(projects.map((p) => [p.id, p]));
  return projects
    .filter((p) => !p.isParent)
    .map((p) => toLegacyProject(p, projectById));
}

function toLegacyImage(m, locations) {
  const loc = locations[0] || null;
  return {
    file: m.file || "",
    name: m.name || "",
    continent: loc?.continent || "",
    country: uniqueValues(locations.map((l) => l.country)),
    locations,
    location: loc?.settlement || "",
    year: m.year ?? "",
    month: m.month ?? "",
    // image-map.js/map-viewer.js check `!== undefined`, not `== null`, so a
    // genuinely missing coordinate must stay `undefined`, not `null`.
    lat: Number.isFinite(loc?.lat) ? loc.lat : undefined,
    lng: Number.isFinite(loc?.lng) ? loc.lng : undefined,
    themes: m.themes || [],
    disaster: m.disaster || [],
    description: m.description || "",
    map_style: m.map_style || "",
    data_sources: m.data_sources || [],
  };
}

// Legacy `image-data.js` shape (kind: "map") — for image-map.js, map-viewer.js.
export async function loadImages() {
  const [maps, projects] = await Promise.all([loadRawMaps(), loadRawProjects()]);
  const projectById = new Map(projects.map((p) => [p.id, p]));
  return maps
    .filter((m) => m.kind === "map")
    .map((m) => toLegacyImage(m, resolveLocations(m, projectById)));
}

function toLegacyWebmap(m, locations) {
  const loc = locations[0] || null;
  return {
    name: m.name || "",
    continent: loc?.continent || "",
    country: uniqueValues(locations.map((l) => l.country)),
    locations,
    location: loc?.settlement || "",
    year: m.year ?? "",
    month: m.month ?? "",
    lat: loc?.lat ?? null,
    lng: loc?.lng ?? null,
    themes: m.themes || [],
    // NOTE: the normalized schema always stores this as an array; the old
    // webmaps-and-visualisations-data.js stored a single string. The
    // webmaps-and-visualisations.html inline script was updated to handle
    // the array in Phase 2.
    disaster: m.disaster || [],
    description: m.description || "",
    screenshot: m.screenshot || "",
    embeddable: m.embeddable,
    links: m.links || [],
  };
}

// Legacy `webmaps-and-visualisations-data.js` shape (kind: "webmap") — for
// the webmaps-and-visualisations layout's inline script. No current record
// has more than one location, so that layout still only plots `lat`/`lng`
// (the first one) — `locations` is exposed here for when one does.
export async function loadWebmaps() {
  const [maps, projects] = await Promise.all([loadRawMaps(), loadRawProjects()]);
  const projectById = new Map(projects.map((p) => [p.id, p]));
  return maps
    .filter((m) => m.kind === "webmap")
    .map((m) => toLegacyWebmap(m, resolveLocations(m, projectById)));
}
