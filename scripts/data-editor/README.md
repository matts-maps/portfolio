# Data editor

A single offline HTML page for editing `assets/data/locations.json`, `projects.json`,
and `maps.json` without hand-editing JSON. This is "option 1" from the data model
redesign doc — nothing to install, nothing to host, nothing leaves your machine.

## Using it

Open `scripts/data-editor/index.html` directly in a browser (double-click it, or
drag it into a browser window).

**Chrome or Edge:** click **Open assets/data folder…** and select the `assets/data`
folder inside your checked-out repo. Editing and clicking **Save** writes straight
back to those three files — no download step, no manual file-moving.

**Any other browser:** click **Load JSON files…** and pick the three files
individually. **Save** downloads a single `fantail-data-export.zip` — unzip it and
move the three `.json` files into `assets/data/`, replacing the originals. (They're
bundled into one zip rather than three separate downloads because Chrome and other
browsers block a page from firing more than one automatic download per click without
an extra permission prompt — a zip sidesteps that entirely.)

## What it does

- Four tabs — Locations, Projects, Parent projects, Maps — each a searchable
  table. Click a row to edit, or **+ Add new**.
- **Parent projects** and **Projects** split the same underlying project data
  by whether anything currently links to it: a project shows in Parent
  projects once at least one other project picks it as a parent, and in
  Projects otherwise (that includes ordinary standalone projects and
  children of a parent alike — only the parents themselves move out).
  Parent projects has a **Children** column instead of Parent, so the
  handful of umbrella projects aren't lost among 60-odd ordinary ones.
  **+ Add new** there hides the Parent project field entirely — a new entry
  from this tab is always top-level by construction — but it stays in the
  Projects tab (it has no children yet) until you link a child to it: open
  that child (in either tab) and pick the new project from its own Parent
  project field. As soon as that link is made, the parent moves itself into
  the Parent projects tab automatically.
- Relation pickers for `Project.parentId`, `Project.locationIds`, `Map.projectId`,
  and `Map.locationIds` — search by name, not raw id. No more typing an id from
  memory or getting it wrong.
- Tag inputs for `themes`, `disaster`, `modality`, `organisation`, `level` — typing
  suggests values already in use elsewhere, so "Hurricane" vs "Cyclone" vs "Typhoon"
  stays a deliberate choice.
- A project with an unresolved `legacyParentName` (left over from the migration)
  shows a warning badge in the list and a banner in its edit form, with a button to
  clear the reference once you've either picked a real parent or decided it doesn't
  need one.
- **Check for issues** runs the same checks as `scripts/migrate/validate.mjs` — every
  `locationId`/`projectId` reference resolves, every project has at least one
  location, parent nesting is at most one level, no duplicate ids. **Save** refuses
  to write while there are hard errors (shown in the issues panel); warnings (like an
  unresolved parent name) don't block saving.
- Saved JSON uses a fixed key order per entity, so future diffs stay clean and
  focused on what actually changed rather than reordered keys.

## Known limitations

- The folder handle isn't remembered between page loads (no IndexedDB persistence
  yet) — you re-pick the folder each time you open the page in Chrome/Edge. Minor
  friction, not a correctness issue.
- No visual "where is this on the map" preview when setting lat/lng — you're
  entering coordinates by hand (or copying them from somewhere else), same as
  today.
- It edits three files as one unit but doesn't itself run `git` — commit and push
  your changes the normal way once you're happy with them.

## Testing

`test.mjs` is a Playwright smoke test that exercises the fallback (file-input +
zip-download) path end to end against real fixture data in `test-fixtures/`
(a snapshot of the actual `assets/data/*.json` at the time this was built) —
load, search, edit a project's locations, add/delete a location, edit a webmap's
links, save, and confirm an invalid save (a project with zero locations) is
blocked with the right error. Run it with:

```
npm install playwright   # if not already available
node test.mjs
```

It's a development aid, not something that needs to run in CI — there's no CI
for this repo's JS beyond `scripts/migrate/validate.mjs`, which is the one worth
wiring into a pre-commit hook or GitHub Action if you want that (see the data
model redesign doc's "editing tooling" section).
