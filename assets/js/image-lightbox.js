// assets/js/image-lightbox.js

let lightboxList = [];
let currentIndex = 0;

// Grab layout elements matching image-lightbox.html structure
let lightbox, lightboxImg, lightboxTitle, lightboxDesc, closeBtn, prevBtn, nextBtn;

function initElements() {
  lightbox = document.getElementById("lightbox");
  lightboxImg = document.getElementById("lightbox-img");
  lightboxTitle = document.getElementById("lightbox-title");
  lightboxDesc = document.getElementById("lightbox-desc");
  closeBtn = document.getElementById("lightbox-close");
  prevBtn = document.getElementById("lightbox-prev");
  nextBtn = document.getElementById("lightbox-next");
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
    // Handled as an Event Object
    const element = arg.currentTarget || arg.target;
    const dataIdx = element.getAttribute("data-index") || element.dataset.index;
    openLightbox(dataIdx !== null ? dataIdx : 0);
  } else if (arg && typeof arg === "object" && (arg.file || arg.src)) {
    // NEW: Handled as a direct image item data object passed from the filter engine
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
}

function showNext() {
  if (lightboxList.length === 0) return;
  currentIndex = (currentIndex + 1) % lightboxList.length;
  updateLightboxDOM();
}

function showPrev() {
  if (lightboxList.length === 0) return;
  currentIndex = (currentIndex - 1 + lightboxList.length) % lightboxList.length;
  updateLightboxDOM();
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

  // Normalizes image file target strings to form solid URLs
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
    if (item.location && item.country !== "Multiple") {
      parts.push(`${item.location}, ${item.country}`);
    } else if (item.country && item.country !== "Multiple") {
      parts.push(item.country);
    }
    if (item.disaster && item.disaster !== "None") {
      parts.push(item.disaster);
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

  if (lightbox) {
    lightbox.onclick = (e) => {
      if (e.target === lightbox) closeLightbox();
    };
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
  if (e.key === "ArrowRight") showNext();
  if (e.key === "ArrowLeft") showPrev();
});

/* -------------------------------------------------------------------------
   BRIDGING GLOBAL SCOPE EXPOSURE (Fixes inline template grid selection)
------------------------------------------------------------------------- */
window.openLightbox = openLightbox;
window.launchLightbox = launchLightbox;
window.updateLightboxPool = updateLightboxPool;
window.updateLightboxList = updateLightboxList;
window.initLightbox = initLightbox;