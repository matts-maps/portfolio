#!/usr/bin/env node
// scripts/migrate/validate.mjs
//
// Referential-integrity check for the migrated data. Not specific to the
// migration itself - this is the same check worth running in CI (or a
// pre-commit hook) once you're hand-editing projects.json/maps.json
// directly, per the design doc's "editing tooling" option 3.
//
// There's no locations.json/shared Location catalog to cross-reference any
// more (removed 3 September 2026, see the design doc's "Location data
// entry" section) - each Project/MapItem carries its own embedded
// locations[] array, so this checks that array's own shape instead of a
// reference into a separate file.
//
// Checks:
//   - every projectId referenced by a map exists in projects.json
//   - every project's parentId exists, and nesting is at most one level
//   - every project has at least one usable location entry (something more
//     than every field left blank)
//   - a standalone map (no projectId) has at least one usable location
//     entry of its own to inherit nothing from
//   - no duplicate ids within a file
//
// Exit code is non-zero if any check fails, so this is CI-friendly.
//
// Usage:
//   node scripts/migrate/validate.mjs                       # checks scripts/migrate/out/
//   node scripts/migrate/validate.mjs --dir ../../assets/data

import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const argDir = process.argv.includes("--dir")
  ? process.argv[process.argv.indexOf("--dir") + 1]
  : null;
const DIR = argDir ? path.resolve(__dirname, argDir) : path.join(__dirname, "out");

function readJson(name) {
  const p = path.join(DIR, name);
  if (!fs.existsSync(p)) {
    console.error(`Missing ${name} in ${DIR}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function checkDuplicateIds(records, fileName, errors) {
  const seen = new Set();
  for (const r of records) {
    if (seen.has(r.id)) errors.push(`${fileName}: duplicate id "${r.id}"`);
    seen.add(r.id);
  }
}

/** A location entry counts as usable once ANY field is set - a name, a
 * coordinate, or a precision (a migrated "we truly don't know where this
 * is" global-centroid placeholder has coordinates/precision but no
 * descriptive field, and should still count rather than fail validation).
 * Only an entry where literally everything is blank doesn't count -
 * matches the data-editor's own locationEntryIsUsable(). */
function usableLocations(entries) {
  return (entries || []).filter(
    (l) => l && (l.settlement || l.state || l.country || l.region || l.continent || l.precision || typeof l.lat === "number" || typeof l.lng === "number")
  );
}

function main() {
  const projects = readJson("projects.json");
  const maps = readJson("maps.json");

  const errors = [];
  const warnings = [];
  checkDuplicateIds(projects, "projects.json", errors);
  checkDuplicateIds(maps, "maps.json", errors);

  const projectIds = new Set(projects.map((p) => p.id));

  for (const p of projects) {
    const usable = usableLocations(p.locations);
    if (usable.length === 0) {
      errors.push(`projects.json: "${p.id}" has no locations`);
    }
    for (const l of usable) {
      if (typeof l.lat !== "number" || typeof l.lng !== "number") {
        warnings.push(`projects.json: "${p.id}" has a location with no lat/lng`);
      }
    }
    if (p.parentId) {
      if (!projectIds.has(p.parentId)) {
        errors.push(`projects.json: "${p.id}" references missing parent "${p.parentId}"`);
      } else {
        const parent = projects.find((x) => x.id === p.parentId);
        if (parent?.parentId) {
          errors.push(`projects.json: "${p.id}" -> "${parent.id}" -> "${parent.parentId}" nests more than one level deep`);
        }
      }
    }
  }

  for (const m of maps) {
    if (m.projectId && !projectIds.has(m.projectId)) {
      errors.push(`maps.json: "${m.id}" references missing project "${m.projectId}"`);
    }
    const usable = usableLocations(m.locations);
    if (!m.projectId && usable.length === 0) {
      errors.push(`maps.json: "${m.id}" is standalone (no projectId) but has no locations to inherit from`);
    }
    for (const l of usable) {
      if (typeof l.lat !== "number" || typeof l.lng !== "number") {
        warnings.push(`maps.json: "${m.id}" has a location with no lat/lng`);
      }
    }
  }

  if (errors.length === 0) {
    console.log(`OK - ${projects.length} projects, ${maps.length} maps, no referential-integrity issues.`);
    if (warnings.length > 0) {
      console.log(`${warnings.length} warning(s) (locations with no coordinates yet - not blocking):`);
      for (const w of warnings) console.log(`  - ${w}`);
    }
    process.exit(0);
  }

  console.error(`${errors.length} issue(s) found:\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

main();
