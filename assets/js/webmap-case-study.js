// Case study page for one webmap record. Fills in everything that lives in
// assets/data/maps.json (type and year line, summary, recorded clip,
// screenshots, facts panel, live button, previous and next links). The
// prose sections are rendered by Jekyll from the page's front matter.

import { loadWebmaps } from './data-adapter.js';
import { SORT } from './filter-engine.js';

const webmapsPromise = loadWebmaps();

let siteBase = '/';
let caseBase = '/webmaps-and-visualisations/';

function assetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return siteBase + path.replace(/^\/+/, '');
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'text') node.textContent = value;
    else if (key === 'class') node.className = value;
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of [].concat(children)) {
    if (child) node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* -------------------------------------------------------------- hero */

function renderHero(item) {
  const hero = document.getElementById('cs-hero');
  const { poster, clipWebm, clipMp4 } = item.preview;

  if (clipWebm || clipMp4) {
    const video = el('video', {
      muted: true,
      loop: true,
      playsinline: true,
      controls: true,
      preload: 'none',
      poster: poster ? assetUrl(poster) : null,
      'aria-label': `Recording of ${item.name} in use`
    }, [
      clipWebm ? el('source', { src: assetUrl(clipWebm), type: 'video/webm' }) : null,
      clipMp4 ? el('source', { src: assetUrl(clipMp4), type: 'video/mp4' }) : null
    ]);
    // The muted attribute alone is not always honoured once the element is
    // created from script, so set the property too.
    video.muted = true;
    hero.appendChild(video);

    if (prefersReducedMotion()) {
      // Show the poster with a play button instead of autoplaying.
      const play = el('button', { type: 'button', class: 'cs-hero__play', 'aria-label': 'Play the recording' },
        el('i', { class: 'fa-solid fa-play', 'aria-hidden': 'true' }));
      play.addEventListener('click', () => {
        video.play();
        video.focus();
      });
      video.addEventListener('play', () => play.remove());
      hero.appendChild(play);
    } else {
      video.autoplay = true;
      video.preload = 'auto';
      video.play().catch(() => {});
    }
    if (item.access !== 'live') {
      hero.appendChild(el('figcaption', { text: 'Recorded walkthrough' }));
    }
    hero.hidden = false;
    return;
  }

  if (poster) {
    hero.appendChild(el('img', { src: assetUrl(poster), alt: `Screenshot of ${item.name}`, width: 1280, height: 800 }));
    hero.hidden = false;
  }
}

/* ------------------------------------------------------- screenshots */

function renderScreenshots(item) {
  const shots = item.preview.screenshots;
  if (!shots.length) return;
  const grid = document.getElementById('cs-screens-grid');
  grid.replaceChildren(...shots.map((shot) => el('li', {}, el('figure', {}, [
    el('a', { href: assetUrl(shot.src) },
      el('img', {
        src: assetUrl(shot.src),
        alt: shot.caption || `Screenshot of ${item.name}`,
        loading: 'lazy',
        decoding: 'async'
      })),
    shot.caption ? el('figcaption', { text: shot.caption }) : null
  ]))));
  document.getElementById('cs-screens').hidden = false;
}

/* ------------------------------------------------------- facts panel */

function renderFacts(item) {
  const panel = document.getElementById('cs-facts');
  const noteTemplate = document.getElementById('cs-access-note');
  const parts = [];

  if (item.access === 'live' && item.liveUrl) {
    parts.push(el('a', { class: 'cs-live-btn', href: item.liveUrl, target: '_blank', rel: 'noopener' }, [
      'Open the live version',
      el('span', { class: 'visually-hidden', text: ' (opens in a new tab)' }),
      el('i', { class: 'fa-solid fa-arrow-up-right-from-square', 'aria-hidden': 'true' })
    ]));
    parts.push(el('p', {
      class: 'cs-live-note',
      text: item.embeddable === false
        ? 'It opens in a new tab because it cannot be shown inside other sites.'
        : 'It opens in a new tab.'
    }));
  } else {
    const note = el('div', { class: 'cs-access-note' });
    if (noteTemplate) note.appendChild(noteTemplate.content.cloneNode(true));
    else note.textContent = 'There is no public live version of this item.';
    parts.push(note);
  }

  const rows = [
    ['Year', item.year],
    ['Where', item.where],
    ['Programme or client', item.facts.programme],
    ['Data', item.facts.data],
    ['Tools', item.facts.tools],
    ['Role', item.facts.role],
    ['Status', item.facts.status]
  ].filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '');

  if (rows.length) {
    parts.push(el('dl', {}, rows.flatMap(([label, value]) => [
      el('dt', { text: label }),
      el('dd', { text: String(value) })
    ])));
  }

  if (noteTemplate) noteTemplate.remove();
  panel.replaceChildren(...parts);
}

/* ------------------------------------------------- previous and next */

function renderPager(item, items) {
  const ordered = items.filter((x) => x.slug).sort(SORT.yearmonth);
  const index = ordered.indexOf(item);
  if (index === -1 || ordered.length < 2) return;
  const prev = ordered[index - 1];
  const next = ordered[index + 1];
  const pager = document.getElementById('cs-pager');

  const link = (target, label, cls) => el('a', { class: cls, href: `${caseBase}${target.slug}/` }, [
    el('span', { class: 'cs-pager__label', text: label }),
    el('span', { class: 'cs-pager__title', text: target.name })
  ]);

  pager.replaceChildren(
    prev ? link(prev, 'Previous', 'cs-pager__prev') : null,
    next ? link(next, 'Next', 'cs-pager__next') : null
  );
  pager.hidden = false;
}

/* --------------------------------------------------------------- run */

document.addEventListener('DOMContentLoaded', async () => {
  const page = document.getElementById('cs-page');
  if (!page) return;
  siteBase = page.dataset.siteBase || '/';
  caseBase = page.dataset.caseBase || caseBase;

  const items = await webmapsPromise;
  const item = items.find((x) => x.slug === page.dataset.slug);
  if (!item) return;

  document.getElementById('cs-meta').textContent = [item.typeLabel, item.year].filter(Boolean).join(' · ');
  document.getElementById('cs-title').textContent = item.name;
  if (item.summary) {
    const summary = document.getElementById('cs-summary');
    summary.textContent = item.summary;
    summary.hidden = false;
  }

  renderHero(item);
  renderScreenshots(item);
  renderFacts(item);
  renderPager(item, items);
});
