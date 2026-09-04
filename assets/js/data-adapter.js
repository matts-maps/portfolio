// Bridges the normalized data schema (assets/data/projects.json, maps.json,
// organisations.json) back to the flat shapes that map-projects.js,
// image-map.js, image-lightbox.js, map-viewer.js and the webmaps layout were
// built around, so those consumers can switch data sources without any
// internal changes. A project/map with more than one location is flattened
// down to its first location only, mirroring the old per-country-duplicated
// rows — a later phase can drop that flattening once the renderers are
// upgraded to plot every location a record has.
//
// Parent projects (isParent: true) are excluded from loadProjects(): the old
// data never had a standalone row for a parent grouping, just a
// parentProject/parentProjectDescription pair repeated on each child row, so
// including them here would add markers/table rows that didn't exist before.

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

function firstLocation(locations) {
  return (locations && locations[0]) || null;
}

// A map/webmap with no location of its own inherits its linked project's
// first location, per the schema's documented "empty locations[] means
// inherit the project" convention.
function resolveLocation(record, projectById) {
  const own = firstLocation(record.locations);
  if (own) return own;
  const project = record.projectId ? projectById.get(record.projectId) : null;
  return firstLocation(project?.locations);
}

function toLegacyProject(p, projectById) {
  const loc = firstLocation(p.locations);
  const parent = p.parentId ? projectById.get(p.parentId) : null;
  return {
    name: p.name || "",
    continent: loc?.continent || "",
    country: loc?.country || "",
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

// Legacy `projects-data.js` shape — for map-projects.js.
export async function loadProjects() {
  const projects = await loadRawProjects();
  const projectById = new Map(projects.map((p) => [p.id, p]));
  return projects.filter((p) => !p.isParent).map((p) => toLegacyProject(p, projectById));
}

function toLegacyImage(m, loc) {
  return {
    file: m.file || "",
    name: m.name || "",
    continent: loc?.continent || "",
    country: loc?.country ? [loc.country] : [],
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
    .map((m) => toLegacyImage(m, resolveLocation(m, projectById)));
}

function toLegacyWebmap(m, loc) {
  return {
    name: m.name || "",
    continent: loc?.continent || "",
    country: loc?.country ? [loc.country] : [],
    location: loc?.settlement || "",
    year: m.year ?? "",
    month: m.month ?? "",
    lat: loc?.lat ?? null,
    lng: loc?.lng ?? null,
    themes: m.themes || [],
    // NOTE: the normalized schema always stores this as an array; the old
    // webmaps-and-visualisations-data.js stored a single string and the
    // webmaps-and-visualisations.html inline script still does
    // `project.disaster.trim()` — that call site needs updating to handle an
    // array before this feed is wired in (tracked as a Phase 2 follow-up).
    disaster: m.disaster || [],
    description: m.description || "",
    screenshot: m.screenshot || "",
    embeddable: m.embeddable,
    links: m.links || [],
  };
}

// Legacy `webmaps-and-visualisations-data.js` shape (kind: "webmap") — for
// the webmaps-and-visualisations layout's inline script.
export async function loadWebmaps() {
  const [maps, projects] = await Promise.all([loadRawMaps(), loadRawProjects()]);
  const projectById = new Map(projects.map((p) => [p.id, p]));
  return maps
    .filter((m) => m.kind === "webmap")
    .map((m) => toLegacyWebmap(m, resolveLocation(m, projectById)));
}
