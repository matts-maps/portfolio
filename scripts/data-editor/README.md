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
- Every Project (and parent project) **and Map** has a **Category** field —
  Personal, Professional, or Other, picked from the same fixed dropdown
  rather than typed freely like Type/Status. It shows as a coloured badge in
  the table (the Projects/Parent projects tables, and the Maps table's own
  Category column) and is searchable and sortable like any other column. On
  Projects it's optional and starts unset (and also gates the
  professional-only fields — see below); on Maps it isn't tied to any other
  field's visibility, and **a brand-new map defaults to Professional**
  rather than starting unset, since that's true of the great majority of
  them — pick Personal or Other by hand for the exceptions. Existing maps
  from before this field existed simply have no Category yet (shown as an
  em dash in the table) until edited.
- **The Project (and parent project) form has a fixed field order, and most
  of it stays out of the way until it's relevant.** Name, ID, Parent
  project, Category, Themes, Description, Status, Start date, End date and
  Location always show, in that order. Type, Modality, Organisation, Level
  and Disaster only appear once Category is set to **Professional** — a
  personal or "Other" project skips straight from Location to the Save
  button instead of scrolling past five fields that mostly only make sense
  for client/organisational work. Switching Category back off Professional
  hides them again without clearing whatever was in them. **Start date and
  End date are proper date pickers** (a native `<input type="date">`, not a
  free-text box) — click to open a calendar rather than typing a date by
  hand. **Year and Month aren't fields on the form at all any more** —
  picking a Start date derives them automatically and they stay in the
  saved JSON purely because the Year column, sorting by Year, and the id
  convention below all still use them. Existing dates from before this
  changed still show correctly if they were already `YYYY-MM-DD` or the old
  `DD/MM/YYYY` format left over from the original migration (both convert
  into the picker automatically) — anything the picker genuinely can't
  represent, like a month-only date such as `Jun-23`, shows the raw stored
  value in the field's hint text instead of just going blank, and stays
  exactly as it was until a real date is picked to replace it.
- **Any table column that lists other records — a parent's Children, an
  organisation's Projects or Maps — renders them as a numbered list, one
  per line, instead of running them together as one comma-separated
  string.** Easier to scan and count once there's more than a couple; a
  cell with nothing to list still just shows a plain em dash.
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
  countries/territories with ISO3 + capital; 27 regions — the 25 UN-geoscheme
  sub-regions plus Middle East and Pacific, both common enough in how this
  data gets described that they're offered alongside the formal M49 terms
  (Western Asia, and Melanesia/Micronesia/Polynesia/Australia and New
  Zealand, still cover the same countries) — Caribbean is also in there,
  under the Americas; the 7 continents) embedded in the page — typing still
  accepts anything, this is suggestion, not enforcement, so existing values
  that don't match exactly (older canonicalisations, edge cases) are never
  silently touched. Each of the
  three fields has its own **Fill lat/lng from…** button: Country fills from
  that country's capital and sets precision to `capital`; Region fills from
  that UN-geoscheme region's centroid and sets precision to `region-centroid`;
  Continent fills from that continent's centroid and sets precision to
  `continent-centroid` (alongside the existing `exact` and `global-centroid`
  values). None of these buttons fire automatically; they're explicit actions
  so a fill never silently overwrites coordinates you've already set by hand.
- Relation pickers for `Project.parentId` and `Map.projectId` — search by name,
  not raw id. No more typing an id from memory or getting it wrong.
- **Project ids follow a fixed convention**, auto-filled if the ID field is
  left blank when you save: `year-country-category-(org abbreviation)-name`,
  e.g. `2020-irq-professional-who-impact-of-covid-19-visualisations`. `year`
  comes from Start date (see above — there's no separate Year field to fill
  in); `country` is the ISO3 code of the first location's Country — **except
  on a parent project, where that slot is always the literal `parent`**
  instead (e.g. `2020-parent-professional-who-regional-covid-19-response`),
  since a parent groups children that can each be somewhere different, so
  its own first location's country would be misleading there; `category` is
  the Category field; the organisation segment is optional and only
  appears when one of the project's Organisation tags has an Abbreviation
  set (see the Organisations tab below) — the first one that resolves wins,
  and since Organisation only shows once Category is Professional, that
  segment is only reachable at all for a Professional project. Any part
  that isn't known yet (no year, no country, no matching abbreviation) is
  simply left out rather than leaving a gap, so a brand-new project with
  just a Name still gets a sensible id. To regenerate an existing project's
  id after filling in more of these fields, clear the ID field and save
  again — same mechanism, not automatic on every edit. Map ids aren't part
  of this convention — even though Maps have a Category field too now, it
  doesn't feed into the id — and keep their existing name/file-based
  auto-fill.
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
survives a save, confirm the project form's core fields render in the fixed
order (Name, ID, Parent project, Category, Themes, Description, Status,
Start date, End date, Location) and that Type/Modality/Organisation/Level/
Disaster and a Year or Month field are absent until Category is set to
Professional (and hidden again switching back, with Parent project staying
visible throughout), confirm Start date/End date are native date pickers -
that the old DD/MM/YYYY migration format and plain ISO dates both convert
into the picker correctly, that a date the picker can't represent (no day,
like "Jun-23") leaves it blank but surfaces the raw value in the hint
instead of just losing it, and that picking a date saves cleanly and
derives Year/Month with no field on screen to type them into, confirm the
Region reference list offers Middle East, Pacific and Caribbean alongside
the formal UN M49 terms, edit a webmap's Category field (present alongside
Kind, offering the same Personal/Professional/Other options as Projects,
starting unset on a fixture map with none yet) and confirm it shows in the
Maps table's Category column and survives a save, and separately confirm a
brand-new map defaults its Category to Professional, open a
project
and check its embedded location cards render, add a location card and confirm
the Country → Region/Continent auto-populate (and that it never overwrites an
existing value), fill a location's coordinates from each of Country/Region/
Continent (including that an unmatched name is refused rather than silently
applied), edit a webmap's links and tag it with an Organisation, save, add a
parent project and link a child to it (confirming its Children column
renders as a numbered list, not a comma-separated run - same check repeated
for an organisation's Projects column further down), manage the
Organisations tab
(rename-as-merge, additive add, delete — checking each leaves unrelated
projects and maps untouched, and that a rename/merge/delete carries a tagged
map along even though maps aren't individually pickable in that modal — plus
setting/searching/merging/deleting an Abbreviation without it leaking onto the
wrong organisation or surviving a delete), confirm a new project with a blank
ID gets the year-country-category-name convention with the organisation
segment correctly omitted when no Abbreviation is set yet, then confirm
regenerating the id (blank it, save again) after setting one picks it up,
confirm a parent project's id uses the literal "parent" in the country
slot even when it has a location on it, and
confirm an invalid save (a project with
zero usable locations) is blocked with the right error. Run it with:

```
npm install playwright   # if not already available
node test.mjs
```

It's a development aid, not something that needs to run in CI — there's no CI
for this repo's JS beyond `scripts/migrate/validate.mjs`, which is the one worth
wiring into a pre-commit hook or GitHub Action if you want that (see the data
model redesign doc's "editing tooling" section).
