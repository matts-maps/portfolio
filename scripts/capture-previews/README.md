# Capture previews

Makes the poster, screenshots and short clip for each item on the Webmaps and
visualisations pages by opening its live version in a headless browser. Every
file is a real capture of the live item.

Output goes to `assets/images/webmaps/<slug>/`:

| File | What it is |
| --- | --- |
| `poster.jpg` | First view, 1280 pixels wide. Used on the index card and as the video poster. |
| `shot-1.jpg` to `shot-3.jpg` | Three screenshots, scrolling down one screen each time. |
| `clip.webm`, `clip.mp4` | About 10 seconds, 1280 pixels wide, under 3 megabytes, no sound. |

This folder is excluded from the Jekyll build, like the rest of `scripts/`.

## One-off setup

Use PowerShell or Command Prompt, from the repository folder
(`H:\github\portfolio`).

1. Install the script's one dependency and the browser it drives:

   ```
   cd scripts\capture-previews
   npm install
   npx playwright install chromium
   cd ..\..
   ```

2. For clips, install ffmpeg and open a new terminal afterwards so it is on
   the PATH:

   ```
   winget install --id Gyan.FFmpeg -e
   ```

   Check it with `ffmpeg -version`. Without ffmpeg the script still makes the
   posters and screenshots and says it skipped the clips.

## Running it

From the repository folder:

```
node scripts\capture-previews\capture.mjs
```

That captures every webmap in `assets/data/maps.json` that has a slug and a
live URL. Other forms:

```
node scripts\capture-previews\capture.mjs ukraine-damaged-buildings
node scripts\capture-previews\capture.mjs --no-clip
node scripts\capture-previews\capture.mjs --write-data
```

- Name one or more slugs to capture only those.
- `--no-clip` makes posters and screenshots only.
- `--write-data` also writes the poster, clip and screenshot paths into
  `assets/data/maps.json`, keeping any captions already there. Without it, set
  the paths in the data editor (**Fill media paths from slug**, then add the
  screenshots).

Afterwards, look through every image and clip before committing. Add a
caption to each screenshot in the data editor; captions are also used as the
image's alt text.

## Items to record by hand

The script only loads each page and scrolls. These items need a manual
recording because the interaction is the point, so record them yourself (for
example with the Windows Snipping Tool's screen recording or OBS) at 1280
pixels wide, trim to about 10 seconds, and save over `clip.webm` and
`clip.mp4`:

- **Ukraine damaged buildings dashboard**: changing the filters and watching
  the charts and map update.
- **Country extremes**: playing a round of one of the games.
- **Humanitarian and environmental impact mapping to the La Soufrière volcanic
  eruption**: an ArcGIS web scene, which needs panning and tilting to show
  anything, and loads slowly in a headless browser.
- **Community Insights for COVID-19 Dashboard**: a Google Sites page; check
  the automatic poster is not just the site header or a cookie notice.

To convert a manual recording (here `recording.mp4`) to both formats at the
right size:

```
ffmpeg -i recording.mp4 -t 10 -an -vf scale=1280:-2 -c:v libvpx-vp9 -b:v 0 -crf 40 clip.webm
ffmpeg -i recording.mp4 -t 10 -an -vf scale=1280:-2 -c:v libx264 -crf 30 -pix_fmt yuv420p -movflags +faststart clip.mp4
```

If either file is over 3 megabytes, raise the `-crf` number and run it again.
