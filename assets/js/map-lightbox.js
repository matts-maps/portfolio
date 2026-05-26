// assets/js/map-lightbox.js

let mapCurrentList = [];
let mapCurrentIndex = 0;

export function setMapLightboxList(list) {
  mapCurrentList = list;
}

export function openMapLightbox(item, index = 0) {
  mapCurrentIndex = index;

  const box = document.getElementById("map-lightbox");
  const img = document.getElementById("map-lightbox-img");
  const caption = document.getElementById("map-lightbox-caption");
  const base = box.dataset.baseurl || "";

  const path = item.file.startsWith("/")
    ? `${base}${item.file}`
    : `${base}/${item.file}`;

  img.src = path;
  img.alt = item.name || "";

  const parts = [];
  if (item.location && item.country !== "Multiple") {
    parts.push(`${item.location}, ${item.country}`);
  } else if (item.country && item.country !== "Multiple") {
    parts.push(item.country);
  }
  if (item.disaster && item.disaster !== "None") {
    parts.push(item.disaster);
  }
  parts.push(item.year);

  caption.innerHTML = `<strong>${item.name}</strong><br>${parts.join(" · ")}`;

  box.classList.remove("hidden");

  img.onload = () => fitToScreen();
}

/* --------------------------------------------------
   ELEMENTS
-------------------------------------------------- */

const box = document.getElementById("map-lightbox");
const viewer = document.getElementById("map-lightbox-viewer");
const img = document.getElementById("map-lightbox-img");
const caption = document.getElementById("map-lightbox-caption");

const zoomInBtn = document.getElementById("map-zoom-in");
const zoomOutBtn = document.getElementById("map-zoom-out");
const resetBtn = document.getElementById("map-zoom-reset");
const btnPrev = document.getElementById("map-lightbox-prev");
const btnNext = document.getElementById("map-lightbox-next");
const btnClose = document.getElementById("map-lightbox-close");

/* --------------------------------------------------
   PAN + ZOOM STATE
-------------------------------------------------- */

let scale = 1;
let posX = 0;
let posY = 0;
let startX = 0;
let startY = 0;
let isPanning = false;

function applyTransform() {
  img.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
}

function fitToScreen() {
  const vw = viewer.clientWidth;
  const vh = viewer.clientHeight;

  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  if (!iw || !ih) return;

  const scaleX = vw / iw;
  const scaleY = vh / ih;
  scale = Math.min(scaleX, scaleY);

  posX = (vw - iw * scale) / 2;
  posY = (vh - ih * scale) / 2;

  applyTransform();
}

/* --------------------------------------------------
   CLOSE
-------------------------------------------------- */

if (btnClose) btnClose.onclick = () => box.classList.add("hidden");

document.addEventListener("keydown", e => {
  if (e.key === "Escape") box.classList.add("hidden");
});

box.addEventListener("click", e => {
  if (e.target === box) box.classList.add("hidden");
});

/* --------------------------------------------------
   PAN
-------------------------------------------------- */

viewer.addEventListener("mousedown", e => {
  isPanning = true;
  startX = e.clientX - posX;
  startY = e.clientY - posY;
});

viewer.addEventListener("mouseup", () => isPanning = false);
viewer.addEventListener("mouseleave", () => isPanning = false);

viewer.addEventListener("mousemove", e => {
  if (!isPanning) return;

  posX = e.clientX - startX;
  posY = e.clientY - startY;

  applyTransform();
});

/* --------------------------------------------------
   SCROLL ZOOM
-------------------------------------------------- */

viewer.addEventListener("wheel", e => {
  e.preventDefault();

  const zoomIntensity = 0.1;
  const delta = e.deltaY < 0 ? 1 : -1;

  const oldScale = scale;
  scale += delta * zoomIntensity;
  scale = Math.min(Math.max(scale, 0.1), 8);

  const rect = viewer.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  posX = mx - (mx - posX) * (scale / oldScale);
  posY = my - (my - posY) * (scale / oldScale);

  applyTransform();
}, { passive: false });

/* --------------------------------------------------
   ZOOM BUTTONS
-------------------------------------------------- */

if (zoomInBtn) {
  zoomInBtn.onclick = () => {
    const rect = viewer.getBoundingClientRect();
    const mx = rect.left + rect.width / 2;
    const my = rect.top + rect.height / 2;

    const oldScale = scale;
    scale = Math.min(scale + 0.2, 8);

    const vx = mx - rect.left;
    const vy = my - rect.top;

    posX = vx - (vx - posX) * (scale / oldScale);
    posY = vy - (vy - posY) * (scale / oldScale);

    applyTransform();
  };
}

if (zoomOutBtn) {
  zoomOutBtn.onclick = () => {
    const rect = viewer.getBoundingClientRect();
    const mx = rect.left + rect.width / 2;
    const my = rect.top + rect.height / 2;

    const oldScale = scale;
    scale = Math.max(scale - 0.2, 0.1);

    const vx = mx - rect.left;
    const vy = my - rect.top;

    posX = vx - (vx - posX) * (scale / oldScale);
    posY = vy - (vy - posY) * (scale / oldScale);

    applyTransform();
  };
}

if (resetBtn) resetBtn.onclick = () => fitToScreen();

/* --------------------------------------------------
   PREV / NEXT
-------------------------------------------------- */

function navigate(direction) {
  if (!mapCurrentList.length) return;

  mapCurrentIndex =
    (mapCurrentIndex + direction + mapCurrentList.length) %
    mapCurrentList.length;

  openMapLightbox(mapCurrentList[mapCurrentIndex], mapCurrentIndex);
}

if (btnPrev) btnPrev.onclick = () => navigate(-1);
if (btnNext) btnNext.onclick = () => navigate(1);
