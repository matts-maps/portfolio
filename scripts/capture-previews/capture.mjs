#!/usr/bin/env node
// scripts/capture-previews/capture.mjs
//
// Captures real preview media for each webmap in assets/data/maps.json by
// opening its live URL in a headless browser:
//
//   assets/images/webmaps/<slug>/poster.jpg     1280 pixels wide, first view
//   assets/images/webmaps/<slug>/shot-1.jpg     three screenshots, scrolling
//   assets/images/webmaps/<slug>/shot-2.jpg     down one screen each time
//   assets/images/webmaps/<slug>/shot-3.jpg
//   assets/images/webmaps/<slug>/clip.webm      about 10 seconds, scrolling
//   assets/images/webmaps/<slug>/clip.mp4       slowly down and back up
//
// The clips need ffmpeg on the PATH to be compressed to under 3 megabytes
// and converted to mp4. Without ffmpeg the posters and screenshots are still
// made and the clips are skipped, with a message saying so.
//
// Items whose interaction matters (filters being changed, a game being
// played) should be recorded by hand instead. See README.md.
//
// Usage (from the repository root):
//   node scripts/capture-previews/capture.mjs                 every webmap with a live URL
//   node scripts/capture-previews/capture.mjs ukraine-damaged-buildings country-extremes
//   node scripts/capture-previews/capture.mjs --no-clip       posters and screenshots only
//   node scripts/capture-previews/capture.mjs --write-data    also set the preview paths in maps.json

import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const MAPS_JSON = path.join(REPO_ROOT, "assets", "data", "maps.json");
const OUT_ROOT = path.join(REPO_ROOT, "assets", "images", "webmaps");
const TMP = path.join(__dirname, ".tmp");

const WIDTH = 1280;
const HEIGHT = 800;
const CLIP_SECONDS = 10;
const CLIP_MAX_BYTES = 3 * 1024 * 1024;
const SETTLE_MS = 4000; // time for maps, tiles and charts to draw after load

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const onlySlugs = args.filter((a) => !a.startsWith("--"));
const withClip = !flags.has("--no-clip");
const writeData = flags.has("--write-data");

function hasFfmpeg() {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function sizeMb(file) {
  return (fs.statSync(file).size / 1024 / 1024).toFixed(2);
}

async function settle(page) {
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(SETTLE_MS);
}

// Scrolls the page, or the largest scrollable element when the page itself
// does not scroll (common for dashboards), by `dy` pixels.
async function scrollBy(page, dy) {
  await page.evaluate((delta) => {
    const doc = document.scrollingElement || document.documentElement;
    if (doc.scrollHeight > window.innerHeight + 10) {
      window.scrollBy({ top: delta, behavior: "instant" });
      return;
    }
    const candidates = [...document.querySelectorAll("*")].filter((el) => {
      const style = getComputedStyle(el);
      return /(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 10;
    });
    candidates.sort((a, b) => b.clientHeight * b.clientWidth - a.clientHeight * a.clientWidth);
    if (candidates[0]) candidates[0].scrollBy({ top: delta, behavior: "instant" });
  }, dy);
}

async function captureStills(browser, item, outDir) {
  const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(item.liveUrl, { waitUntil: "load", timeout: 60000 });
  await settle(page);

  await page.screenshot({ path: path.join(outDir, "poster.jpg"), type: "jpeg", quality: 82 });
  for (let i = 1; i <= 3; i += 1) {
    await page.screenshot({ path: path.join(outDir, `shot-${i}.jpg`), type: "jpeg", quality: 82 });
    await scrollBy(page, HEIGHT - 120);
    await page.waitForTimeout(1500);
  }
  await context.close();
}

async function captureClip(browser, item, outDir) {
  fs.rmSync(TMP, { recursive: true, force: true });
  fs.mkdirSync(TMP, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    recordVideo: { dir: TMP, size: { width: WIDTH, height: HEIGHT } }
  });
  const page = await context.newPage();
  await page.goto(item.liveUrl, { waitUntil: "load", timeout: 60000 });
  await settle(page);

  // Mark where the useful part of the recording starts (after loading).
  const startedAt = Date.now();
  const recordingStart = (await page.evaluate(() => performance.now())) / 1000;
  const steps = 20;
  for (let i = 0; i < steps; i += 1) {
    await scrollBy(page, i < steps / 2 ? 60 : -60);
    await page.waitForTimeout((CLIP_SECONDS * 1000) / steps);
  }
  const elapsed = (Date.now() - startedAt) / 1000;
  await context.close();

  const raw = fs.readdirSync(TMP).find((f) => f.endsWith(".webm"));
  if (!raw) throw new Error("no recording was written");
  const rawPath = path.join(TMP, raw);
  const skip = Math.max(0, recordingStart).toFixed(2);
  const length = Math.min(elapsed, CLIP_SECONDS + 1).toFixed(2);

  const webm = path.join(outDir, "clip.webm");
  const mp4 = path.join(outDir, "clip.mp4");
  const common = ["-y", "-loglevel", "error", "-ss", skip, "-i", rawPath, "-t", length, "-an", "-vf", `scale=${WIDTH}:-2`];

  for (const crf of [36, 42, 48]) {
    execFileSync("ffmpeg", [...common, "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", String(crf), "-row-mt", "1", webm]);
    if (fs.statSync(webm).size <= CLIP_MAX_BYTES) break;
  }
  for (const crf of [28, 32, 36]) {
    execFileSync("ffmpeg", [...common, "-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4]);
    if (fs.statSync(mp4).size <= CLIP_MAX_BYTES) break;
  }
  fs.rmSync(TMP, { recursive: true, force: true });
  return { webm, mp4 };
}

async function main() {
  const maps = JSON.parse(fs.readFileSync(MAPS_JSON, "utf8"));
  const targets = maps
    .filter((m) => m.kind === "webmap" && m.slug && m.liveUrl)
    .filter((m) => onlySlugs.length === 0 || onlySlugs.includes(m.slug));

  if (targets.length === 0) {
    console.error("No webmaps to capture. Check the slugs, and that each has a liveUrl in maps.json.");
    process.exit(1);
  }

  const ffmpeg = withClip && hasFfmpeg();
  if (withClip && !ffmpeg) {
    console.warn("ffmpeg was not found, so clips will be skipped. Posters and screenshots will still be made.\n");
  }

  const browser = await chromium.launch();
  let failures = 0;

  for (const item of targets) {
    const outDir = path.join(OUT_ROOT, item.slug);
    fs.mkdirSync(outDir, { recursive: true });
    console.log(`${item.slug}: ${item.liveUrl}`);
    try {
      await captureStills(browser, item, outDir);
      console.log("  poster.jpg and shot-1 to shot-3.jpg written");
      let clips = null;
      if (ffmpeg) {
        clips = await captureClip(browser, item, outDir);
        console.log(`  clip.webm (${sizeMb(clips.webm)} MB) and clip.mp4 (${sizeMb(clips.mp4)} MB) written`);
      }

      if (writeData) {
        const rel = `assets/images/webmaps/${item.slug}`;
        const record = maps.find((m) => m.id === item.id);
        const existing = record.preview || {};
        const captions = (existing.screenshots || []).map((s) => s.caption || null);
        record.preview = {
          poster: `${rel}/poster.jpg`,
          clipWebm: clips ? `${rel}/clip.webm` : existing.clipWebm || null,
          clipMp4: clips ? `${rel}/clip.mp4` : existing.clipMp4 || null,
          screenshots: [1, 2, 3].map((n, i) => ({ src: `${rel}/shot-${n}.jpg`, caption: captions[i] || null }))
        };
      }
    } catch (err) {
      failures += 1;
      console.error(`  failed: ${err.message}`);
    }
  }

  await browser.close();

  if (writeData) {
    fs.writeFileSync(MAPS_JSON, JSON.stringify(maps, null, 2) + "\n");
    console.log("\nPreview paths written to assets/data/maps.json. Add screenshot captions in the data editor.");
  }

  console.log(failures ? `\n${failures} item(s) failed.` : "\nDone. Look through every image before committing.");
  process.exit(failures ? 1 : 0);
}

main();
