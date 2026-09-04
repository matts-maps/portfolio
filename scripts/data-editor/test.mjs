// Playwright smoke test for the data editor, run against real fixture data
// (a copy of the actual assets/data/*.json from the repo).
//
// Exercises the fallback (file-input + download) path end to end, since
// showDirectoryPicker can't be automated - but both paths share the same
// load/render/validate/save logic, so this covers the important part.

import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, "test-fixtures");
const PAGE = "file://" + path.join(__dirname, "index.html");

let failures = 0;
function check(label, cond) {
  if (cond) {
    console.log(`  ok   ${label}`);
  } else {
    console.error(`  FAIL ${label}`);
    failures += 1;
  }
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on("pageerror", (err) => consoleErrors.push(err.message));
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

  const dialogs = [];
  page.on("dialog", async (d) => { dialogs.push(d.message()); await d.accept(); });

  await page.goto(PAGE);

  console.log("Loading via fallback file inputs...");
  await page.click("#btn-show-fallback");
  await page.setInputFiles("#file-projects", path.join(FIXTURES, "projects.json"));
  await page.setInputFiles("#file-maps", path.join(FIXTURES, "maps.json"));
  await page.click("#btn-load-fallback");
  await page.waitForSelector("#tabs button.active");

  const projCount = await page.textContent("#count-projects");
  const parentCount = await page.textContent("#count-parents");
  const mapCount = await page.textContent("#count-maps");
  check("projects count is (64)", projCount.trim() === "(64)");
  check("parent projects count is (0) - none of the fixture data has a linked parent yet", parentCount.trim() === "(0)");
  check("maps count is (60)", mapCount.trim() === "(60)");

  console.log("Checking the Projects table is sorted alphabetically...");
  // The name cell can be prefixed with an issue-count badge (e.g. an
  // unresolved-parent warning) with no separating whitespace, so strip that
  // off before comparing rather than reading the cell's raw textContent.
  const projectNames = await page.$$eval("#tab-projects tbody tr td:first-child", (cells) =>
    cells.map((c) => {
      const badge = c.querySelector(".badge");
      return badge ? c.textContent.slice(badge.textContent.length) : c.textContent;
    })
  );
  const sortedProjectNames = [...projectNames].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  check("project rows are in alphabetical order", JSON.stringify(projectNames) === JSON.stringify(sortedProjectNames));

  console.log("Checking issues panel picks up known warnings...");
  await page.click("#btn-validate");
  await page.waitForSelector("#issues-panel.open");
  const issuesText = await page.textContent("#issues-list");
  check("issues panel mentions unresolved parent", issuesText.includes("Unresolved parent reference"));
  check("no hard errors on pristine data", !/\b0 error/.test(issuesText) === false || issuesText.includes("0 error(s)"));
  await page.click("#btn-close-issues");

  console.log("Opening an existing project and checking fields populate...");
  await page.click('#tabs button[data-tab="projects"]');
  // Type it character-by-character rather than page.fill(), which sets the
  // value in one shot and dispatches a single input event. Real typing is
  // what actually exercises the search box, and is what would have caught
  // the "only allows you to type one letter" bug: a full-table rerender on
  // every keystroke was destroying and recreating the search input itself,
  // so real typing lost focus after the first character.
  await page.click("#search-projects");
  await page.type("#search-projects", "Impact of Covid-19", { delay: 20 });
  await page.waitForTimeout(50);
  const typedValue = await page.inputValue("#search-projects");
  check("search input kept every typed character (no focus loss mid-keystroke)", typedValue === "Impact of Covid-19");
  const rowText = await page.textContent("#tab-projects tbody tr");
  check("search found the GIMAC project", rowText.includes("Impact of Covid-19"));
  await page.click("#tab-projects tbody tr");
  await page.waitForSelector("#overlay.open");
  const modalTitle = await page.textContent("#modal h2");
  check("modal opened for the right project", modalTitle.includes("Impact of Covid-19"));

  const fieldByLabel = async (labelPrefix) => {
    const fields = await page.$$("#modal .field");
    for (const f of fields) {
      const label = await f.$eval("label", (l) => l.childNodes[0]?.textContent || "").catch(() => "");
      if (label.startsWith(labelPrefix)) return f;
    }
    return null;
  };

  /** Same as fieldByLabel, but scoped to one location-card handle - needed
   * once a modal has more than one card, since every card repeats the same
   * field labels (Settlement, Country, Region, ...). */
  const fieldInCard = async (card, labelPrefix) => {
    const fields = await card.$$(".field");
    for (const f of fields) {
      const label = await f.$eval("label", (l) => l.childNodes[0]?.textContent || "").catch(() => "");
      if (label.startsWith(labelPrefix)) return f;
    }
    return null;
  };

  const locationCards = () => page.$$(".locations-section .location-card");
  const latLngOf = async (card) => {
    const vals = await card.$$eval("input[type=number]", (els) => els.map((e) => e.value));
    return { lat: vals[0], lng: vals[1] };
  };

  const cards0 = await locationCards();
  check("location cards rendered (8 countries)", cards0.length === 8);

  console.log("Editing that project's name, and adding Iraq as a 9th location...");
  const nameField = await fieldByLabel("Name");
  await nameField.$eval("input[type=text]", (el) => (el.value = "")); // clear first
  await (await nameField.$("input[type=text]")).fill("Impact of Covid-19 visualisations (edited)");

  await page.click('.locations-section button:has-text("+ Add location")');
  await page.waitForTimeout(50);
  let cards = await locationCards();
  check("a 9th location card appeared", cards.length === 9);
  let newCard = cards[cards.length - 1];
  const newCardCountryField = await fieldInCard(newCard, "Country");
  await (await newCardCountryField.$("input[type=text]")).fill("Iraq");
  await page.waitForTimeout(50);

  // Re-fetch: typing Country doesn't re-render the modal (it updates
  // Region/Continent's DOM nodes directly so focus isn't lost mid-keystroke
  // - see index.html), so these handles are still live, but re-fetch the
  // card anyway to stay consistent with the re-render-triggering steps below.
  cards = await locationCards();
  newCard = cards[cards.length - 1];
  const regionAfterCountryPick = await (await fieldInCard(newCard, "Region")).$eval("input[type=text]", (el) => el.value);
  const continentAfterCountryPick = await (await fieldInCard(newCard, "Continent")).$eval("input[type=text]", (el) => el.value);
  check("picking Iraq auto-fills Region to Western Asia", regionAfterCountryPick === "Western Asia");
  check("picking Iraq auto-fills Continent to Asia", continentAfterCountryPick === "Asia");

  const newCardCountryFieldAgain = await fieldInCard(newCard, "Country"); // fresh, though unchanged since the last fetch
  await (await newCardCountryFieldAgain.$('button:has-text("Fill lat/lng from capital")')).click();
  await page.waitForTimeout(50);
  cards = await locationCards();
  newCard = cards[cards.length - 1];
  const iraqLatLng = await latLngOf(newCard);
  check("filling from Iraq's capital sets latitude", Number(iraqLatLng.lat) === 33.3406);
  check("filling from Iraq's capital sets longitude", Number(iraqLatLng.lng) === 44.4009);
  const iraqPrecision = await (await fieldInCard(newCard, "Precision")).$eval("select", (el) => el.value);
  check("filling from a capital sets precision to \"capital\"", iraqPrecision === "capital");

  await page.click("#modal .modal-actions button.primary");
  await page.waitForSelector("#overlay.open", { state: "hidden" });

  const statusText = await page.textContent("#status");
  check("status shows unsaved changes after edit", statusText.includes("Unsaved"));

  console.log("Triggering Save and capturing the downloaded zip...");
  const downloadPromise = page.waitForEvent("download");
  await page.click("#btn-save");
  const download = await downloadPromise;
  const outDir = path.join(__dirname, "test-output");
  // Wipe any stale files from a previous run (e.g. a leftover locations.json
  // from before locations were embedded) rather than just creating the dir -
  // otherwise a stale file can make a "the zip doesn't contain X" check pass
  // or fail for the wrong reason.
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const zipPath = path.join(outDir, "export.zip");
  await download.saveAs(zipPath);
  check("save produced exactly one zip download", download.suggestedFilename() === "fantail-data-export.zip");

  const { execSync } = await import("node:child_process");
  execSync(`unzip -o -q "${zipPath}" -d "${outDir}"`);
  const savedFiles = {
    "projects.json": path.join(outDir, "projects.json"),
    "maps.json": path.join(outDir, "maps.json"),
  };
  check("zip contains projects.json and maps.json (no locations.json any more)", Object.values(savedFiles).every((p) => fs.existsSync(p)));
  check("zip does not contain a locations.json", !fs.existsSync(path.join(outDir, "locations.json")));

  const savedProjects = JSON.parse(fs.readFileSync(savedFiles["projects.json"], "utf8"));
  check("saved projects count is still 64 (edited, not added)", savedProjects.length === 64);
  const gimac = savedProjects.find((p) => p.name.startsWith("Impact of Covid-19"));
  check("GIMAC project name edit persisted", gimac.name === "Impact of Covid-19 visualisations (edited)");
  check("GIMAC project now has 9 locations (Iraq added)", gimac.locations.length === 9);
  const savedIraq = gimac.locations.find((l) => l.country === "Iraq");
  check("the added Iraq location is embedded directly on the project, coordinates and all", !!savedIraq && savedIraq.lat === 33.3406 && savedIraq.lng === 44.4009 && savedIraq.region === "Western Asia" && savedIraq.continent === "Asia");

  console.log("Editing a webmap (kind switch, links editor, adding an Organisation tag)...");
  await page.click('#tabs button[data-tab="maps"]');
  await page.fill("#search-maps", "");
  const rows = await page.$$("#tab-maps tbody tr");
  let webmapRow = null;
  for (const r of rows) {
    const text = await r.textContent();
    if (text.includes("webmap")) { webmapRow = r; break; }
  }
  check("found an existing webmap row", webmapRow !== null);
  await webmapRow.click();
  await page.waitForSelector("#overlay.open");
  const linksField = await fieldByLabel("Links");
  check("webmap form shows a Links field", linksField !== null);
  const addLinkBtn = await linksField.$('button:has-text("Add label")');
  await addLinkBtn.click();
  const kvInputs = await linksField.$$(".kv-row:last-of-type input");
  await kvInputs[0].fill("Test link");
  await kvInputs[1].fill("https://example.com/test");

  const webmapOrgField = await fieldByLabel("Organisation");
  check("webmap form shows an Organisation field", webmapOrgField !== null);
  await (await webmapOrgField.$("input[type=text]")).fill("MapAction");
  await (await webmapOrgField.$('button:has-text("Add")')).click();
  const webmapOrgChips = await webmapOrgField.$$eval(".chip", (chips) => chips.map((c) => c.textContent));
  check("webmap now carries the MapAction organisation tag", webmapOrgChips.some((c) => c.includes("MapAction")));

  await page.click("#modal .modal-actions button.primary");
  await page.waitForSelector("#overlay.open", { state: "hidden" });

  console.log("Checking the Maps table and search reflect the new Organisation tag...");
  await page.fill("#search-maps", "MapAction");
  await page.waitForTimeout(50);
  const orgFilteredMapRows = await page.$$("#tab-maps tbody tr");
  check("searching Maps by organisation finds exactly the edited webmap", orgFilteredMapRows.length === 1);
  const mapOrgCell = await page.$eval("#tab-maps tbody tr td:nth-child(5)", (td) => td.textContent);
  check("Maps table's Organisation column shows MapAction", mapOrgCell.includes("MapAction"));
  await page.fill("#search-maps", "");

  console.log("Checking the Organisations tab picks up that map alongside its projects...");
  await page.click('#tabs button[data-tab="organisations"]');
  await page.fill("#search-organisations", "MapAction");
  await page.waitForTimeout(50);
  const mapActionMapCountCell = await page.$eval("#tab-organisations tbody tr td:nth-child(5)", (td) => td.textContent.trim());
  check("MapAction's # Maps cell reads 1", mapActionMapCountCell === "1");
  const mapActionMapsCell = await page.$eval("#tab-organisations tbody tr td:nth-child(6)", (td) => td.textContent);
  check("MapAction's Maps cell names the edited webmap", mapActionMapsCell.trim().length > 0 && mapActionMapsCell.trim() !== "—");
  await page.fill("#search-organisations", "");
  await page.click('#tabs button[data-tab="maps"]');

  console.log("Final save with the webmap link and organisation tag added...");
  const finalDownload = page.waitForEvent("download");
  await page.click("#btn-save");
  const finalDl = await finalDownload;
  const finalZip = path.join(outDir, "export2.zip");
  await finalDl.saveAs(finalZip);
  execSync(`unzip -o -q "${finalZip}" -d "${outDir}"`);
  const finalMaps = JSON.parse(fs.readFileSync(path.join(outDir, "maps.json"), "utf8"));
  const editedWebmap = finalMaps.find((m) => (m.links || []).some((l) => l.url === "https://example.com/test"));
  check("webmap link edit persisted through a second save", !!editedWebmap);
  check("webmap's Organisation tag persisted through a second save", !!editedWebmap && (editedWebmap.organisation || []).includes("MapAction"));
  const finalProjects = JSON.parse(fs.readFileSync(path.join(outDir, "projects.json"), "utf8"));
  const finalGimac = finalProjects.find((p) => p.name.startsWith("Impact of Covid-19"));
  check("GIMAC's 9 embedded locations (Iraq included) survived the second save too", finalGimac.locations.length === 9);

  console.log("Checking Ebola shows an unresolved-parent banner before its parent exists...");
  await page.click('#tabs button[data-tab="projects"]');
  await page.fill("#search-projects", "Ebola");
  await page.waitForTimeout(50);
  await page.click("#tab-projects tbody tr");
  await page.waitForSelector("#overlay.open");
  const ebolaBanner = await page.textContent("#modal .warn-msg").catch(() => "");
  check("Ebola shows the unresolved-parent banner before fixing it", ebolaBanner.includes("2014 Ebola response in West Africa"));
  await page.click("#modal .modal-actions button:has-text('Cancel')");
  await page.waitForSelector("#overlay.open", { state: "hidden" });

  console.log("Adding the missing parent project from the Parent projects tab...");
  await page.click('#tabs button[data-tab="parents"]');
  await page.click('#tab-parents .toolbar button.primary'); // + Add new
  await page.waitForSelector("#overlay.open");
  const parentFieldFromTab = await fieldByLabel("Parent project");
  check("Parent project field has no picker when adding from the Parents tab", (await parentFieldFromTab.$("select")) === null);
  const parentNameField = await fieldByLabel("Name");
  await (await parentNameField.$("input[type=text]")).fill("2014 Ebola response in West Africa");
  await page.click('.locations-section button:has-text("+ Add location")');
  await page.waitForTimeout(50);
  const parentCards = await locationCards();
  const parentCard = parentCards[parentCards.length - 1];
  await (await (await fieldInCard(parentCard, "Country")).$("input[type=text]")).fill("Liberia");
  await page.click("#modal .modal-actions button.primary");
  await page.waitForSelector("#overlay.open", { state: "hidden" });

  console.log("Confirming it's immediately in Parent projects, before any child is linked...");
  await page.fill("#search-parents", "Ebola");
  await page.waitForTimeout(50);
  const parentsRowText = await page.textContent("#tab-parents tbody tr").catch(() => "");
  check("Parent projects tab lists it right away, with no children yet", parentsRowText.includes("2014 Ebola response in West Africa") && parentsRowText.includes("—"));

  console.log("Confirming it does NOT show in the Projects tab...");
  await page.click('#tabs button[data-tab="projects"]');
  await page.fill("#search-projects", "2014 Ebola response in West Africa");
  await page.waitForTimeout(50);
  const projectHitsForParent = await page.$$("#tab-projects tbody tr");
  check("Projects tab has no row for the new parent project", projectHitsForParent.length === 0);

  console.log("Linking Ebola to it and confirming the banner clears immediately...");
  await page.fill("#search-projects", "Ebola");
  await page.waitForTimeout(50);
  await page.click("#tab-projects tbody tr");
  await page.waitForSelector("#overlay.open");
  const parentPickerField = await fieldByLabel("Parent project");
  const parentOptionsList = await parentPickerField.$$eval("select option", (opts) => opts.map((o) => o.textContent));
  check("Parent project picker offers the newly-added Parent project", parentOptionsList.includes("2014 Ebola response in West Africa"));
  check("Parent project picker does not offer an ordinary (non-parent) project", !parentOptionsList.some((t) => t.includes("MapAction Development")));
  const parentSelect = await parentPickerField.$("select");
  await parentSelect.selectOption({ label: "2014 Ebola response in West Africa" });
  await page.waitForTimeout(50);
  const bannerStillThere = await page.$("#modal .warn-msg");
  check("unresolved-parent banner disappears once a real parent is picked", bannerStillThere === null);
  await page.click("#modal .modal-actions button.primary");
  await page.waitForSelector("#overlay.open", { state: "hidden" });

  await page.click("#btn-validate");
  await page.waitForSelector("#issues-panel.open");
  const issuesAfterParentFix = await page.textContent("#issues-list");
  check("no more unresolved-parent warning for Ebola after linking it", !issuesAfterParentFix.includes("2014 Ebola response in West Africa"));
  await page.click("#btn-close-issues");

  console.log("Confirming the parent's Children column now shows Ebola, and it's still absent from Projects...");
  await page.click('#tabs button[data-tab="parents"]');
  await page.fill("#search-parents", "Ebola");
  await page.waitForTimeout(50);
  const parentsRowAfterLink = await page.textContent("#tab-parents tbody tr").catch(() => "");
  check("parents tab still lists the parent project", parentsRowAfterLink.includes("2014 Ebola response in West Africa"));
  check("its Children column now shows the linked Ebola project", parentsRowAfterLink.split("2014 Ebola response in West Africa")[1]?.includes("Ebola"));

  await page.click('#tabs button[data-tab="projects"]');
  await page.fill("#search-projects", "2014 Ebola response in West Africa");
  await page.waitForTimeout(50);
  const projectHitsForParentAfter = await page.$$("#tab-projects tbody tr");
  check("Projects tab still has no row for the parent project, even once it has a child", projectHitsForParentAfter.length === 0);

  console.log("Testing that an invalid save (project with zero locations) is blocked...");
  await page.click('#tabs button[data-tab="projects"]');
  await page.fill("#search-projects", "");
  await page.click("#tab-projects tbody tr"); // open first project
  await page.waitForSelector("#overlay.open");
  let removed = 0;
  for (let i = 0; i < 20; i++) {
    const removeBtn = await page.$(".locations-section .location-card button.danger");
    if (!removeBtn) break;
    await removeBtn.click();
    await page.waitForTimeout(20);
    removed += 1;
  }
  await page.click("#modal .modal-actions button.primary");
  await page.waitForSelector("#overlay.open", { state: "hidden" });
  check("removed at least one location card", removed > 0);

  const dialogCountBeforeSave = dialogs.length;
  await page.click("#btn-save"); // should be blocked - no download event should fire
  await page.waitForTimeout(300);
  check("save was blocked with an alert", dialogs.length === dialogCountBeforeSave + 1);
  check("blocked-save alert mentions error count", dialogs[dialogs.length - 1].includes("error"));
  check("issues panel opened showing the blocking error", await page.$eval("#issues-panel", (e) => e.classList.contains("open")));
  const issuesTextAfterBlock = await page.textContent("#issues-list");
  check("blocking issue names the empty-locations project", issuesTextAfterBlock.includes("No locations attached"));

  console.log("Opening the Organisations tab and checking the derived list...");
  await page.click('#tabs button[data-tab="organisations"]');
  const orgCount0 = await page.textContent("#count-organisations");
  check("organisations count is (38)", orgCount0.trim() === "(38)");
  await page.fill("#search-organisations", "MapAction");
  await page.waitForTimeout(50);
  const mapActionRows = await page.$$("#tab-organisations tbody tr");
  check("exactly one organisation matches \"MapAction\"", mapActionRows.length === 1);
  const mapActionRowText = await page.textContent("#tab-organisations tbody tr");
  check("MapAction row lists its 3 projects", mapActionRowText.includes("MapAction Development"));
  const mapActionCountCell = await page.$eval("#tab-organisations tbody tr td:nth-child(3)", (td) => td.textContent.trim());
  check("MapAction's project count cell reads 3", mapActionCountCell === "3");
  await page.click("#tab-organisations tbody tr");
  await page.waitForSelector("#overlay.open");
  const orgModalTitle = await page.textContent("#modal h2");
  check("organisation modal titled after the organisation", orgModalTitle.trim() === "MapAction");
  const orgModalSub = await page.textContent("#modal .modal-sub");
  check("organisation modal sub-text shows usage count", orgModalSub.includes("used by 3 project(s)"));
  const orgProjectsField = await fieldByLabel("Projects");
  const orgProjectChips = await orgProjectsField.$$eval(".chip", (nodes) => nodes.length);
  check("organisation modal preloads its 3 linked projects", orgProjectChips === 3);

  console.log("Renaming MapAction into an existing organisation (merge) without touching its selection...");
  const orgNameField = await fieldByLabel("Name");
  await orgNameField.$eval("input[type=text]", (el) => (el.value = ""));
  await (await orgNameField.$("input[type=text]")).fill("World Health Organisation (WHO)");
  await page.click("#modal .modal-actions button.primary");
  await page.waitForSelector("#overlay.open", { state: "hidden" });

  const orgCount1 = await page.textContent("#count-organisations");
  check("organisation count drops by one after the merge (MapAction absorbed)", orgCount1.trim() === "(37)");
  await page.fill("#search-organisations", "MapAction");
  await page.waitForTimeout(50);
  const mapActionRowsAfter = await page.$$("#tab-organisations tbody tr");
  check("MapAction no longer appears as its own organisation", mapActionRowsAfter.length === 0);
  await page.fill("#search-organisations", "World Health Organisation");
  await page.waitForTimeout(50);
  const whoNameCell = await page.$eval("#tab-organisations tbody tr td:nth-child(1)", (td) => td.textContent.trim());
  check("WHO row is present after the merge", whoNameCell === "World Health Organisation (WHO)");
  const whoCountCell = await page.$eval("#tab-organisations tbody tr td:nth-child(3)", (td) => td.textContent.trim());
  check("WHO's project count cell reads 6 (its original 3 plus the merged-in 3)", whoCountCell === "6");
  const whoMapCountCell = await page.$eval("#tab-organisations tbody tr td:nth-child(5)", (td) => td.textContent.trim());
  check("WHO's # Maps cell reads 1 - the webmap tagged MapAction earlier followed the merge, not just projects", whoMapCountCell === "1");
  await page.fill("#search-organisations", "");
  await page.click('#tabs button[data-tab="maps"]');
  await page.fill("#search-maps", "MapAction");
  await page.waitForTimeout(50);
  const staleMapActionMapRows = await page.$$("#tab-maps tbody tr");
  check("the webmap no longer searches as \"MapAction\" - its tag was renamed to WHO along with the project merge", staleMapActionMapRows.length === 0);
  await page.fill("#search-maps", "World Health Organisation");
  await page.waitForTimeout(50);
  const renamedMapRows = await page.$$("#tab-maps tbody tr");
  check("the webmap's Organisation tag now reads World Health Organisation (WHO)", renamedMapRows.length === 1);
  await page.fill("#search-maps", "");
  await page.click('#tabs button[data-tab="organisations"]');

  console.log("Adding a brand-new organisation additively, onto a project that already has other tags...");
  await page.click('#tab-organisations .toolbar button.primary'); // + Add new
  await page.waitForSelector("#overlay.open");
  const newOrgTitle = await page.textContent("#modal h2");
  check("new organisation modal titled generically", newOrgTitle.trim() === "New organisation");
  await page.fill("#modal .field input[type=text]", "Test Org Additive"); // name field is first text input
  const newOrgProjectsField = await fieldByLabel("Projects");
  const newOrgProjectInput = await newOrgProjectsField.$("input[type=text]");
  await newOrgProjectInput.fill("MapAction Development (2006)");
  await (await newOrgProjectsField.$('button:has-text("Add")')).click();
  await page.click("#modal .modal-actions button.primary");
  await page.waitForSelector("#overlay.open", { state: "hidden" });

  const orgCount2 = await page.textContent("#count-organisations");
  check("organisation count rises by one after the additive add", orgCount2.trim() === "(38)");

  console.log("Confirming the additive add didn't disturb the project's existing (merged) organisation tag...");
  await page.click('#tabs button[data-tab="projects"]');
  await page.fill("#search-projects", "MapAction Development");
  await page.waitForTimeout(50);
  await page.click("#tab-projects tbody tr");
  await page.waitForSelector("#overlay.open");
  const mdOrgField = await fieldByLabel("Organisation");
  const mdOrgValues = await mdOrgField.$$eval(".chip", (nodes) => nodes.map((n) => n.childNodes[0].textContent));
  check("MapAction Development kept its merged WHO tag", mdOrgValues.includes("World Health Organisation (WHO)"));
  check("MapAction Development also picked up the new additive tag", mdOrgValues.includes("Test Org Additive"));
  check("MapAction Development has exactly those two organisation tags (no stray duplicate/removal)", mdOrgValues.length === 2);
  await page.click("#modal .modal-actions button:has-text('Cancel')");
  await page.waitForSelector("#overlay.open", { state: "hidden" });

  console.log("Deleting the additive organisation and confirming it's gone everywhere, cleanly...");
  await page.click('#tabs button[data-tab="organisations"]');
  await page.fill("#search-organisations", "Test Org Additive");
  await page.waitForTimeout(50);
  await page.click("#tab-organisations tbody tr");
  await page.waitForSelector("#overlay.open");
  await page.click('#modal .modal-actions button:has-text("Delete")'); // global dialog handler accepts the confirm()
  await page.waitForSelector("#overlay.open", { state: "hidden" });
  const orgCount3 = await page.textContent("#count-organisations");
  check("organisation count drops back to (37) after delete", orgCount3.trim() === "(37)");

  await page.click('#tabs button[data-tab="projects"]');
  await page.fill("#search-projects", "MapAction Development");
  await page.waitForTimeout(50);
  await page.click("#tab-projects tbody tr");
  await page.waitForSelector("#overlay.open");
  const mdOrgFieldAfterDelete = await fieldByLabel("Organisation");
  const mdOrgValuesAfterDelete = await mdOrgFieldAfterDelete.$$eval(".chip", (nodes) => nodes.map((n) => n.childNodes[0].textContent));
  check("MapAction Development lost only the deleted tag", mdOrgValuesAfterDelete.length === 1 && mdOrgValuesAfterDelete[0] === "World Health Organisation (WHO)");
  await page.click("#modal .modal-actions button:has-text('Cancel')");
  await page.waitForSelector("#overlay.open", { state: "hidden" });

  console.log("Opening a new project and testing inline location entry against the reference Country/Region/Continent data...");
  await page.click('#tabs button[data-tab="projects"]');
  await page.fill("#search-projects", "");
  const projectCountBeforeScratch = (await page.textContent("#count-projects")).trim();
  await page.click('#tab-projects .toolbar button.primary'); // + Add new
  await page.waitForSelector("#overlay.open");
  await page.fill("#modal .field input[type=text]", "Scratch project for location testing"); // Name is the first text input
  await page.click('.locations-section button:has-text("+ Add location")');
  await page.waitForTimeout(50);

  check("a fresh location card has a Settlement field", (await fieldByLabel("Settlement")) !== null);
  check("a fresh location card has a State field", (await fieldByLabel("State")) !== null);

  console.log("Filling coordinates from the reference Country data...");
  const countryField = await fieldByLabel("Country");
  await (await countryField.$("input[type=text]")).fill("Kenya");
  await (await countryField.$('button:has-text("Fill lat/lng from capital")')).click();
  await page.waitForTimeout(50);
  let scratchCards = await locationCards();
  let scratchCard = scratchCards[0];
  let latLng = await latLngOf(scratchCard);
  check("filling from Kenya's capital sets latitude", Number(latLng.lat) === -1.2833);
  check("filling from Kenya's capital sets longitude", Number(latLng.lng) === 36.8167);
  const precisionAfterCountryFill = await (await fieldInCard(scratchCard, "Precision")).$eval("select", (el) => el.value);
  check("filling from a capital sets precision to \"capital\"", precisionAfterCountryFill === "capital");

  console.log("Switching to a bogus country name and confirming the fill button refuses rather than guessing...");
  const countryFieldAfterFill = await fieldInCard(scratchCard, "Country"); // re-fetch: the successful fill above re-rendered the modal
  await (await countryFieldAfterFill.$("input[type=text]")).fill("Not A Real Country");
  const dialogCountBeforeBadCountry = dialogs.length;
  await (await countryFieldAfterFill.$('button:has-text("Fill lat/lng from capital")')).click();
  await page.waitForTimeout(100);
  check("an unmatched country name is refused with an alert, not silently applied", dialogs.length === dialogCountBeforeBadCountry + 1);

  console.log("Filling coordinates directly from a typed Region...");
  const regionFieldForFill = await fieldInCard(scratchCard, "Region");
  await (await regionFieldForFill.$("input[type=text]")).fill("Southern Asia");
  await (await regionFieldForFill.$('button:has-text("Fill lat/lng from region centroid")')).click();
  await page.waitForTimeout(50);
  scratchCards = await locationCards();
  scratchCard = scratchCards[0];
  latLng = await latLngOf(scratchCard);
  check("filling from Southern Asia's centroid sets latitude", Number(latLng.lat) === 24.7283);
  check("filling from Southern Asia's centroid sets longitude", Number(latLng.lng) === 76.62);
  const precisionAfterRegionFill = await (await fieldInCard(scratchCard, "Precision")).$eval("select", (el) => el.value);
  check("filling from a region centroid sets precision to \"region-centroid\"", precisionAfterRegionFill === "region-centroid");

  console.log("Filling coordinates directly from a typed Continent...");
  const continentFieldForFill = await fieldInCard(scratchCard, "Continent");
  await (await continentFieldForFill.$("input[type=text]")).fill("Africa");
  await (await continentFieldForFill.$('button:has-text("Fill lat/lng from continent centroid")')).click();
  await page.waitForTimeout(50);
  scratchCards = await locationCards();
  scratchCard = scratchCards[0];
  latLng = await latLngOf(scratchCard);
  check("filling from Africa's continent centroid sets latitude", Number(latLng.lat) === 1.7725);
  check("filling from Africa's continent centroid sets longitude", Number(latLng.lng) === 17.7511);
  const precisionAfterContinentFill = await (await fieldInCard(scratchCard, "Precision")).$eval("select", (el) => el.value);
  check("filling from a continent centroid sets precision to \"continent-centroid\"", precisionAfterContinentFill === "continent-centroid");

  console.log("Adding a second location card to check the auto-populate never overwrites an existing value...");
  await page.click('.locations-section button:has-text("+ Add location")');
  await page.waitForTimeout(50);
  let cardsNow = await locationCards();
  check("a second location card was added", cardsNow.length === 2);
  let card2 = cardsNow[1];
  const card2Region = await fieldInCard(card2, "Region");
  await (await card2Region.$("input[type=text]")).fill("Custom Region Text");
  const card2Country = await fieldInCard(card2, "Country");
  await (await card2Country.$("input[type=text]")).fill("Nigeria"); // maps to Western Africa / Africa
  await page.waitForTimeout(50);
  cardsNow = await locationCards();
  card2 = cardsNow[1];
  const card2RegionAfter = await (await fieldInCard(card2, "Region")).$eval("input[type=text]", (el) => el.value);
  const card2ContinentAfter = await (await fieldInCard(card2, "Continent")).$eval("input[type=text]", (el) => el.value);
  check("a Region that was already filled in is never overwritten by picking a Country", card2RegionAfter === "Custom Region Text");
  check("Continent still auto-fills from Country when it was blank, even though Region wasn't touched", card2ContinentAfter === "Africa");

  console.log("Removing the second card and discarding this scratch project without saving...");
  const removeBtn2 = await card2.$("button.danger");
  await removeBtn2.click();
  await page.waitForTimeout(50);
  const cardsAfterRemove = await locationCards();
  check("removing the second card leaves exactly one", cardsAfterRemove.length === 1);

  await page.click("#modal .modal-actions button:has-text('Cancel')");
  await page.waitForSelector("#overlay.open", { state: "hidden" });
  const projectCountAfterScratch = (await page.textContent("#count-projects")).trim();
  check("cancelling the scratch project didn't add it", projectCountAfterScratch === projectCountBeforeScratch);

  console.log("Setting an Abbreviation on an organisation whose name doesn't already spell one out...");
  await page.click('#tabs button[data-tab="organisations"]');
  await page.fill("#search-organisations", "the Global Health Cluster");
  await page.waitForTimeout(50);
  const ghcAbbrevCellBefore = await page.$eval("#tab-organisations tbody tr td:nth-child(2)", (td) => td.textContent.trim());
  check("Global Health Cluster starts with no abbreviation shown", ghcAbbrevCellBefore === "—");
  await page.click("#tab-organisations tbody tr");
  await page.waitForSelector("#overlay.open");
  const ghcAbbrevFieldBefore = await fieldByLabel("Abbreviation");
  const ghcAbbrevValueBefore = await ghcAbbrevFieldBefore.$eval("input[type=text]", (el) => el.value);
  check("its Abbreviation field opens blank", ghcAbbrevValueBefore === "");
  await (await ghcAbbrevFieldBefore.$("input[type=text]")).fill("GHC");
  await page.click("#modal .modal-actions button.primary");
  await page.waitForSelector("#overlay.open", { state: "hidden" });

  const ghcAbbrevCellAfter = await page.$eval("#tab-organisations tbody tr td:nth-child(2)", (td) => td.textContent.trim());
  check("the Abbreviation column now shows GHC", ghcAbbrevCellAfter === "GHC");

  console.log("Searching by abbreviation alone (not a substring of the full name)...");
  await page.fill("#search-organisations", "GHC");
  await page.waitForTimeout(50);
  const ghcSearchRows = await page.$$("#tab-organisations tbody tr");
  check("searching \"GHC\" finds it via the abbreviation, even though the name doesn't contain it", ghcSearchRows.length === 1);
  const ghcSearchNameCell = await page.$eval("#tab-organisations tbody tr td:nth-child(1)", (td) => td.textContent.trim());
  check("the abbreviation search match is the right organisation", ghcSearchNameCell === "the Global Health Cluster");

  console.log("Merging a second organisation into it, leaving Abbreviation untouched, and checking GHC survives...");
  await page.fill("#search-organisations", "Asian Disaster Reduction");
  await page.waitForTimeout(50);
  await page.click("#tab-organisations tbody tr");
  await page.waitForSelector("#overlay.open");
  const adrrnNameField = await fieldByLabel("Name");
  const adrrnAbbrevField = await fieldByLabel("Abbreviation");
  const adrrnAbbrevValue = await adrrnAbbrevField.$eval("input[type=text]", (el) => el.value);
  check("ADRRN itself has no abbreviation set (nothing to accidentally carry over)", adrrnAbbrevValue === "");
  await adrrnNameField.$eval("input[type=text]", (el) => (el.value = ""));
  await (await adrrnNameField.$("input[type=text]")).fill("the Global Health Cluster"); // merge, Abbreviation field left blank
  await page.click("#modal .modal-actions button.primary");
  await page.waitForSelector("#overlay.open", { state: "hidden" });

  await page.fill("#search-organisations", "the Global Health Cluster");
  await page.waitForTimeout(50);
  const ghcAbbrevCellAfterMerge = await page.$eval("#tab-organisations tbody tr td:nth-child(2)", (td) => td.textContent.trim());
  check("merging in a blank-abbreviation org didn't blank out GHC's existing abbreviation", ghcAbbrevCellAfterMerge === "GHC");
  const ghcCountCellAfterMerge = await page.$eval("#tab-organisations tbody tr td:nth-child(3)", (td) => td.textContent.trim());
  check("Global Health Cluster now has 6 projects (its original 3 plus ADRRN's 3)", ghcCountCellAfterMerge === "6");

  console.log("Deleting it and confirming the abbreviation is actually gone, not just hidden...");
  await page.click("#tab-organisations tbody tr");
  await page.waitForSelector("#overlay.open");
  await page.click('#modal .modal-actions button:has-text("Delete")'); // global dialog handler accepts the confirm()
  await page.waitForSelector("#overlay.open", { state: "hidden" });

  await page.click('#tab-organisations .toolbar button.primary'); // + Add new
  await page.waitForSelector("#overlay.open");
  await page.fill("#modal .field input[type=text]", "the Global Health Cluster"); // Name is the first text input
  const reAddedProjectsField = await fieldByLabel("Projects");
  await (await reAddedProjectsField.$("input[type=text]")).fill("MapAction Development (2006)");
  await (await reAddedProjectsField.$('button:has-text("Add")')).click();
  await page.click("#modal .modal-actions button.primary");
  await page.waitForSelector("#overlay.open", { state: "hidden" });

  await page.fill("#search-organisations", "the Global Health Cluster");
  await page.waitForTimeout(50);
  const ghcAbbrevCellAfterRecreate = await page.$eval("#tab-organisations tbody tr td:nth-child(2)", (td) => td.textContent.trim());
  check("re-creating the same-named organisation from scratch does not resurrect the deleted abbreviation", ghcAbbrevCellAfterRecreate === "—");

  await browser.close();

  check("no uncaught page errors", consoleErrors.length === 0);
  if (consoleErrors.length) console.error("Console errors:", consoleErrors);

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
