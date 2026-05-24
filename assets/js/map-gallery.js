// assets/js/map-gallery.js
// ES module — used only on the /map/ page

export default function initMap(images) {

  // --------------------------------------------------
  // MAP INITIALIZATION
  // --------------------------------------------------

  const map = L.map("map", {
    scrollWheelZoom: true,
    zoomControl: true
  }).setView([10, 20], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  const clusterGroup = L.markerClusterGroup();
  map.addLayer(clusterGroup);

  // --------------------------------------------------
  // MAP-SPECIFIC LIGHTBOX (SEPARATE FROM HOMEPAGE)
  // --------------------------------------------------

  const lightbox        = document.getElementById("map-lightbox");
  const lightboxImg     = document.getElementById("map-lightbox-img");
  const lightboxCaption = document.getElementById("map-lightbox-caption");
  const lightboxClose   = document.getElementById("map-lightbox-close");

  function buildCaptionLine2(item) {
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

    return parts.join(" · ");
  }

  function openLightbox(item) {
    const captionLine2 = buildCaptionLine2(item);

    lightboxImg.src = item.file;
    lightboxCaption.innerHTML = `<strong>${item.name}</strong><br>${captionLine2}`;

    lightbox.classList.remove("hidden");
  }

  function closeLightbox() {
    lightbox.classList.add("hidden");
    lightboxImg.src = "";
    lightboxCaption.innerHTML = "";
  }

  if (lightboxClose) {
    lightboxClose.addEventListener("click", closeLightbox);
  }

  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lightbox.classList.contains("hidden")) {
      closeLightbox();
    }
  });

  // --------------------------------------------------
  // ADD MARKERS
  // --------------------------------------------------

  images.forEach(item => {
    if (!item.lat || !item.lng) return;

    const marker = L.marker([item.lat, item.lng]);

    const popupHTML = `
      <strong>${item.name}</strong><br>
      ${buildCaptionLine2(item)}<br>
      <a href="#" class="open-map-lightbox">View map</a>
    `;

    marker.bindPopup(popupHTML);

    marker.on("popupopen", e => {
      const link = e.popup._contentNode.querySelector(".open-map-lightbox");
      if (!link) return;

      link.addEventListener("click", ev => {
        ev.preventDefault();
        openLightbox(item);
      });
    });

    clusterGroup.addLayer(marker);
  });
}
