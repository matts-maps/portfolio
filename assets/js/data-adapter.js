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
// Parent projects (isParent: true) are included in loadProjects() like any
// other project: several now carry their own multi-country location lists
// (e.g. GIMAC), and that's real, deliberately-entered data that should be
// visible on the map/table, not just an artifact of the migration.

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
    country: loc?.country || "",
    countries: uniqueValues(locations.map((l) => l.country)),
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
  return projects.map((p) => toLegacyProject(p, projectById));
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
