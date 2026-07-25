let lightboxList = [];
let currentIndex = 0;

// Grab layout elements matching image-lightbox.html structure
let lightbox, lightboxImg, lightboxTitle, lightboxDesc, closeBtn, prevBtn, nextBtn, resetBtn;

// --- ZOOM & PAN STATE VARIABLES ---
let scale = 1;
let isDragging = false;
let startX = 0;
let startY = 0;
let translateX = 0;
let translateY = 0;

const MIN_SCALE = 1;
const MAX_SCALE = 5;

// --- TOUCH STATE (pinch-to-zoom + swipe-to-navigate) ---
const activePointers = new Map(); // pointerId -> {x, y}
let pinchStartDistance = null;
let pinchStartScale = 1;
let swipeCandidate = false;
let swipeStartX = 0;
let swipeStartY = 0;
const SWIPE_THRESHOLD = 50; // px

function getPointerDistance() {
  const pts = Array.from(activePointers.values());
  if (pts.length < 2) return null;
  return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
}

function initElements() {
  lightbox = document.getElementById("lightbox");
  lightboxImg = document.getElementById("lightbox-img");
  lightboxTitle = document.getElementById("lightbox-title");
  lightboxDesc = document.getElementById("lightbox-desc");
  closeBtn = document.getElementById("lightbox-close");
  prevBtn = document.getElementById("lightbox-prev");
  nextBtn = document.getElementById("lightbox-next");
  resetBtn = document.getElementById("lightbox-reset"); // Added Reset Button target
}

/**
 * Keeps track of the current filtered/sorted set of items from the gallery engine
 */
export function updateLightboxList(newList) {
  lightboxList = newList || [];
  console.log("📦 [Lightbox] Pool synchronized. Total active items available:", lightboxList.length);
}

/**
 * Explicit alias to fix the SyntaxError for updateLightboxPool
 */
export function updateLightboxPool(newList) {
  updateLightboxList(newList);
}

/**
 * Triggers the modal to open and binds the requested index item
 */
export function openLightbox(index) {
  initElements(); 
  console.log("🚀 [Lightbox] openLightbox invoked for item index:", index);

  if (!lightboxList || lightboxList.length === 0) {
    console.error("❌ [Lightbox] Cannot open: The image pool array is empty.");
    return;
  }

  let parsedIndex = parseInt(index, 10);
  if (isNaN(parsedIndex) || parsedIndex < 0 || parsedIndex >= lightboxList.length) {
    console.warn(`⚠️ [Lightbox] Index "${index}" invalid. Defaulting to index 0.`);
    parsedIndex = 0;
  }
  
  currentIndex = parsedIndex;
  resetZoom(); // Always start fresh on item open
  updateLightboxDOM();
  
  if (lightbox) {
    lightbox.classList.add("active");
    lightbox.classList.add("show");
    
    // Fallback toggle if stylesheet uses overriding display rules
    if (window.getComputedStyle(lightbox).display === "none") {
      lightbox.style.display = "flex"; 
    }
  } else {
    console.error("❌ [Lightbox] DOM target component '#lightbox' was not found on the page.");
  }
}

/**
 * Smart execution wrapper matching whatever invocation type your gallery grid throws
 */
export function launchLightbox(arg) {
  console.log("🚀 [Lightbox] launchLightbox invoked with argument:", arg);
  
  if (typeof arg === "number") {
    openLightbox(arg);
  } else if (typeof arg === "string" && !isNaN(arg)) {
    openLightbox(parseInt(arg, 10));
  } else if (arg && (arg.target || arg.currentTarget)) {
    const element = arg.currentTarget || arg.target;
    const dataIdx = element.getAttribute("data-index") || element.dataset.index;
    openLightbox(dataIdx !== null ? dataIdx : 0);
  } else if (arg && typeof arg === "object" && (arg.file || arg.src)) {
    let targetFile = arg.file || arg.src;
    let index = lightboxList.findIndex(item => (item.file === targetFile || item.src === targetFile));
    
    if (index === -1) {
      console.warn("⚠️ [Lightbox] Item passed directly but not found in current synchronized pool. Appending it.");
      lightboxList.push(arg);
      index = lightboxList.length - 1;
    }
    openLightbox(index);
  } else {
    initLightbox();
  }
}

function closeLightbox() {
  if (lightbox) {
    lightbox.classList.remove("active");
    lightbox.classList.remove("show");
    lightbox.style.display = "";
  }
  if (lightboxImg) lightboxImg.src = ""; // Clear source to eliminate trailing cache ghost images
  resetZoom();
}

function showNext() {
  if (lightboxList.length === 0) return;
  currentIndex = (currentIndex + 1) % lightboxList.length;
  resetZoom(); // Reset transformation context before loading new map layout
  updateLightboxDOM();
}

function showPrev() {
  if (lightboxList.length === 0) return;
  currentIndex = (currentIndex - 1 + lightboxList.length) % lightboxList.length;
  resetZoom(); // Reset transformation context before loading new map layout
  updateLightboxDOM();
}

/**
 * Resets transform mechanics back to initial standard 1:1 view bounds
 */
function resetZoom() {
  scale = 1;
  translateX = 0;
  translateY = 0;
  isDragging = false;
  applyTransform();
  if (lightboxImg) {
    lightboxImg.style.cursor = "zoom-in";
  }
}

/**
 * Coordinates and pushes scale/translate updates straight to the element matrix style pipeline
 */
function applyTransform() {
  if (lightboxImg) {
    lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }

  // --- TOGGLE RESET BUTTON VISIBILITY ---
  if (resetBtn) {
    if (scale > 1) {
      resetBtn.classList.add("visible");
    } else {
      resetBtn.classList.remove("visible");
    }
  }
}

/**
 * Intercepts user mouse-wheel updates over the lightbox image to step up or step down layout scaling
 */
function handleWheel(e) {
  e.preventDefault();
  const zoomIntensity = 0.12;
  
  // Calculate potential target scale mapping
  let targetScale = scale + (e.deltaY < 0 ? zoomIntensity : -zoomIntensity);
  targetScale = Math.min(Math.max(MIN_SCALE, targetScale), MAX_SCALE);

  // If zooming out back to baseline, neutralize tracking coordinates
  if (targetScale === 1) {
    resetZoom();
    return;
  }

  scale = targetScale;
  applyTransform();
  
  if (lightboxImg) {
    lightboxImg.style.cursor = scale > 1 ? "grab" : "zoom-in";
  }
}

// --- POINTER EVENT HANDLERS FOR PANNING, PINCH-ZOOM & SWIPE NAVIGATION ---
// Pointer Events unify mouse/touch/pen, so these also drive touch interaction
// on phones — mouse-wheel zoom has no touch equivalent, and a single finger
// can mean "pan" (zoomed in), "pinch" (second finger joins), or "swipe to
// change image" (not zoomed), so all three share this pointer lifecycle.
function handlePointerDown(e) {
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  // Some browsers/situations reject capture of a given pointer id; that's
  // not fatal to gesture tracking, so don't let it abort the rest of this
  // handler (which is where the actual pinch/pan/swipe state gets set up).
  try {
    if (lightboxImg) lightboxImg.setPointerCapture(e.pointerId);
  } catch (err) {
    /* no-op: capture is a nice-to-have, not required for tracking */
  }

  if (activePointers.size === 2) {
    isDragging = false;
    swipeCandidate = false;
    pinchStartDistance = getPointerDistance();
    pinchStartScale = scale;
    return;
  }

  if (activePointers.size === 1) {
    pinchStartDistance = null;

    if (scale > 1) {
      isDragging = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      if (lightboxImg) lightboxImg.style.cursor = "grabbing";
    } else {
      // Not zoomed: this could be the start of a swipe to the next/prev image
      swipeCandidate = true;
      swipeStartX = e.clientX;
      swipeStartY = e.clientY;
    }
  }
}

function handlePointerMove(e) {
  if (!activePointers.has(e.pointerId)) return;
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (activePointers.size === 2 && pinchStartDistance) {
    const newDistance = getPointerDistance();
    let targetScale = pinchStartScale * (newDistance / pinchStartDistance);
    targetScale = Math.min(Math.max(MIN_SCALE, targetScale), MAX_SCALE);
    scale = targetScale;
    applyTransform();
    return;
  }

  if (isDragging) {
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    applyTransform();
  }
}

function handlePointerUp(e) {
  const hadTwoPointers = activePointers.size === 2;
  const wasSwipeCandidate = swipeCandidate && activePointers.size === 1;
  const endX = e.clientX;
  const endY = e.clientY;

  activePointers.delete(e.pointerId);
  try {
    if (lightboxImg?.hasPointerCapture?.(e.pointerId)) {
      lightboxImg.releasePointerCapture(e.pointerId);
    }
  } catch (err) {
    /* no-op */
  }

  if (activePointers.size < 2) {
    pinchStartDistance = null;
  }

  // Pinched back down to (or past) the baseline: snap cleanly to the reset state
  if (hadTwoPointers && scale <= MIN_SCALE) {
    resetZoom();
  }

  if (wasSwipeCandidate && scale <= 1) {
    const deltaX = endX - swipeStartX;
    const deltaY = endY - swipeStartY;
    if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
      deltaX < 0 ? showNext() : showPrev();
    }
  }
  swipeCandidate = false;

  if (activePointers.size === 1 && scale > 1) {
    // One finger lifted out of a pinch/pan — resume panning from the
    // remaining finger's current position instead of dropping the gesture.
    const remaining = Array.from(activePointers.values())[0];
    isDragging = true;
    startX = remaining.x - translateX;
    startY = remaining.y - translateY;
  } else {
    isDragging = false;
    if (lightboxImg) lightboxImg.style.cursor = scale > 1 ? "grab" : "zoom-in";
  }
}

/**
 * Updates the contents of the Lightbox view container with full high-res images
 */
function updateLightboxDOM() {
  const item = lightboxList[currentIndex];
  if (!item) {
    console.error("❌ [Lightbox] Item undefined at active pointer index:", currentIndex);
    return;
  }
  
  console.log("🖼️ [Lightbox] Rendering high-res item data layout:", item);

  let imgSrc = item.file || item.src || item.image || item.url || "";
  if (imgSrc && !imgSrc.startsWith("http://") && !imgSrc.startsWith("https://") && !imgSrc.startsWith("data:")) {
    const origin = window.location.origin;
    if (imgSrc.startsWith("/portfolio/")) {
      imgSrc = origin + imgSrc;
    } else if (imgSrc.startsWith("/")) {
      imgSrc = origin + imgSrc;
    } else {
      imgSrc = origin + "/portfolio/" + imgSrc;
    }
  }

  if (lightboxImg) {
    lightboxImg.src = imgSrc;
    lightboxImg.alt = item.name || item.title || "Full Resolution Map View";
  }
  
  if (lightboxTitle) {
    lightboxTitle.textContent = item.name || item.title || "Untitled Map";
  }
  
  if (lightboxDesc) {
    const parts = [];
    const countryText = (item.country || []).filter(c => c && c !== "Multiple").join(', ');

    if (item.location && countryText) {
      parts.push(`${item.location}, ${countryText}`);
    } else if (countryText) {
      parts.push(countryText);
    } else if (item.location) {
      parts.push(item.location);
    }

    const activeDisasters = (item.disaster || []).filter(d => d && d !== "None");
    if (activeDisasters.length > 0) {
      parts.push(activeDisasters.join(', '));
    }
    if (item.year) {
      parts.push(item.year);
    }
    
    if (parts.length === 0 && (item.desc || item.description)) {
      lightboxDesc.textContent = item.desc || item.description;
    } else {
      lightboxDesc.textContent = parts.join(" · ");
    }
  }
}

/**
 * Setup initialization handler
 */
export function initLightbox() {
  initElements();

  if (closeBtn) closeBtn.onclick = closeLightbox;
  if (nextBtn) nextBtn.onclick = showNext;
  if (prevBtn) prevBtn.onclick = showPrev;
  if (resetBtn) resetBtn.onclick = resetZoom; // Bind click action to Reset Button

  if (lightbox) {
    lightbox.onclick = (e) => {
      // Background backdrop click only triggers modal exit if hitting safe workspace dead zones
      if (e.target === lightbox || e.target.classList.contains('lightbox-viewer-workspace')) {
        if (!isDragging) closeLightbox();
      }
    };
  }

  // Bind Mouse Wheel and Pointer Track Listeners onto image wrapper node
  if (lightboxImg) {
    lightboxImg.style.transition = "transform 0.05s ease-out"; // Kept low to keep tracking ultra-responsive
    lightboxImg.style.transformOrigin = "center center";
    
    // Remove old listeners to prevent stacking duplicate actions across hot-reloads
    lightboxImg.onwheel = null;
    lightboxImg.onpointerdown = null;
    lightboxImg.onpointermove = null;
    lightboxImg.onpointerup = null;
    lightboxImg.onpointercancel = null;

    // Attach active interactive events
    lightboxImg.onwheel = handleWheel;
    lightboxImg.onpointerdown = handlePointerDown;
    lightboxImg.onpointermove = handlePointerMove;
    lightboxImg.onpointerup = handlePointerUp;
    lightboxImg.onpointercancel = handlePointerUp;
    
    // Prevent default ghost image dragging bugs built into standard desktop browsers
    lightboxImg.ondragstart = (e) => e.preventDefault();
  }
}

// Auto-run evaluation loop
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLightbox);
} else {
  initLightbox();
}

// Universal Keyboard Event Bindings
document.addEventListener("keydown", (e) => {
  if (!lightbox || (!lightbox.classList.contains("active") && lightbox.style.display !== "flex")) return;
  
  if (e.key === "Escape") closeLightbox();
  
  // Only route arrow keys to change images if user is zoomed back out 
  if (scale <= 1) {
    if (e.key === "ArrowRight") showNext();
    if (e.key === "ArrowLeft") showPrev();
  }
});

/* -------------------------------------------------------------------------
   BRIDGING GLOBAL SCOPE EXPOSURE (Fixes inline template grid selection)
------------------------------------------------------------------------- */
window.openLightbox = openLightbox;
window.launchLightbox = launchLightbox;
window.updateLightboxPool = updateLightboxPool;
window.updateLightboxList = updateLightboxList;
window.initLightbox = initLightbox;