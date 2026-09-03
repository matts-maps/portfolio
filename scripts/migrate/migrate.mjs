#!/usr/bin/env node
// scripts/migrate/migrate.mjs
//
// One-way migration from the legacy flat arrays (assets/js/image-data.js,
// assets/js/projects-data.js, assets/js/webmaps-and-visualisations-data.js)
// into the normalised, linked structure described in
// claude/data-model-redesign-2026-09.md:
//
//   assets/data/locations.json   - the shared Location catalog
//   assets/data/projects.json    - Project records, locationIds[] instead
//                                   of one duplicate row per country
//   assets/data/maps.json        - MapItem records (both static maps and
//                                   webmap visualisations), with an
//                                   optional projectId link
//
// This script is READ-ONLY with respect to the legacy files - it does not
// touch image-data.js, projects-data.js or webmaps-and-visualisations-data.js,
// and it does not change anything the live site currently renders from.
// It writes its output to scripts/migrate/out/ by default so you can review
// before promoting anything into assets/data/. Nothing here rewires the
// site's own JS to read the new files - that's a separate follow-up once
// you're happy with the migrated data.
//
// Usage:
//   node scripts/migrate/migrate.mjs
//   node scripts/migrate/migrate.mjs --out ../../assets/data   # write straight into assets/data
//
// Output is deterministic: running it again produces the same ids, so it's
// safe to re-run after editing the legacy source files.

import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

import { cleanStr, toArray, slugify, uniqueSlug, parseYear, stableKey } from "./lib/text.mjs";
import { LocationCatalog } from "./lib/locations.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");

const argOut = process.argv.includes("--out")
  ? process.argv[process.argv.indexOf("--out") + 1]
  : null;
const OUT_DIR = argOut ? path.resolve(__dirname, argOut) : path.join(__dirname, "out");

async function main() {
  const { images } = await import(path.join(REPO_ROOT, "assets/js/image-data.js"));
  const { projects } = await import(path.join(REPO_ROOT, "assets/js/projects-data.js"));
  const { visualizationProjects } = await import(
    path.join(REPO_ROOT, "assets/js/webmaps-and-visualisations-data.js")
  );

  const catalog = new LocationCatalog();
  const flags = []; // ambiguous/missing-location cases, collected as we go

  const mergedProjects = buildProjects(projects, catalog, flags);
  const maps = buildMaps({ images, visualizationProjects, catalog, flags, mergedProjects });

  const locations = catalog.toArray();

  fs.mkdirSync(OUT_DIR, { recursive: true });
  writeJson(path.join(OUT_DIR, "locations.json"), locations);
  writeJson(
    path.join(OUT_DIR, "projects.json"),
    mergedProjects.map(({ _mergeKey, ...p }) => p) // strip internal bookkeeping field
  );
  writeJson(path.join(OUT_DIR, "maps.json"), maps);

  const report = buildReport({
    images,
    projects,
    visualizationProjects,
    mergedProjects,
    maps,
    locations,
    catalog,
    flags,
  });
  fs.writeFileSync(path.join(OUT_DIR, "migration-report.md"), report, "utf8");

  console.log(`Wrote ${locations.length} locations, ${mergedProjects.length} projects, ${maps.length} maps to ${path.relative(REPO_ROOT, OUT_DIR)}/`);
  console.log(`See ${path.relative(REPO_ROOT, path.join(OUT_DIR, "migration-report.md"))} for what needs a manual look.`);
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

// ---------------------------------------------------------------------------
// Projects: collapse the "one duplicate row per country" pattern into one
// record per logical project, with a locationIds[] array.
// ---------------------------------------------------------------------------

// Fields that legitimately vary between rows that are really the SAME
// project split across countries (the GIMAC pattern). Excluded from the
// row-grouping key. Note `continent` is excluded too - a single multi-
// country project can genuinely span continents (e.g. GIMAC: Africa,
// the Middle East and Asia in one project), so it can't be part of what
// makes two rows "the same project".
const LOCATION_FIELDS = new Set(["country", "location", "lat", "lng", "continent"]);

function buildProjects(rawProjects, catalog, flags) {
  const groups = new Map(); // mergeKey -> { rows: [...] }

  for (const row of rawProjects) {
    const rest = {};
    for (const [k, v] of Object.entries(row)) {
      if (!LOCATION_FIELDS.has(k)) rest[k] = v;
    }
    const key = stableKey(rest);
    if (!groups.has(key)) groups.set(key, { key, rows: [] });
    groups.get(key).rows.push(row);
  }

  const usedSlugs = new Set();
  const merged = [];

  for (const { key, rows } of groups.values()) {
    const first = rows[0];
    const name = cleanStr(first.name);

    const locationIds = [];
    for (const row of rows) {
      const sourceLabel = `project "${name}" (${cleanStr(row.country) || cleanStr(row.location) || "no country"})`;
      for (const id of catalog.resolve(row, { sourceLabel, flags })) {
        if (!locationIds.includes(id)) locationIds.push(id);
      }
    }

    const year = parseYear(first.year);
    const baseSlug = slugify(name) || "project";
    // Disambiguate recurring projects that legitimately share a name
    // (e.g. a twice-yearly training course) by year, then by counter.
    const slug = uniqueSlug(year ? `${baseSlug}-${year}` : baseSlug, usedSlugs);

    merged.push({
      _mergeKey: key,
      id: slug,
      name,
      parentId: null, // resolved in the second pass below
      legacyParentName: cleanStr(first.parentProject) || null,
      locationIds,
      year,
      month: cleanStr(first.month) || null,
      type: cleanStr(first.type) || null,
      modality: toArray(first.modality),
      organisation: toArray(first.organisation),
      level: toArray(first.level),
      themes: toArray(first.themes),
      disaster: toArray(first.disaster),
      status: cleanStr(first.status) || null,
      startDate: cleanStr(first.startDate) || null,
      endDate: cleanStr(first.endDate) || null,
      description: cleanStr(first.description) || cleanStr(first.parentProjectDescription) || null,
      sourceRowCount: rows.length,
    });
  }

  // Second pass: resolve parentProject name strings -> parentId, and
  // clear legacyParentName once resolved (it's only kept around when the
  // link couldn't be made automatically, as a hint for a manual fix).
  const byName = new Map();
  for (const p of merged) {
    if (!byName.has(p.name)) byName.set(p.name, []);
    byName.get(p.name).push(p);
  }

  for (const p of merged) {
    if (!p.legacyParentName) continue;
    if (p.legacyParentName === p.name) {
      // A project listing itself as its own parent - a copy/paste leftover
      // in the source data, not a real hierarchy. Drop it rather than
      // create a self-referencing project.
      flags.push({
        type: "self_referencing_parent",
        message: `"${p.name}" lists itself as its own parentProject - dropped, not linked`,
        fromRecord: `project "${p.name}"`,
      });
      p.legacyParentName = null;
      continue;
    }
    const candidates = byName.get(p.legacyParentName);
    if (candidates && candidates.length === 1) {
      p.parentId = candidates[0].id;
      p.legacyParentName = null;
    } else if (candidates && candidates.length > 1) {
      flags.push({
        type: "ambiguous_parent_name",
        message: `"${p.legacyParentName}" matches ${candidates.length} projects with that name - left unresolved on "${p.name}"`,
        fromRecord: `project "${p.name}"`,
      });
    }
    // else: no project with that name exists in the data at all - stays
    // as legacyParentName for a human to either create the parent or
    // clear the reference. Reported in migration-report.md.
  }

  // Flag any accidental nesting deeper than one level.
  const parentOf = new Map(merged.map((p) => [p.id, p.parentId]));
  for (const p of merged) {
    if (p.parentId && parentOf.get(p.parentId)) {
      flags.push({
        type: "nesting_too_deep",
        message: `"${p.name}" -> parent -> grandparent: only one level is supported by the design`,
        fromRecord: `project "${p.name}"`,
      });
    }
  }

  // Two rows with the same `name` but a different merge key are almost
  // always the SAME logical project, split apart because one row has a
  // typo or a stray extra entry somewhere (an extra org, a slightly
  // different description...). Row-grouping alone can't tell that apart
  // from two genuinely different projects that happen to share a name, so
  // it's surfaced here with a field-level diff rather than silently
  // merged or silently left split.
  const DIFF_FIELDS = [
    "type",
    "modality",
    "organisation",
    "level",
    "themes",
    "disaster",
    "status",
    "startDate",
    "endDate",
    "month",
    "description",
    "legacyParentName",
  ];
  for (const [name, group] of byName) {
    if (group.length < 2) continue;
    // Group further by year: same name + same year + near-identical
    // fields is almost certainly one project split by a data-entry slip.
    // Same name + DIFFERENT year is much more likely a genuinely recurring
    // project (an annual exercise, a twice-yearly course) - worth noting,
    // but not flagged as a probable bug.
    const byYear = new Map();
    for (const p of group) {
      const k = p.year ?? "unknown";
      if (!byYear.has(k)) byYear.set(k, []);
      byYear.get(k).push(p);
    }

    for (const [year, sameYearGroup] of byYear) {
      if (sameYearGroup.length < 2) continue;
      const [a, ...rest] = sameYearGroup;
      const b = rest[0];
      const diffs = DIFF_FIELDS.filter((f) => stableKey({ v: a[f] }) !== stableKey({ v: b[f] }));
      flags.push({
        type: "likely_same_project_split",
        message: `"${name}" (${year}) appears as ${sameYearGroup.length} separate projects (${sameYearGroup
          .map((g) => g.id)
          .join(", ")}) - differing field(s): ${diffs.join(", ") || "(none obvious - check locations)"}`,
        fromRecord: `project "${name}"`,
      });
    }

    if (byYear.size > 1) {
      flags.push({
        type: "recurring_project_name",
        message: `"${name}" appears in ${byYear.size} different years (${[...byYear.keys()].join(", ")}) - likely a genuinely recurring project, not a data bug, but worth a glance.`,
        fromRecord: `project "${name}"`,
      });
    }
  }

  return merged;
}

// ---------------------------------------------------------------------------
// Maps: images[] + visualizationProjects[] -> one MapItem shape, with a
// best-effort (and clearly-flagged) attempt to link each one to a project.
// ---------------------------------------------------------------------------

function buildMaps({ images, visualizationProjects, catalog, flags, mergedProjects }) {
  const usedSlugs = new Set();
  const maps = [];

  for (const row of images) {
    maps.push(buildOneMap(row, { kind: "map", catalog, flags, usedSlugs, mergedProjects }));
  }
  for (const row of visualizationProjects) {
    maps.push(buildOneMap(row, { kind: "webmap", catalog, flags, usedSlugs, mergedProjects }));
  }
  return maps;
}

function idFromFile(file) {
  const base = path.basename(cleanStr(file));
  return slugify(base.replace(/\.[a-z0-9]+$/i, ""));
}

function buildOneMap(row, { kind, catalog, flags, usedSlugs, mergedProjects }) {
  const name = cleanStr(row.name);

  let baseId;
  if (kind === "map" && row.file) {
    baseId = idFromFile(row.file);
  } else if (name) {
    baseId = slugify(name);
  } else if (row.screenshot) {
    baseId = idFromFile(row.screenshot);
  } else if (Array.isArray(row.links) && row.links[0]?.label) {
    baseId = slugify(row.links[0].label);
  } else {
    const bits = [kind, ...toArray(row.disaster), ...toArray(row.country), row.year].filter(Boolean);
    baseId = slugify(bits.join("-")) || `untitled-${kind}`;
  }
  const id = uniqueSlug(baseId, usedSlugs);

  const sourceLabel = `${kind} "${name || id}"`;
  const locationIds = catalog.resolve(row, { sourceLabel, flags });

  const map = {
    id,
    kind, // "map" | "webmap"
    name: name || null,
    file: kind === "map" ? cleanStr(row.file) || null : null,
    projectId: null,
    locationIds,
    year: parseYear(row.year),
    month: parseYear(row.month) ?? (cleanStr(row.month) || null),
    themes: toArray(row.themes),
    disaster: toArray(row.disaster),
    description: cleanStr(row.description) || null,
  };

  if (kind === "map") {
    map.map_style = cleanStr(row.map_style) || null;
    map.data_sources = Array.isArray(row.data_sources) ? row.data_sources : [];
  } else {
    map.screenshot = cleanStr(row.screenshot) || null;
    map.links = Array.isArray(row.links) ? row.links : [];
    map.embeddable = row.embeddable !== false; // legacy default is "true" unless explicitly false
  }

  // Best-effort project link: candidates must match on year AND share at
  // least one location. Only auto-link when exactly one candidate matches -
  // otherwise leave it for manual confirmation (see the report).
  if (map.year) {
    const candidates = mergedProjects.filter(
      (p) => p.year === map.year && p.locationIds.some((l) => locationIds.includes(l))
    );
    if (candidates.length === 1) {
      map.projectId = candidates[0].id;
      // Per the design doc, a map inherits its project's location(s) by
      // default - so once we're confident of the link, drop the map's own
      // copy rather than duplicating it.
      map.locationIds = [];
    } else if (candidates.length > 1) {
      flags.push({
        type: "ambiguous_project_match",
        message: `${candidates.length} candidate projects (${candidates.map((c) => c.id).join(", ")}) match on year + location`,
        fromRecord: sourceLabel,
      });
    }
  }

  return map;
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function buildReport({
  images,
  projects,
  visualizationProjects,
  mergedProjects,
  maps,
  locations,
  catalog,
  flags,
}) {
  const lines = [];
  const push = (s = "") => lines.push(s);

  push(`# Migration report`);
  push();
  push(`Generated by \`scripts/migrate/migrate.mjs\`. Nothing in this run touched the legacy`);
  push(`\`assets/js/*.js\` files - this is a read of them, not a write.`);
  push();
  push(`## Counts`);
  push();
  push(`| | before | after |`);
  push(`|---|---|---|`);
  push(`| Project rows | ${projects.length} | ${mergedProjects.length} projects |`);
  push(`| Map/image rows | ${images.length} | |`);
  push(`| Webmap/viz rows | ${visualizationProjects.length} | |`);
  push(`| Maps total | | ${maps.length} |`);
  push(`| Locations | | ${locations.length} |`);
  push();

  const collapsedGroups = mergedProjects.filter((p) => p.sourceRowCount > 1);
  push(`## Projects collapsed from duplicate rows`);
  push();
  if (collapsedGroups.length === 0) {
    push(`None found.`);
  } else {
    push(`${collapsedGroups.length} project(s) were previously stored as multiple duplicate rows (one per country) and are now a single record with a \`locationIds\` array:`);
    push();
    for (const p of collapsedGroups) {
      push(`- **${p.name}** (\`${p.id}\`): ${p.sourceRowCount} rows -> 1 project, ${p.locationIds.length} locations`);
    }
  }
  push();

  const unresolvedParents = mergedProjects.filter((p) => p.legacyParentName);
  push(`## Parent projects that couldn't be auto-linked`);
  push();
  if (unresolvedParents.length === 0) {
    push(`None - every non-empty \`parentProject\` string matched exactly one project.`);
  } else {
    push(`These had a \`parentProject\` name that didn't match any project's \`name\` exactly. Either the parent project doesn't exist in the data, or the name doesn't match verbatim - check for typos, then either create the parent or set \`parentId\` by hand:`);
    push();
    for (const p of unresolvedParents) {
      push(`- **${p.name}** (\`${p.id}\`) references parent "${p.legacyParentName}"`);
    }
  }
  push();

  const linkedMaps = maps.filter((m) => m.projectId);
  push(`## Map -> project links`);
  push();
  push(`${linkedMaps.length} of ${maps.length} maps were auto-linked to a project (exactly one candidate matched on year + shared location).`);
  push(`The rest (${maps.length - linkedMaps.length}) are standalone (\`projectId: null\`) - some genuinely are standalone, others just didn't have a confident match. See "Ambiguous project matches" below for the ones with more than one candidate.`);
  push();

  const byType = {};
  for (const f of flags) {
    (byType[f.type] ??= []).push(f);
  }

  const sections = [
    ["self_referencing_parent", "Projects listing themselves as their own parent", "A copy/paste leftover in the source data (parentProject equals the project's own name) - dropped rather than creating a self-referencing project. Set the real parent (or clear the field at the source) by hand."],
    ["likely_same_project_split", "Likely the same project, split by a data mismatch", "Same name AND same year, but a field differs between rows just enough that they weren't merged - usually a typo in the source data (an extra/misspelled entry in an array field). Worth fixing at the source and re-running, or merging by hand in the output."],
    ["recurring_project_name", "Recurring projects sharing a name", "Same name, different years - almost certainly a genuinely repeated project (an annual exercise, a recurring course), not a bug. Informational only."],
    ["ambiguous_project_match", "Ambiguous project matches", "More than one project matched on year + location - pick the right one by hand and set `projectId` on the map."],
    ["ambiguous_parent_name", "Ambiguous parent-project names", "More than one project shares the `parentProject` name referenced - resolve which one is meant."],
    ["nesting_too_deep", "Nesting deeper than one level", "The design only supports one parent level; these have a grandparent."],
    ["ambiguous_site_country", "Sites with an unclear country", "A specific place name was attached to zero or multiple countries."],
    ["no_usable_location", "Records with no location info at all", "Fell back to a generic \"Global\" placeholder - needs a real location."],
  ];

  for (const [key, title, blurb] of sections) {
    const items = byType[key] || [];
    push(`## ${title}`);
    push();
    push(blurb);
    push();
    if (items.length === 0) {
      push(`None found.`);
    } else {
      for (const item of items) {
        push(`- ${item.fromRecord}: ${item.message}`);
      }
    }
    push();
  }

  push(`## Country name variants merged`);
  push();
  push(`These raw \`country\` values were treated as the same place (see \`lib/countries.mjs\` to add more):`);
  push();
  push("- \"Republic of Congo\" -> \"Republic of the Congo\"");
  push("- \"St Vincent and the Grenadines\" -> \"Saint Vincent and the Grenadines\"");
  push();
  push(`Left deliberately separate (worth a manual look, not auto-merged): "Gaza" and "oPT" refer to overlapping but not identical areas.`);
  push();

  push(`## Non-country values stripped from a \`country\` field`);
  push();
  if (catalog.nonCountryValuesStripped.length === 0) {
    push(`None found.`);
  } else {
    for (const item of catalog.nonCountryValuesStripped) {
      push(`- "${item.value}" on ${item.fromRecord} - not a real single country, fell back to region/global instead.`);
    }
  }
  push();

  push(`## Coordinate conflicts`);
  push();
  push(`Same place, meaningfully different coordinates seen on different rows (first-seen coordinate wins in the output):`);
  push();
  if (catalog.coordinateConflicts.length === 0) {
    push(`None found.`);
  } else {
    for (const c of catalog.coordinateConflicts) {
      push(
        `- **${c.locationId}**: kept (${c.existing.lat}, ${c.existing.lng}), ` +
          `also saw (${c.conflicting.lat}, ${c.conflicting.lng}) from ${c.fromRecord}`
      );
    }
  }
  push();

  push(`## Not yet done`);
  push();
  push(`- The site's JS (filter engines, map-viewer.js, map-projects.js, image-lightbox.js) still reads the legacy \`assets/js/*.js\` files - this migration doesn't rewire anything live.`);
  push(`- Output was written to \`scripts/migrate/out/\` for review, not \`assets/data/\` - copy it over once you're happy with it (or re-run with \`--out ../../assets/data\`).`);
  push(`- The data-editor tool from the design doc (option 1) isn't built yet.`);

  return lines.join("\n") + "\n";
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
