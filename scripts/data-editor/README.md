# Data editor

A single offline HTML page for editing `assets/data/projects.json` and `maps.json`
(plus the optional `organisations.json`) without hand-editing JSON. This is "option 1"
from the data model redesign doc — nothing to install, nothing to host, nothing leaves
your machine.

## Using it

Open `scripts/data-editor/index.html` directly in a browser (double-click it, or
drag it into a browser window).

**Chrome or Edge:** click **Open assets/data folder…** and select the `assets/data`
folder inside your checked-out repo. Editing and clicking **Save** writes straight
back to those files — no download step, no manual file-moving.

**Any other browser:** click **Load JSON files…** and pick `projects.json` and
`maps.json` (`organisations.json` is picked up automatically if present alongside
them). **Save** downloads a single `fantail-data-export.zip` — unzip it and move the
`.json` files into `assets/data/`, replacing the originals. (They're bundled into one
zip rather than separate downloads because Chrome and other browsers block a page
from firing more than one automatic download per click without an extra permission
prompt — a zip sidesteps that entirely.)

## What it does

- Four tabs — Projects, Parent projects, Maps, Organisations — each a searchable,
  sortable table, sorted alphabetically by name by default. Click any column
  header to sort by that column instead (numeric columns like Year sort
  numerically; a blank value always sorts to the end, whichever direction);
  click the same header again to reverse direction. The active column is
  highlighted with a ▲/▼ arrow showing which way it's currently sorted.
  Click a row to edit, or **+ Add new**.
- Every Project (and parent project) has a **Category** field — Personal,
  Professional, or Other, picked from a fixed dropdown rather than typed
  freely like Type/Status. It's optional (starts unset), shows as a coloured
  badge in the Projects/Parent projects tables, and is searchable and
  sortable like any other column. Maps don't have their own Category — it's
  a project-level classification only.
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
- **Locations live directly on the Project (or parent project) and Map form —
  there's no separate Locations tab or shared catalog any more.** Each
  Project/Map has its own repeatable list of location cards, added with
  **+ Add location** and removed with **Remove this location**. Every field on
  a card — Settlement, State, Country, Region, Continent, plus Latitude/
  Longitude/Precision — is independently optional; fill in whatever's known for
  that particular place and leave the rest blank. Settlement is a specific named
  site; State is a free-text province/state with no reference list behind it.
  A Map's locations list can be left empty to inherit the linked project's
  locations instead of repeating them — the same rule as before, just no
  longer expressed as an id reference.
- **Picking a Country auto-fills Region and Continent — but only while they're
  still blank.** Type or pick a country and, if it resolves against the
  embedded UN M49 geoscheme mapping, its region and continent fill in
  automatically. If Region or Continent already has something in it — typed by
  hand, or left over from editing a different country in — it's never
  overwritten. This is non-destructive by design: the auto-fill only ever
  writes into a field that's genuinely still empty.
- Country/Region/Continent all autocomplete against a reference list (249
  countries/territories with ISO3 + capital; the 25 UN-geoscheme regions; the 7
  continents) embedded in the page — typing still accepts anything, this is
  suggestion, not enforcement, so existing values that don't match exactly
  (older canonicalisations, edge cases) are never silently touched. Each of the
  three fields has its own **Fill lat/lng from…** button: Country fills from
  that country's capital and sets precision to `capital`; Region fills from
  that UN-geoscheme region's centroid and sets precision to `region-centroid`;
  Continent fills from that continent's centroid and sets precision to
  `continent-centroid` (alongside the existing `exact` and `global-centroid`
  values). None of these buttons fire automatically; they're explicit actions
  so a fill never silently overwrites coordinates you've already set by hand.
- Relation pickers for `Project.parentId` and `Map.projectId` — search by name,
  not raw id. No more typing an id from memory or getting it wrong.
- Tag inputs for `themes`, `disaster`, `modality`, `organisation`, `level` — typing
  suggests values already in use elsewhere, so "Hurricane" vs "Cyclone" vs "Typhoon"
  stays a deliberate choice.
- **Organisations** isn't a stored entity — `Project.organisation` and
  `MapItem.organisation` are just tag fields like the others above — so this
  tab is a derived view: every distinct value in use, how many projects and
  maps use it, and which ones. It exists to clean up the drift a free-text
  field invites. Renaming one in its edit form updates every project and map
  that has it; if you rename it to a value that's already in use elsewhere,
  the two merge — the projects/maps that already had the target name are
  left alone, so nothing gets silently dropped. **+ Add new** requires picking
  at least one project up front (an organisation attached to nothing has
  nowhere to be saved) and is purely additive — it only ever adds the tag to
  the projects you pick, never removes it from anyone. Maps aren't pickable
  from this modal — tag a map with an organisation from the map's own edit
  form instead; once it's tagged, renaming or deleting that organisation here
  carries the map along automatically, it's just not individually listed in
  the picker. **Delete** removes the value from every project and map that
  has it; the projects/maps themselves aren't touched.
  Each organisation also has an optional **Abbreviation** field (e.g. "GHC" for
  "the Global Health Cluster"), stored separately in `assets/data/organisations.json`
  since it isn't part of `Project` — a sparse, optional data file (only
  organisations with an abbreviation set get an entry; a missing file just means
  none are set yet). It shows as its own table column and is searchable
  alongside the name. Renaming/merging follows the same non-destructive rule as
  project membership: merging into an organisation that already has an
  abbreviation never blanks it out just because the merged-in one didn't have
  one. Deleting an organisation clears its abbreviation for good — re-adding one
  with the same name later starts blank, it doesn't come back.
- A project with an unresolved `legacyParentName` (left over from the migration)
  shows a warning badge in the list and a banner in its edit form, with a button to
  clear the reference once you've either picked a real parent or decided it doesn't
  need one.
- **Check for issues** runs the same checks as `scripts/migrate/validate.mjs` —
  every `projectId` reference resolves, every project (and every standalone map)
  has at least one usable location, parent nesting is at most one level, no
  duplicate ids. A location counts as usable once it has anything set at all —
  a name, a coordinate, or a precision — so a deliberate "we don't know exactly
  where this is" placeholder still counts; only a location where literally
  every field is blank doesn't. **Save** refuses to write while there are hard
  errors (shown in the issues panel); warnings (like an unresolved parent name,
  or a usable location with no coordinates yet) don't block saving.
- Saved JSON uses a fixed key order per entity, so future diffs stay clean and
  focused on what actually changed rather than reordered keys.

## Known limitations

- The folder handle isn't remembered between page loads (no IndexedDB persistence
  yet) — you re-pick the folder each time you open the page in Chrome/Edge. Minor
  friction, not a correctness issue.
- No visual "where is this on the map" preview when setting lat/lng. Country/
  Region/Continent now offer a one-click fill for their capital or centroid
  coordinates (see above), but an exact Settlement — the common case for a
  named site — is still typed or pasted in by hand.
- It edits these files as one unit but doesn't itself run `git` — commit and push
  your changes the normal way once you're happy with them.

## Testing

`test.mjs` is a Playwright smoke test that exercises the fallback (file-input +
zip-download) path end to end against real fixture data in `test-fixtures/`
(a snapshot of the actual `assets/data/*.json` at the time this was built) —
load, confirm the Projects table renders alphabetically sorted by default (and
that clicking a column header - including a numeric one, Year - re-sorts by
it, that clicking the same header again reverses direction, and that clicking
a different header switches the active sort column), search by *typing* into
a search box character-by-character (rather than setting its value in one
shot) to catch focus being dropped mid-keystroke, set a project's Category
and confirm it shows as a badge in the table, persists through search, and
survives a save, open a project
and check its embedded location cards render, add a location card and confirm
the Country → Region/Continent auto-populate (and that it never overwrites an
existing value), fill a location's coordinates from each of Country/Region/
Continent (including that an unmatched name is refused rather than silently
applied), edit a webmap's links and tag it with an Organisation, save, add a
parent project and link a child to it, manage the Organisations tab
(rename-as-merge, additive add, delete — checking each leaves unrelated
projects and maps untouched, and that a rename/merge/delete carries a tagged
map along even though maps aren't individually pickable in that modal — plus
setting/searching/merging/deleting an Abbreviation without it leaking onto the
wrong organisation or surviving a delete), and confirm an invalid save (a project with
zero usable locations) is blocked with the right error. Run it with:

```
npm install playwright   # if not already available
node test.mjs
```

It's a development aid, not something that needs to run in CI — there's no CI
for this repo's JS beyond `scripts/migrate/validate.mjs`, which is the one worth
wiring into a pre-commit hook or GitHub Action if you want that (see the data
model redesign doc's "editing tooling" section).
