# Data migration

Converts the legacy flat arrays into the linked structure from
[`claude/data-model-redesign-2026-09.md`](../../../claude/data-model-redesign-2026-09.md)
(check the project's Claude docs for that file - it's not duplicated into this repo).

```
assets/js/image-data.js                    ─┐
assets/js/projects-data.js                   ├─▶  locations.json
assets/js/webmaps-and-visualisations-data.js ─┘    projects.json
                                                    maps.json
```

## Run it

```
node scripts/migrate/migrate.mjs
```

Reads the three legacy files straight from `assets/js/` (via dynamic
`import()`, so it's always working from the real, current data - nothing is
hand-copied) and writes to `scripts/migrate/out/`:

- `locations.json` - the shared location catalog
- `projects.json` - one record per logical project, `locationIds[]` instead
  of a duplicate row per country
- `maps.json` - both static maps and webmap visualisations, each optionally
  linked to a project via `projectId`
- `migration-report.md` - everything worth a manual look before promoting
  this data (see below)

It's read-only with respect to the legacy files and safe to re-run any
number of times - output is deterministic. Pass `--out <path>` to write
somewhere else, e.g. straight into the live data folder once you're happy
with it:

```
node scripts/migrate/migrate.mjs --out ../../assets/data
```

## Then validate it

```
node scripts/migrate/validate.mjs
```

Checks referential integrity: every `locationId`/`projectId` reference
resolves, no duplicate ids, project nesting is at most one level, every
project and every standalone map has at least one location. Exits non-zero
on failure, so it's CI-ready - this is the "validation script" option
from the design doc's editing-tooling section, and it's worth keeping
around and running after every future manual edit too, not just after this
migration.

## Read the report

`migration-report.md` is generated fresh each run and is the actual
work list - it's specific to your data, not generic advice. As of this
first run it flags:

- **3 projects** that were stored as duplicate per-country rows, now one
  record each (biggest is the 8-country "Impact of Covid-19 visualisations"
  GIMAC project).
- **12 unresolved parent-project links** - a project's `parentProject` name
  didn't match any project's `name` exactly (some because the referenced
  parent project doesn't exist yet as its own entry in the data at all -
  e.g. the ASEAN-ERAT / AHA Centre umbrella, the E-PACC project, the Guyana
  & Saint Vincent schools project - those need a parent record created;
  others may just be a typo away from matching).
- **14 of 60 maps** auto-linked to a project with high confidence (exactly
  one project matched on year + shared location); the other 46 are
  standalone by default - some genuinely are, the rest need a manual link.
- **4 "likely the same project, split by a data mismatch"** cases - same
  name, same year, but a field differs just enough to block the automatic
  merge. One is a genuine data bug worth fixing at the source: the Iraq row
  of the GIMAC project has a stray malformed entry
  (`"United Nations High CommissionerRefugees (UNHCR)"`, missing a space
  and " for") in its `organisation` array in `projects-data.js` alongside
  the correctly-spelled one - fix that typo and re-run, and it'll merge
  into the other 8 countries automatically.
- A handful of **coordinate conflicts** (same place, different rows
  disagreeing on the exact point) and **country-name variants** merged
  (e.g. "Republic of Congo" / "Republic of the Congo").

None of this needs fixing before you can look at the output - the script
makes a defensible, safe choice for every ambiguous case (leave it
unlinked / unmerged rather than guess wrong) and tells you exactly where
that happened.

## What this does *not* do yet

- Doesn't touch `assets/js/*.js` or anything the live site renders from -
  the site keeps working exactly as it does today until you deliberately
  point its JS at the new files.
- Doesn't rewire `filter-engine.js` / `image-filter-engine.js` /
  `map-viewer.js` / `map-projects.js` to read `locationIds`/`projectId`
  instead of `country`/`continent` - that's a separate follow-up once the
  data itself looks right.
- Doesn't build the data-editor tool from the design doc - `migrate.mjs`
  is a one-shot conversion, not something you'd run to add a single new
  map afterwards.
