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

  console.log("Creating a new parent project and resolving an unresolved-parent warning with it...");
  await page.click('#tabs button[data-tab="projects"]');
  await page.fill("#search-projects", "Ebola");
  await page.waitForTimeout(50);
  await page.click("#tab-projects tbody tr");
  await page.waitForSelector("#overlay.open");
  const ebolaBanner = await page.textContent("#modal .warn-msg").catch(() => "");
  check("Ebola shows the unresolved-parent banner before fixing it", ebolaBanner.includes("2014 Ebola response in West Africa"));
  await page.click("#modal .modal-actions button:has-text('Cancel')");
  await page.waitForSelector("#overlay.open", { state: "hidden" });

  // Create the missing parent project.
  await page.fill("#search-projects", "");
  await page.click('#tab-projects .toolbar button.primary');
  await page.waitForSelector("#overlay.open");
  const parentNameField = await fieldByLabel("Name");
  await (await parentNameField.$("input[type=text]")).fill("2014 Ebola response in West Africa");
  const parentLocField = await fieldByLabel("Locations");
  const parentLocInput = await parentLocField.$("input[type=text]");
  await parentLocInput.fill("Liberia");
  await (await parentLocField.$('button:has-text("Add")')).click();
  await page.click("#modal .modal-actions button.primary");
  await page.waitForSelector("#overlay.open", { state: "hidden" });

  // Link Ebola to it and confirm the banner clears immediately.
  await page.fill("#search-projects", "Ebola");
  await page.waitForTimeout(50);
  await page.click("#tab-projects tbody tr");
  await page.waitForSelector("#overlay.open");
  const parentPickerField = await fieldByLabel("Parent project");
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

  console.log("Checking the Parent projects tab shows the new parent with its child...");
  await page.click('#tabs button[data-tab="parents"]');
  await page.fill("#search-parents", "Ebola");
  await page.waitForTimeout(50);
  const parentsRowText = await page.textContent("#tab-parents tbody tr");
  check("parents tab lists the new Ebola parent project", parentsRowText.includes("2014 Ebola response in West Africa"));
  check("parents tab shows the linked child in the Children column", parentsRowText.includes("Ebola") && parentsRowText.split("2014 Ebola response in West Africa")[1].length > 0);

  console.log("Adding a new project from the Parent projects tab (Parent field should be hidden)...");
  await page.fill("#search-parents", "");
  await page.click('#tab-parents .toolbar button.primary'); // + Add new
  await page.waitForSelector("#overlay.open");
  const parentFieldFromTab = await fieldByLabel("Parent project");
  check("Parent project field has no picker when adding from the Parents tab", (await parentFieldFromTab.$("select")) === null);
  const newParentNameField = await fieldByLabel("Name");
  await (await newParentNameField.$("input[type=text]")).fill("Umbrella test project");
  const newParentLocField = await fieldByLabel("Locations");
  await (await newParentLocField.$("input[type=text]")).fill("Liberia");
  await (await newParentLocField.$('button:has-text("Add")')).click();
  await page.click("#modal .modal-actions button.primary");
  await page.waitForSelector("#overlay.open", { state: "hidden" });

  console.log("Confirming it does NOT show in Parent projects yet (it has no children)...");
  await page.fill("#search-parents", "Umbrella");
  await page.waitForTimeout(50);
  const parentsHitsBeforeLink = await page.$$("#tab-parents tbody tr");
  check("Parent projects tab has no row for it before any child links to it", parentsHitsBeforeLink.length === 0);

  console.log("Confirming it DOES show in the Projects tab, as an ordinary individual project...");
  await page.click('#tabs button[data-tab="projects"]');
  await page.fill("#search-projects", "Umbrella");
  await page.waitForTimeout(50);
  const umbrellaInProjects = await page.textContent("#tab-projects tbody tr").catch(() => "");
  check("Projects tab lists the new project while it has no children", umbrellaInProjects.includes("Umbrella test project"));
  await page.click("#tab-projects tbody tr");
  await page.waitForSelector("#overlay.open");
  const umbrellaParentFieldRow = await fieldByLabel("Parent project");
  const umbrellaParentSelect = await umbrellaParentFieldRow.$("select");
  const umbrellaParentValue = umbrellaParentSelect ? await umbrellaParentSelect.evaluate((s) => s.value) : null;
  check("it has the normal Parent field, currently empty", umbrellaParentValue === "");
  await page.click("#modal .modal-actions button:has-text('Cancel')");
  await page.waitForSelector("#overlay.open", { state: "hidden" });

  console.log("Linking a child to it and confirming it now moves into the Parent projects tab...");
  await page.fill("#search-projects", "");
  await page.click('#tab-projects .toolbar button.primary'); // + Add new
  await page.waitForSelector("#overlay.open");
  const childNameField = await fieldByLabel("Name");
  await (await childNameField.$("input[type=text]")).fill("Umbrella child test project");
  const childParentFieldRow = await fieldByLabel("Parent project");
  await (await childParentFieldRow.$("select")).selectOption({ label: "Umbrella test project" });
  const childLocField = await fieldByLabel("Locations");
  await (await childLocField.$("input[type=text]")).fill("Liberia");
  await (await childLocField.$('button:has-text("Add")')).click();
  await page.click("#modal .modal-actions button.primary");
  await page.waitForSelector("#overlay.open", { state: "hidden" });

  await page.click('#tabs button[data-tab="parents"]');
  await page.fill("#search-parents", "Umbrella");
  await page.waitForTimeout(50);
  const umbrellaParentRow = await page.textContent("#tab-parents tbody tr").catch(() => "");
  check("Parent projects tab now lists it, once a child links to it", umbrellaParentRow.includes("Umbrella test project"));
  check("its Children column shows the newly-linked child", umbrellaParentRow.includes("Umbrella child test project"));

  await page.click('#tabs button[data-tab="projects"]');
  await page.fill("#search-projects", "Umbrella");
  await page.waitForTimeout(50);
  // Compare against each row's Name cell (first <td>) specifically - the child
  // row's Parent cell legitimately shows the parent's name as text too, so a
  // whole-row substring check would false-positive on that.
  const umbrellaProjectNames = await page.$$eval("#tab-projects tbody tr td:first-child", (cells) => cells.map((c) => c.textContent));
  check("the parent itself no longer appears in the Projects tab", !umbrellaProjectNames.includes("Umbrella test project"));
  check("the child project still appears in the Projects tab", umbrellaProjectNames.includes("Umbrella child test project"));

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
