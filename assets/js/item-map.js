// assets/js/item-map.js
// Shared Leaflet setup for pages that plot a filtered list of items: the
// Map viewer and the Webmaps and visualisations index. Both get the same
// basemap, the same clustered blue pins, and the same red star for the
// selected item, so the two maps look and behave alike.
//
// Requires the globals `L` (Leaflet) and `L.markerClusterGroup`
// (leaflet.markercluster), which each layout loads.

import { addBaseLayer } from './map-config.js';

const PIN_FILL = '#0055ff';
const STAR_COLOUR = '#ff0000';
const PIN_RADIUS = 6;
const PIN_RADIUS_HIGHLIGHT = 9;

// Whole-world view used when there is nothing to fit to.
const WORLD_VIEW = [[-55, -175], [75, 175]];

/**
 * Creates the map, basemap and cluster layer inside `el`.
 * @param {string|HTMLElement} el  Map container (or its id).
 * @returns {object} A context object passed to the other functions here.
 */
export function createItemMap(el) {
  const worldBounds = L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180));

  const map = L.map(el, {
    center: [15.0, 10.0],
    zoom: 0,
    zoomControl: true,
    minZoom: 0,
    maxZoom: 11,
    maxBounds: worldBounds,
    maxBoundsViscosity: 1.0,
    worldCopyJump: false
  });

  addBaseLayer(map, { noWrap: false, bounds: worldBounds });

  const cluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 20,
    disableClusteringAtZoom: 2
  }).addTo(map);

  return { map, cluster, stars: [], markersByItem: new Map(), highlighted: null };
}

function starIcon() {
  return L.divIcon({
    html: `<i class="fa-solid fa-star" style="color: ${STAR_COLOUR}; font-size: 18px; -webkit-text-stroke: 1.5px #ffffff; display: block;"></i>`,
    className: 'custom-star-marker',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
}

/**
 * Replaces every pin on the map with one per location of each item.
 * The selected item gets red stars outside the clusters; every other item
 * gets a clustered blue pin.
 *
 * @param {object} ctx      From createItemMap.
 * @param {Array} items     Items with a `locations` array of {lat, lng}.
 * @param {object} options
 * @param {object} [options.selected]  The selected item, if any.
 * @param {Function} [options.sameItem] (a, b) => boolean identity test.
 * @param {Function} [options.label]    item => tooltip text.
 * @param {Function} [options.onSelect] (item, location) => void, when a pin is clicked.
 */
export function renderItemMarkers(ctx, items, options = {}) {
  const {
    selected = null,
    sameItem = (a, b) => a === b,
    label = (item) => item.name,
    onSelect = () => {}
  } = options;
  const { map, cluster } = ctx;

  cluster.clearLayers();
  ctx.stars.forEach((m) => map.removeLayer(m));
  ctx.stars = [];
  ctx.markersByItem = new Map();
  ctx.highlighted = null;

  items.forEach((item) => {
    const isSelected = selected !== null && sameItem(item, selected);
    const markers = [];

    (item.locations || []).forEach((loc) => {
      if (isSelected) {
        const star = L.marker([loc.lat, loc.lng], { icon: starIcon(), zIndexOffset: 5000 });
        star.bindTooltip(label(item), { direction: 'top', offset: [0, -5] });
        star.on('click', () => map.panTo([loc.lat, loc.lng], { animate: true }));
        star.addTo(map);
        ctx.stars.push(star);
        markers.push(star);
        return;
      }

      const pin = L.circleMarker([loc.lat, loc.lng], {
        color: '#ffffff',
        fillColor: PIN_FILL,
        fillOpacity: 1.0,
        radius: PIN_RADIUS,
        weight: 1.5
      });
      pin.bindTooltip(label(item), { direction: 'top', offset: [0, -5] });
      pin.on('click', () => {
        onSelect(item, loc);
        map.panTo([loc.lat, loc.lng], { animate: true });
      });
      cluster.addLayer(pin);
      markers.push(pin);
    });

    ctx.markersByItem.set(item, markers);
  });
}

function setHighlight(ctx, item, on) {
  const markers = ctx.markersByItem.get(item) || [];
  markers.forEach((marker) => {
    if (marker instanceof L.CircleMarker) {
      marker.setRadius(on ? PIN_RADIUS_HIGHLIGHT : PIN_RADIUS);
      marker.setStyle({ weight: on ? 3 : 1.5, color: on ? '#0f0f10' : '#ffffff' });
      if (on) marker.bringToFront();
    }
    // A pin hidden inside a cluster: highlight the cluster bubble instead.
    const parent = ctx.cluster.getVisibleParent(marker);
    if (parent && parent !== marker && parent.getElement && parent.getElement()) {
      parent.getElement().classList.toggle('item-cluster-highlight', on);
    }
    const el = marker.getElement && marker.getElement();
    if (el && !(marker instanceof L.CircleMarker)) el.classList.toggle('item-star-highlight', on);
  });
}

/**
 * Emphasises one item's pins (or the cluster holding them), for example
 * while its card is hovered or focused. Pass null to clear.
 */
export function highlightItem(ctx, item) {
  if (ctx.highlighted) setHighlight(ctx, ctx.highlighted, false);
  ctx.highlighted = item || null;
  if (item) setHighlight(ctx, item, true);
}

/**
 * Fits the view to every location of the given items, or to the whole
 * world when there are none.
 */
export function fitToItems(ctx, items, { maxZoom = 4, padding = [24, 24] } = {}) {
  const { map } = ctx;
  map.invalidateSize();
  const points = items.flatMap((item) => (item.locations || []).map((l) => [l.lat, l.lng]));
  if (points.length === 0) {
    map.fitBounds(WORLD_VIEW, { padding: [0, 0], animate: false, maxZoom: 1 });
    return;
  }
  map.fitBounds(L.latLngBounds(points), { padding, maxZoom, animate: false });
}

/** The Map viewer's fixed whole-world view. */
export function fitWorld(ctx) {
  ctx.map.invalidateSize();
  ctx.map.fitBounds(WORLD_VIEW, { padding: [0, 0], animate: false, maxZoom: 1 });
}
