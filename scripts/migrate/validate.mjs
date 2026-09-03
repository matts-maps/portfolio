#!/usr/bin/env node
// scripts/migrate/validate.mjs
//
// Referential-integrity check for the migrated data. Not specific to the
// migration itself - this is the same check worth running in CI (or a
// pre-commit hook) once you're hand-editing locations.json/projects.json/
// maps.json directly, per the design doc's "editing tooling" option 3.
//
// Checks:
//   - every locationId referenced by a project or map exists in locations.json
//   - every projectId referenced by a map exists in projects.json
//   - every project's parentId exists, and nesting is at most one level
//   - every project has at least one locationId
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

function main() {
  const locations = readJson("locations.json");
  const projects = readJson("projects.json");
  const maps = readJson("maps.json");

  const errors = [];
  checkDuplicateIds(locations, "locations.json", errors);
  checkDuplicateIds(projects, "projects.json", errors);
  checkDuplicateIds(maps, "maps.json", errors);

  const locationIds = new Set(locations.map((l) => l.id));
  const projectIds = new Set(projects.map((p) => p.id));

  for (const p of projects) {
    if (!p.locationIds || p.locationIds.length === 0) {
      errors.push(`projects.json: "${p.id}" has no locationIds`);
    }
    for (const lid of p.locationIds || []) {
      if (!locationIds.has(lid)) {
        errors.push(`projects.json: "${p.id}" references missing location "${lid}"`);
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
    if (!m.projectId && (!m.locationIds || m.locationIds.length === 0)) {
      errors.push(`maps.json: "${m.id}" is standalone (no projectId) but has no locationIds to inherit from`);
    }
    for (const lid of m.locationIds || []) {
      if (!locationIds.has(lid)) {
        errors.push(`maps.json: "${m.id}" references missing location "${lid}"`);
      }
    }
  }

  if (errors.length === 0) {
    console.log(`OK - ${locations.length} locations, ${projects.length} projects, ${maps.length} maps, no referential-integrity issues.`);
    process.exit(0);
  }

  console.error(`${errors.length} issue(s) found:\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

main();
