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

- Five tabs — Locations, Projects, Parent projects, Maps, Organisations — each
  a searchable table. Click a row to edit, or **+ Add new**.
- **Parent projects** and **Projects** split the same underlying project data
  by an explicit flag (`isParent`), not by whether anything happens to be
  linked to it yet. A project becomes a parent project the moment it's added
  via **+ Add new** in the Parent projects tab — it shows there immediately,
  before any child is linked, and never shows in the Projects tab at all.
  Projects shows everything else: ordinary standalone projects and children
  of a parent alike. Parent projects has a **Children** column instead of
  Parent, so the handful of umbrella projects aren't lost among 60-odd
  ordinary ones. **+ Add new** there also hides the Parent project field
  entirely — a parent project is always top-level and can never have a
  parent of its own. To link a child to one: open the child (in the Projects
  tab) and pick it from that project's own Parent project field — the picker
  there only offers projects that were added via the Parent projects tab, so
  there's no way to accidentally point at an ordinary project.
- Relation pickers for `Project.parentId`, `Project.locationIds`, `Map.projectId`,
  and `Map.locationIds` — search by name, not raw id. No more typing an id from
  memory or getting it wrong.
- Tag inputs for `themes`, `disaster`, `modality`, `organisation`, `level` — typing
  suggests values already in use elsewhere, so "Hurricane" vs "Cyclone" vs "Typhoon"
  stays a deliberate choice.
- **Organisations** isn't a stored entity — `Project.organisation` is just a tag
  field like the others above — so this tab is a derived view: every distinct
  value in use, how many projects use it, and which ones. It exists to clean up
  the drift a free-text field invites. Renaming one in its edit form updates
  every project that has it; if you rename it to a value that's already in use
  elsewhere, the two merge — the projects that already had the target name are
  left alone, so nothing gets silently dropped. **+ Add new** requires picking
  at least one project up front (an organisation attached to nothing has
  nowhere to be saved) and is purely additive — it only ever adds the tag to
  the projects you pick, never removes it from anyone. **Delete** removes the
  value from every project that has it; the projects themselves aren't touched.
- A project with an unresolved `legacyParentName` (left over from the migration)
  shows a warning badge in the list and a banner in its edit form, with a button to
  clear the reference once you've either picked a real parent or decided it doesn't
  need one.
- A Location's **Country** and **Continent** fields autocomplete against a
  reference list (249 countries/territories with ISO3 + capital; the 7
  continents) embedded in the page — typing still accepts anything, this is
  suggestion, not enforcement, so existing values that don't match exactly
  (older canonicalisations, edge cases) are never silently touched. Each field
  has a **Fill lat/lng from…** button: Country fills from that country's
  capital and sets precision to `capital`; Continent fills from a continent-
  average-of-capitals centroid and sets precision to `continent-centroid`
  (new precision value, alongside the existing `region-centroid` and
  `global-centroid`). A location of type **region** gets a third, ephemeral
  **Region** selector — the 25 UN-geoscheme regions (e.g. "Southern Asia"),
  not a field the schema stores — picking one sets Continent to match and its
  own fill button sets precision to `region-centroid`. None of these buttons
  fire automatically; they're explicit actions so a fill never silently
  overwrites coordinates you've already set by hand.
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
- No visual "where is this on the map" preview when setting lat/lng. Country/
  Continent/Region now offer a one-click fill for their capital or centroid
  coordinates (see above), but an exact site — the common case for `type:
  "site"` locations — is still typed or pasted in by hand.
- It edits three files as one unit but doesn't itself run `git` — commit and push
  your changes the normal way once you're happy with them.

## Testing

`test.mjs` is a Playwright smoke test that exercises the fallback (file-input +
zip-download) path end to end against real fixture data in `test-fixtures/`
(a snapshot of the actual `assets/data/*.json` at the time this was built) —
load, search, edit a project's locations, add/delete a location, edit a webmap's
links, save, add a parent project and link a child to it, manage the Organisations
tab (rename-as-merge, additive add, delete — checking each leaves unrelated
projects untouched), fill a Location's coordinates from a Country/Region/
Continent pick (including that an unmatched name is refused rather than
silently applied), and confirm an invalid save (a project with zero locations)
is blocked with the right error. Run it with:

```
npm install playwright   # if not already available
node test.mjs
```

It's a development aid, not something that needs to run in CI — there's no CI
for this repo's JS beyond `scripts/migrate/validate.mjs`, which is the one worth
wiring into a pre-commit hook or GitHub Action if you want that (see the data
model redesign doc's "editing tooling" section).
