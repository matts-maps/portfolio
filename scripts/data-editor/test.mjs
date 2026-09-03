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
  await page.setInputFiles("#file-locations", path.join(FIXTURES, "locations.json"));
  await page.setInputFiles("#file-projects", path.join(FIXTURES, "projects.json"));
  await page.setInputFiles("#file-maps", path.join(FIXTURES, "maps.json"));
  await page.click("#btn-load-fallback");
  await page.waitForSelector("#tabs button.active");

  const locCount = await page.textContent("#count-locations");
  const projCount = await page.textContent("#count-projects");
  const parentCount = await page.textContent("#count-parents");
  const mapCount = await page.textContent("#count-maps");
  check("locations count is (93)", locCount.trim() === "(93)");
  check("projects count is (64)", projCount.trim() === "(64)");
  check("parent projects count is (0) - none of the fixture data has a linked parent yet", parentCount.trim() === "(0)");
  check("maps count is (60)", mapCount.trim() === "(60)");

  console.log("Checking issues panel picks up known warnings...");
  await page.click("#btn-validate");
  await page.waitForSelector("#issues-panel.open");
  const issuesText = await page.textContent("#issues-list");
  check("issues panel mentions unresolved parent", issuesText.includes("Unresolved parent reference"));
  check("no hard errors on pristine data", !/\b0 error/.test(issuesText) === false || issuesText.includes("0 error(s)"));
  await page.click("#btn-close-issues");

  console.log("Opening an existing project and checking fields populate...");
  await page.click('#tabs button[data-tab="projects"]');
  await page.fill("#search-projects", "Impact of Covid-19");
  await page.waitForTimeout(50);
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

  const locField0 = await fieldByLabel("Locations");
  const chipCount = await locField0.$$eval(".chip", (nodes) => nodes.length);
  check("location chips rendered (8 countries)", chipCount === 8);

  console.log("Editing that project (add a location, change description) and saving...");
  const nameField = await fieldByLabel("Name");
  await nameField.$eval("input[type=text]", (el) => (el.value = "")); // clear first
  await (await nameField.$("input[type=text]")).fill("Impact of Covid-19 visualisations (edited)");

  const locField = await fieldByLabel("Locations");
  const locInput = await locField.$("input[type=text]");
  await locInput.fill("Iraq");
  const addBtn = await locField.$('button:has-text("Add")');
  await addBtn.click();
  await page.click("#modal .modal-actions button.primary");
  await page.waitForSelector("#overlay.open", { state: "hidden" });

  const statusText = await page.textContent("#status");
  check("status shows unsaved changes after edit", statusText.includes("Unsaved"));

  console.log("Adding a brand new location...");
  await page.click('#tabs button[data-tab="locations"]');
  await page.click('#tab-locations .toolbar button.primary'); // + Add new
  await page.waitForSelector("#overlay.open");
  await page.fill("#modal .field input[type=text]", "Testland"); // name field
  const latInputs = await page.$$("#modal input[type=number]");
  await latInputs[0].fill("12.34");
  await latInputs[1].fill("56.78");
  await page.click("#modal .modal-actions button.primary");
  await page.waitForSelector("#overlay.open", { state: "hidden" });
  const newLocCount = await page.textContent("#count-locations");
  check("location count incremented after add", newLocCount.trim() === "(94)");

  console.log("Triggering Save and capturing the downloaded zip...");
  const downloadPromise = page.waitForEvent("download");
  await page.click("#btn-save");
  const download = await downloadPromise;
  const outDir = path.join(__dirname, "test-output");
  fs.mkdirSync(outDir, { recursive: true });
  const zipPath = path.join(outDir, "export.zip");
  await download.saveAs(zipPath);
  check("save produced exactly one zip download", download.suggestedFilename() === "fantail-data-export.zip");

  const { execSync } = await import("node:child_process");
  execSync(`unzip -o -q "${zipPath}" -d "${outDir}"`);
  const savedFiles = {
    "locations.json": path.join(outDir, "locations.json"),
    "projects.json": path.join(outDir, "projects.json"),
    "maps.json": path.join(outDir, "maps.json"),
  };
  check("zip contains all three json files", Object.values(savedFiles).every((p) => fs.existsSync(p)));

  const savedLocations = JSON.parse(fs.readFileSync(savedFiles["locations.json"], "utf8"));
  const savedProjects = JSON.parse(fs.readFileSync(savedFiles["projects.json"], "utf8"));
  const savedMaps = JSON.parse(fs.readFileSync(savedFiles["maps.json"], "utf8"));

  check("saved locations count is 94", savedLocations.length === 94);
  check("saved projects count is still 64 (edited, not added)", savedProjects.length === 64);
  check("new Testland location present", savedLocations.some((l) => l.name === "Testland" && l.lat === 12.34 && l.lng === 56.78));
  const gimac = savedProjects.find((p) => p.name.startsWith("Impact of Covid-19"));
  check("GIMAC project name edit persisted", gimac.name === "Impact of Covid-19 visualisations (edited)");
  check("GIMAC project now has 9 locations (Iraq added)", gimac.locationIds.length === 9);
  check("GIMAC locationIds still all resolve", gimac.locationIds.every((id) => savedLocations.some((l) => l.id === id)));

  console.log("Editing a webmap (kind switch, links editor)...");
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
  await page.click("#modal .modal-actions button.primary");
  await page.waitForSelector("#overlay.open", { state: "hidden" });

  console.log("Deleting the newly-added Testland location...");
  await page.click('#tabs button[data-tab="locations"]');
  await page.fill("#search-locations", "Testland");
  await page.waitForTimeout(50);
  await page.click("#tab-locations tbody tr");
  await page.waitForSelector("#overlay.open");
  await page.click('#modal .modal-actions button:has-text("Delete")'); // global dialog handler accepts the confirm()
  await page.waitForSelector("#overlay.open", { state: "hidden" });
  const afterDeleteCount = await page.textContent("#count-locations");
  check("location count back to 93 after delete", afterDeleteCount.trim() === "(93)");

  console.log("Final save with the webmap link added...");
  const finalDownload = page.waitForEvent("download");
  await page.click("#btn-save");
  const finalDl = await finalDownload;
  const finalZip = path.join(outDir, "export2.zip");
  await finalDl.saveAs(finalZip);
  execSync(`unzip -o -q "${finalZip}" -d "${outDir}"`);
  const finalMaps = JSON.parse(fs.readFileSync(path.join(outDir, "maps.json"), "utf8"));
  const editedWebmap = finalMaps.find((m) => (m.links || []).some((l) => l.url === "https://example.com/test"));
  check("webmap link edit persisted through a second save", !!editedWebmap);
  const finalLocations = JSON.parse(fs.readFileSync(path.join(outDir, "locations.json"), "utf8"));
  check("deleted Testland location is gone from final export", !finalLocations.some((l) => l.name === "Testland"));

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
  const parentLocField = await fieldByLabel("Locations");
  await (await parentLocField.$("input[type=text]")).fill("Liberia");
  await (await parentLocField.$('button:has-text("Add")')).click();
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
    const removeBtn = await page.$('#modal .chips .chip button');
    if (!removeBtn) break;
    const fieldEl = await removeBtn.evaluateHandle((btn) => btn.closest(".field"));
    const labelText = await fieldEl.evaluate((f) => f.querySelector("label")?.textContent || "");
    if (!labelText.startsWith("Locations")) break;
    await removeBtn.click();
    removed += 1;
  }
  await page.click("#modal .modal-actions button.primary");
  await page.waitForSelector("#overlay.open", { state: "hidden" });
  check("removed at least one location chip", removed > 0);

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
  const mapActionCountCell = await page.$eval("#tab-organisations tbody tr td:nth-child(2)", (td) => td.textContent.trim());
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
  const whoCountCell = await page.$eval("#tab-organisations tbody tr td:nth-child(2)", (td) => td.textContent.trim());
  check("WHO's project count cell reads 6 (its original 3 plus the merged-in 3)", whoCountCell === "6");

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
