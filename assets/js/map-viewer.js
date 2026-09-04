import { loadImages } from './data-adapter.js';
import { initFilterEngine, SORT } from './filter-engine.js';

// Start the fetch as soon as the module runs, so it's already in flight by
// the time DOMContentLoaded fires below.
const imagesPromise = loadImages();

// Application State Variables
// Populated once imagesPromise resolves (see DOMContentLoaded below);
// renderSimilarImagesPanel() reads this via closure and only ever runs after
// that point.
let images = [];
let filteredImages = [];
let currentFeaturedItem = null;
let isInitialPageLoad = true; // Flag to trace first-run initialization states

// Leaflet Engine Control Context Global Holders
let mapInstance = null;
let markerClusterGroup = null;
let activeStarMarkers = []; // Independent global holder for the active map's star symbols (one per location)

// Zoom and Pan State Vectors Architecture Tracker
const panelTransform = { scale: 1, x: 0, y: 0, isDragging: false, startX: 0, startY: 0 };
const modalTransform = { scale: 1, x: 0, y: 0, isDragging: false, startX: 0, startY: 0 };

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize Interactive Leaflet Map Instance Window
    initializeLeafletSystem();

    // 2. Bind Interactive Event Listeners
    bindCarouselEvents();

    // 3. Initialize specialized image workspace pan & scaling vectors
    initializeImageInteractionHandlers();

    // 4. Run initial filter pass, populate dependent dropdowns, and paint points
    images = await imagesPromise;
    filteredImages = [...images];
    initFilterEngine(images, handleFilteredResults, {
        sortEl: 'ife-sort',
        resetEl: 'reset-filters',
        fields: [
            { key: 'continent', elId: 'ife-continent' },
            { key: 'country', elId: 'ife-country', arrayValued: true },
            { key: 'disaster', elId: 'ife-disaster', arrayValued: true, groups: { 'tropical-cyclone': ['Cyclone', 'Hurricane', 'Typhoon'] } },
            { key: 'theme', prop: 'themes', elId: 'ife-theme', arrayValued: true },
            { key: 'year', elId: 'ife-year', optionOrder: 'desc-numeric' }
        ],
        sort: { alpha: SORT.alpha, theme: SORT.byFirstOf('themes'), yearmonth: SORT.yearmonth }
    });
});

/**
 * Generates the Leaflet map layer using high-contrast minimalist base tiles.
 */
function initializeLeafletSystem() {
    const mapNode = document.getElementById('leaflet-minimap');
    if (!mapNode) return;

    // Hard boundary limits spanning the absolute coordinate limits of the planet
    const globalOuterBounds = L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180));

    mapInstance = L.map('leaflet-minimap', {
        center: [15.0, 10.0],
        zoom: 0,                          
        zoomControl: true,
        minZoom: 0,                       // Allowed to drop down to zero to fit within compact components
        maxZoom: 11,
        maxBounds: globalOuterBounds,     // Lock camera framework inside planetary coordinates
        maxBoundsViscosity: 1.0,          // Solid bounce back when dragging past world edges
        worldCopyJump: false              // Keeps marker tracking consistent across continuous wraps
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        noWrap: false,                    // Allows rendering to connect seamlessly across boundaries
        bounds: globalOuterBounds
    }).addTo(mapInstance);

    // LOCKED IN: Your preferred clustering parameters for balanced global distribution
    markerClusterGroup = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 20,             // Drastically reduced footprint radius to stop heavy overlapping grouping
        disableClusteringAtZoom: 2        // Break apart groups quickly near the base global zoom levels
    }).addTo(mapInstance);
}

/**
 * Attaches panning and wheel-zoom event listeners onto targets.
 */
function initializeImageInteractionHandlers() {
    const panelView = document.getElementById('panel-viewport');
    const panelImg = document.getElementById('main-map-image');
    const modalView = document.getElementById('modal-viewport');
    const modalImg = document.getElementById('fullscreen-map-image');

    const modalOverlay = document.getElementById('custom-fullscreen-modal');
    const btnPanelFullscreen = document.getElementById('btn-panel-fullscreen');
    const btnPanelReset = document.getElementById('btn-panel-reset');
    const btnModalReset = document.getElementById('btn-modal-reset');
    const btnModalClose = document.getElementById('btn-modal-close');

    const updateImageStyle = (imgElement, transformObj) => {
        if (imgElement) {
            imgElement.style.transform = `translate(${transformObj.x}px, ${transformObj.y}px) scale(${transformTransformLimits(transformObj.scale)})`;
        }
    };

    const transformTransformLimits = (s) => Math.max(0.5, Math.min(s, 8));

    if (panelView && panelImg) {
        panelView.addEventListener('wheel', (e) => {
            e.preventDefault();
            const direction = e.deltaY < 0 ? 1 : -1;
            panelTransform.scale += direction * 0.12;
            panelTransform.scale = transformTransformLimits(panelTransform.scale);
            updateImageStyle(panelImg, panelTransform);
        }, { passive: false });

        panelView.addEventListener('mousedown', (e) => {
            e.preventDefault();
            panelTransform.isDragging = true;
            panelTransform.startX = e.clientX - panelTransform.x;
            panelTransform.startY = e.clientY - panelTransform.y;
        });

        window.addEventListener('mousemove', (e) => {
            if (!panelTransform.isDragging) return;
            panelTransform.x = e.clientX - panelTransform.startX;
            panelTransform.y = e.clientY - panelTransform.startY;
            updateImageStyle(panelImg, panelTransform);
        });

        window.addEventListener('mouseup', () => { panelTransform.isDragging = false; });
    }

    if (modalView && modalImg) {
        modalView.addEventListener('wheel', (e) => {
            e.preventDefault();
            const direction = e.deltaY < 0 ? 1 : -1;
            modalTransform.scale += direction * 0.15;
            modalTransform.scale = transformTransformLimits(modalTransform.scale);
            updateImageStyle(modalImg, modalTransform);
        }, { passive: false });

        modalView.addEventListener('mousedown', (e) => {
            e.preventDefault();
            modalTransform.isDragging = true;
            modalTransform.startX = e.clientX - modalTransform.x;
            modalTransform.startY = e.clientY - modalTransform.y;
        });

        window.addEventListener('mousemove', (e) => {
            if (!modalTransform.isDragging) return;
            modalTransform.x = e.clientX - modalTransform.startX;
            modalTransform.y = e.clientY - modalTransform.startY;
            updateImageStyle(modalImg, modalTransform);
        });

        window.addEventListener('mouseup', () => { modalTransform.isDragging = false; });
    }

    if (btnPanelReset && panelImg) {
        btnPanelReset.addEventListener('click', () => {
            panelTransform.scale = 1; panelTransform.x = 0; panelTransform.y = 0;
            updateImageStyle(panelImg, panelTransform);
        });
    }

    if (btnModalReset && modalImg) {
        btnModalReset.addEventListener('click', () => {
            modalTransform.scale = 1; modalTransform.x = 0; modalTransform.y = 0;
            updateImageStyle(modalImg, modalTransform);
        });
    }

    const launchFullscreenWorkspace = () => {
        if (!currentFeaturedItem || !modalOverlay || !modalImg) return;
        const isSubfolder = window.location.pathname.includes('/portfolio');
        modalImg.src = (isSubfolder ? '/portfolio/' : '/') + currentFeaturedItem.file;

        modalTransform.scale = 1; modalTransform.x = 0; modalTransform.y = 0;
        updateImageStyle(modalImg, modalTransform);

        modalOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden'; 
    };

    const dropFullscreenWorkspace = () => {
        if (!modalOverlay) return;
        modalOverlay.style.display = 'none';
        document.body.style.overflow = '';
    };

    if (btnPanelFullscreen) btnPanelFullscreen.addEventListener('click', launchFullscreenWorkspace);
    if (btnModalClose) btnModalClose.addEventListener('click', dropFullscreenWorkspace);

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.keyCode === 27) {
            dropFullscreenWorkspace();
        }
    });
}

function bindCarouselEvents() {
    // Carousel Left/Right Button Hardware Smooth Scrolling Listeners
    const carouselViewport = document.getElementById('similar-maps-strip-viewport');
    const btnPrev = document.getElementById('carousel-btn-prev');
    const btnNext = document.getElementById('carousel-btn-next');

    if (carouselViewport && btnPrev && btnNext) {
        btnPrev.addEventListener('click', () => {
            carouselViewport.scrollBy({ left: -480, behavior: 'smooth' });
        });
        btnNext.addEventListener('click', () => {
            carouselViewport.scrollBy({ left: 480, behavior: 'smooth' });
        });
    }
}

function handleFilteredResults(filtered) {
    filteredImages = filtered;

    if (filteredImages.length > 0) {
        if (isInitialPageLoad) {
            isInitialPageLoad = false; 
            const randomPickIndex = Math.floor(Math.random() * filteredImages.length);
            renderFeaturedSelection(filteredImages[randomPickIndex]);
        } else {
            renderFeaturedSelection(filteredImages[0]);
        }
    } else {
        renderEmptyState();
    }

    syncMapVectorMarkers();

    // Re-calculates explicit 180W to 180E display bounds across the map container
    if (mapInstance) {
        mapInstance.invalidateSize();
        
        const strictFullGlobalView = L.latLngBounds(
            L.latLng(-55, -175), 
            L.latLng(75, 175)    
        );
        
        mapInstance.fitBounds(strictFullGlobalView, {
            padding: [0, 0],
            animate: false,
            maxZoom: 1          
        });
    }
}

function syncMapVectorMarkers() {
    if (!markerClusterGroup || !mapInstance) return;
    
    markerClusterGroup.clearLayers();
    activeStarMarkers.forEach(m => mapInstance.removeLayer(m));
    activeStarMarkers = [];

    if (filteredImages.length === 0) return;

    const redStarIcon = L.divIcon({
        html: '<i class="fa-solid fa-star" style="color: #ff0000; font-size: 18px; -webkit-text-stroke: 1.5px #ffffff; display: block;"></i>',
        className: 'custom-star-marker',
        iconSize: [18, 18],
        iconAnchor: [9, 9]
    });

    // An item can have more than one location (e.g. a map covering several
    // countries), so it gets one marker per location.
    filteredImages.forEach(item => {
        const locations = item.locations || [];

        // Bypass clusters entirely for the active featured item's star markers
        if (currentFeaturedItem && item.file === currentFeaturedItem.file) {
            locations.forEach(loc => {
                const starMarker = L.marker([loc.lat, loc.lng], {
                    icon: redStarIcon,
                    zIndexOffset: 5000
                });

                starMarker.bindTooltip(item.name, { direction: 'top', offset: [0, -5] });
                starMarker.on('click', () => {
                    if (mapInstance) mapInstance.panTo([loc.lat, loc.lng], { animate: true });
                });

                starMarker.addTo(mapInstance);
                activeStarMarkers.push(starMarker);
            });
            return;
        }

        locations.forEach(loc => {
            const blueCircleMarker = L.circleMarker([loc.lat, loc.lng], {
                color: '#ffffff',
                fillColor: '#0055ff',
                fillOpacity: 1.0,
                radius: 6,
                weight: 1.5
            });

            blueCircleMarker.bindTooltip(item.name, { direction: 'top', offset: [0, -5] });
            blueCircleMarker.on('click', () => {
                renderFeaturedSelection(item);
                syncMapVectorMarkers();
                if (mapInstance) mapInstance.panTo([loc.lat, loc.lng], { animate: true });
            });

            markerClusterGroup.addLayer(blueCircleMarker);
        });
    });
}

/**
 * Renders similar/related layout images into the sub-panel area using actual thumbnails.
 */
function renderSimilarImagesPanel(currentItem) {
    const container = document.getElementById('similar-maps-container');
    const viewport = document.getElementById('similar-maps-strip-viewport');
    const btnPrev = document.getElementById('carousel-btn-prev');
    const btnNext = document.getElementById('carousel-btn-next');
    if (!container) return;

    container.innerHTML = '';
    if (viewport) viewport.scrollLeft = 0; // Reset scroll container position on update

    const relatedList = images.filter(item => {
        if (item.file === currentItem.file) return false; // Skip the active selected image
        
        const sameCountry = item.country.length > 0 && currentItem.country.length > 0 &&
            item.country.some(c => currentItem.country.includes(c));

        const sameDisaster = item.disaster.length > 0 && currentItem.disaster.length > 0 &&
            item.disaster.some(d => d !== "None" && d !== "" && currentItem.disaster.includes(d));

        return sameCountry || sameDisaster || (item.continent && item.continent === currentItem.continent);
    }).slice(0, 16); // Upper limit window matching full-width configurations

    if (relatedList.length === 0) {
        container.innerHTML = '<p class="no-similar-text">No similar maps found matching this item\'s regional location context.</p>';
        if (btnPrev) btnPrev.style.display = 'none';
        if (btnNext) btnNext.style.display = 'none';
        return;
    }

    // Toggle navigation arrows depending on item volume
    if (btnPrev && btnNext) {
        if (relatedList.length <= 4) {
            btnPrev.style.display = 'none';
            btnNext.style.display = 'none';
        } else {
            btnPrev.style.display = 'flex';
            btnNext.style.display = 'flex';
        }
    }

    const isSubfolder = window.location.pathname.includes('/portfolio');
    const basePath = isSubfolder ? '/portfolio/' : '/';

    relatedList.forEach(item => {
        const wrapper = document.createElement('div');
        wrapper.className = 'similar-thumb-wrapper';
        
        const img = document.createElement('img');
        
        // Explicit data property lookup, falling back to direct assets directory mapping
        if (item.thumb) {
            img.src = basePath + item.thumb;
        } else {
            const filename = item.file.split('/').pop();
            img.src = basePath + 'assets/images/maps/thumbs/' + filename;
        }
        
        img.alt = item.name;
        img.className = 'similar-thumb-img';
        img.title = `${item.name} (${item.year})`;

        wrapper.addEventListener('click', () => {
            renderFeaturedSelection(item);
            syncMapVectorMarkers();
            
            // Pan minimap viewport position focus automatically
            if (mapInstance && item.lat !== undefined && item.lng !== undefined) {
                mapInstance.panTo([item.lat, item.lng], { animate: true });
            }
        });

        wrapper.appendChild(img);
        container.appendChild(wrapper);
    });
}

function renderFeaturedSelection(item) {
    currentFeaturedItem = item;
    const mainImg = document.getElementById('main-map-image');
    if (mainImg) {
        const isSubfolder = window.location.pathname.includes('/portfolio');
        mainImg.src = (isSubfolder ? '/portfolio/' : '/') + item.file; 
        mainImg.alt = item.name;
        panelTransform.scale = 1; panelTransform.x = 0; panelTransform.y = 0;
        mainImg.style.transform = `translate(0px, 0px) scale(1)`;
    }

    document.getElementById('project-title').textContent = item.name;
    
    let contextLocation = item.country.join(', ');
    if (item.location) contextLocation = item.location + ' · ' + contextLocation;

    let disasterLabel = 'Standard Map';
    const activeDisasters = item.disaster.filter(d => d && d !== "None");
    if (activeDisasters.length > 0) {
        disasterLabel = activeDisasters.join('/');
    }
    
    document.getElementById('project-location').textContent = contextLocation + ' · ' + disasterLabel + ' · ' + item.year;

    const containerEl = document.getElementById('project-description-container');
    if (containerEl) {
        containerEl.innerHTML = `<p style="line-height: 1.6; color: #334155; font-size: 0.95rem; margin: 0;">${item.description || "No project description provided."}</p>`;
    }

    // Repopulate carousel array instantly relative to current selected asset
    renderSimilarImagesPanel(item);
}

function renderEmptyState() {
    currentFeaturedItem = null;
    if (document.getElementById('main-map-image')) document.getElementById('main-map-image').src = "";
    document.getElementById('project-title').textContent = "No Maps Match Selected Criteria";
    document.getElementById('project-location').textContent = "0 Matches Found";
    if (document.getElementById('project-description-container')) {
        document.getElementById('project-description-container').innerHTML = `<p style="line-height: 1.6; color: #334155; font-size: 0.95rem; margin: 0;">Please adjust or clear filters.</p>`;
    }
    const container = document.getElementById('similar-maps-container');
    if (container) container.innerHTML = '';
}