// Webmaps and visualisations index: filters, a grid of preview cards that
// link to each case study, and a map in the side column. Filters change the
// cards and the pins together; a pin selects its item in the side panel;
// hovering or focusing a card highlights its pin.

import { loadWebmaps } from './data-adapter.js';
import { initFilterEngine, SORT } from './filter-engine.js';
import { createItemMap, renderItemMarkers, highlightItem, fitToItems } from './item-map.js';

const webmapsPromise = loadWebmaps();

const ICONS = { dashboard: 'fa-chart-column', website: 'fa-globe', webmap: 'fa-map-location-dot' };

let itemMap = null;
let filtered = [];
let selected = null;
let siteBase = '/';
let caseBase = '/webmaps-and-visualisations/';

function assetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return siteBase + path.replace(/^\/+/, '');
}

function caseUrl(item) {
  return `${caseBase}${item.slug}/`;
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

function metaLine(item) {
  return [item.typeLabel, item.year].filter(Boolean).join(' · ');
}

function hasPin(item) {
  return (item.locations || []).length > 0;
}

/* ------------------------------------------------------------------ cards */

function previewNode(item) {
  const wrap = el('div', { class: 'webmap-card__media' });
  if (item.preview.poster) {
    // The thumbnail action writes a 640 pixel copy to <folder>/thumbs/. Use
    // it on the card, and fall back to the full poster until it exists.
    const full = assetUrl(item.preview.poster);
    const thumb = full.replace(/\/([^/]+)$/, '/thumbs/$1');
    const img = el('img', {
      src: thumb,
      alt: '',
      loading: 'lazy',
      decoding: 'async',
      width: 1280,
      height: 800
    });
    img.addEventListener('error', () => { if (img.src !== new URL(full, location.href).href) img.src = full; }, { once: true });
    wrap.appendChild(img);
  } else {
    wrap.classList.add('webmap-card__media--empty');
    wrap.appendChild(el('i', { class: `fa-solid ${ICONS[item.format] || 'fa-display'}`, 'aria-hidden': 'true' }));
  }
  const live = item.access === 'live';
  wrap.appendChild(el('span', {
    class: `webmap-card__access${live ? '' : ' webmap-card__access--screens'}`,
    text: live ? 'Live' : 'Screenshots only'
  }));
  return wrap;
}

function cardNode(item) {
  const link = el('a', { class: 'webmap-card', href: caseUrl(item) }, [
    previewNode(item),
    el('div', { class: 'webmap-card__body' }, [
      el('p', { class: 'webmap-card__meta', text: metaLine(item) }),
      el('h2', { class: 'webmap-card__title', text: item.name }),
      el('p', { class: 'webmap-card__where' }, [el('span', { text: 'Where: ' }), item.where]),
      item.summary ? el('p', { class: 'webmap-card__desc', text: item.summary }) : null,
      el('span', { class: 'webmap-card__cta', text: 'Read the case study' })
    ])
  ]);

  const on = () => itemMap && highlightItem(itemMap, item);
  const off = () => itemMap && highlightItem(itemMap, null);
  link.addEventListener('mouseenter', on);
  link.addEventListener('mouseleave', off);
  link.addEventListener('focus', on);
  link.addEventListener('blur', off);

  return el('li', {}, link);
}

function renderCards() {
  const grid = document.getElementById('webmaps-grid');
  grid.replaceChildren(...filtered.map(cardNode));
  document.getElementById('webmaps-empty').hidden = filtered.length > 0;
  const count = filtered.length;
  document.getElementById('webmaps-count').textContent =
    count === 1 ? 'Showing 1 item' : `Showing ${count} items`;
}

/* ------------------------------------------------------ side column */

function renderSelected() {
  const panel = document.getElementById('webmaps-selected');
  if (!selected) {
    panel.replaceChildren();
    return;
  }
  const meta = [selected.typeLabel, selected.where, selected.year].filter(Boolean).join(' · ');
  const links = el('ul', { class: 'webmaps-selected__links' }, [
    el('li', {}, el('a', { href: caseUrl(selected), text: 'Read the case study' })),
    selected.access === 'live' && selected.liveUrl
      ? el('li', {}, el('a', { href: selected.liveUrl, target: '_blank', rel: 'noopener' }, [
          'Open the live version',
          el('span', { class: 'visually-hidden', text: ' (opens in a new tab)' }),
          el('i', { class: 'fa-solid fa-arrow-up-right-from-square', 'aria-hidden': 'true' })
        ]))
      : null
  ]);
  panel.replaceChildren(
    el('p', { class: 'webmaps-selected__label', text: 'Selected' }),
    el('h2', { class: 'webmaps-selected__title', text: selected.name }),
    el('p', { class: 'webmaps-selected__meta', text: meta }),
    selected.summary ? el('p', { class: 'webmaps-selected__desc', text: selected.summary }) : null,
    links
  );
}

function renderUnplaced() {
  const box = document.getElementById('webmaps-unplaced');
  const list = document.getElementById('webmaps-unplaced-list');
  const unplaced = filtered.filter((item) => !hasPin(item));
  box.hidden = unplaced.length === 0;
  list.replaceChildren(...unplaced.map((item) => {
    const btn = el('button', {
      type: 'button',
      class: 'webmaps-unplaced__btn',
      'aria-pressed': selected === item ? 'true' : 'false',
      text: item.name
    });
    btn.addEventListener('click', () => select(item));
    return el('li', {}, btn);
  }));
}

function renderMarkers() {
  if (!itemMap) return;
  renderItemMarkers(itemMap, filtered, {
    selected,
    label: (item) => item.name,
    onSelect: (item) => select(item)
  });
}

function select(item) {
  selected = item;
  renderSelected();
  renderMarkers();
  renderUnplaced();
}

/* ----------------------------------------------------------- filters */

function handleFiltered(results) {
  filtered = results;
  if (!selected || !filtered.includes(selected)) selected = filtered[0] || null;
  renderCards();
  renderSelected();
  renderMarkers();
  renderUnplaced();
  if (itemMap) fitToItems(itemMap, filtered.filter(hasPin));
}

document.addEventListener('DOMContentLoaded', async () => {
  const page = document.getElementById('webmaps-page');
  siteBase = page.dataset.siteBase || '/';
  caseBase = page.dataset.caseBase || caseBase;

  const mapNode = document.getElementById('webmaps-map');
  if (mapNode && window.L && L.markerClusterGroup) itemMap = createItemMap(mapNode);

  const items = await webmapsPromise;

  initFilterEngine(items, handleFiltered, {
    sortEl: 'wm-sort',
    resetEl: 'reset-filters',
    fields: [
      { key: 'type', prop: 'typeLabel', elId: 'wm-type' },
      { key: 'country', elId: 'wm-country', arrayValued: true },
      { key: 'theme', prop: 'themes', elId: 'wm-theme', arrayValued: true },
      { key: 'year', elId: 'wm-year', optionOrder: 'desc-numeric' }
    ],
    sort: { alpha: SORT.alpha, theme: SORT.byFirstOf('themes'), yearmonth: SORT.yearmonth }
  });
});
