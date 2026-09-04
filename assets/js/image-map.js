import { updateLightboxPool, launchLightbox } from "./image-lightbox.js";

let mapInstance;
let markerClusterLayer;

// Custom blue dot marker icon configuration via Leaflet DivIcon
const blueDotIcon = L.divIcon({
  className: 'custom-blue-dot',
  iconSize: [12, 12],       // Dimensions of the circle shape
  iconAnchor: [6, 6],       // Center the dot coordinates precisely
  popupAnchor: [0, -6]
});

/**
 * Initializes the base map layers and cluster group container
 */
export function initMapBase() {
  const canvas = document.getElementById('leaflet-map-canvas');
  if (!canvas) return;

  // Initialize map instance centered broadly over the world view
  mapInstance = L.map('leaflet-map-canvas').setView([25, 10], 2);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(mapInstance);

  // Configure and append the Marker Cluster layer group
  markerClusterLayer = L.markerClusterGroup({
    showCoverageOnHover: false, // Disables bounding polygon trace on hover
    maxClusterRadius: 40        // Pixel radius within which markers merge
  });
  mapInstance.addLayer(markerClusterLayer);
}

/**
 * Handles clearing, batch processing, rendering markers, and auto-fitting bounds
 * @param {Array} filteredItems - Current subset of images parsed by the filter engine
 */
export function renderMapMarkers(filteredItems) {
  if (!markerClusterLayer || !mapInstance) return;
  
  // Clear out active layers dynamically
  markerClusterLayer.clearLayers();

  // Sync up the visible subset with the global lightbox sequence pool
  updateLightboxPool(filteredItems);

  const markersToGroup = [];

  filteredItems.forEach(item => {
    // An item can have more than one location (e.g. a map covering several
    // countries), so it gets one marker per location, all pointing back to
    // the same lightbox entry.
    (item.locations || []).forEach(loc => {
      const marker = L.marker([loc.lat, loc.lng], { icon: blueDotIcon });

      // Trigger the lightbox window when a pin is selected
      marker.on('click', () => {
        launchLightbox(item);
      });

      markersToGroup.push(marker);
    });
  });

  // Batch-inject the group into the cluster system to optimize rendering performance
  if (markersToGroup.length > 0) {
    markerClusterLayer.addLayers(markersToGroup);

    // Dynamic Zoom & Pan: Adjust map view to tightly fit all current markers
    mapInstance.fitBounds(markerClusterLayer.getBounds(), {
      padding: [40, 40], // Adds pixel padding so markers aren't stuck to edges
      maxZoom: 14        // Prevents extreme zooming when only 1 item is filtered
    });
  } else {
    // Optional: Reset to world view if filters yield zero results
    mapInstance.setView([25, 10], 2);
  }
}