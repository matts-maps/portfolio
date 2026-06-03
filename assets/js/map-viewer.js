import { images } from './image-data.js';

// Application State Variables
let filteredImages = [...images];
let currentFeaturedItem = null;
const activeFilters = {
    sort: 'newest',
    continent: 'all',
    country: 'all',
    disaster: 'all',
    theme: 'all',
    year: 'all'
};

// Leaflet Engine Control Context Global Holders
let mapInstance = null;
let markerClusterGroup = null;

// Zoom and Pan State Vectors Architecture Tracker
const panelTransform = { scale: 1, x: 0, y: 0, isDragging: false, startX: 0, startY: 0 };
const modalTransform = { scale: 1, x: 0, y: 0, isDragging: false, startX: 0, startY: 0 };

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Interactive Leaflet Map Instance Window
    initializeLeafletSystem();

    // 2. Build Filter Dropdowns Option Objects
    buildDropdownOptions();
    
    // 3. Bind Interactive Event Listeners
    bindInterfaceEvents();
    
    // 4. Initialize specialized image workspace pan & scaling vectors
    initializeImageInteractionHandlers();

    // 5. Run initial filter pass and paint target map points
    processFiltersAndRender();
});

/**
 * Generates the Leaflet map layer using high-contrast minimalist base tiles.
 */
function initializeLeafletSystem() {
    const mapNode = document.getElementById('leaflet-minimap');
    if (!mapNode) return;

    mapInstance = L.map('leaflet-minimap', {
        center: [15.0, 10.0],
        zoom: 2,
        zoomControl: true,
        minZoom: 1,
        maxZoom: 11
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(mapInstance);

    markerClusterGroup = L.markerClusterGroup().addTo(mapInstance);
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

    // Helper functions for applying continuous CSS transforms
    const updateImageStyle = (imgElement, transformObj) => {
        if (imgElement) {
            imgElement.style.transform = `translate(${transformObj.x}px, ${transformObj.y}px) scale(${transformTransformLimits(transformObj.scale)})`;
        }
    };

    const transformTransformLimits = (s) => Math.max(0.5, Math.min(s, 8));

    // Panel Window Viewport Interaction Setup
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

    // Fullscreen Immersive Simulation Modal Viewport Setup
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

    // Control Toolbar Triggers Management
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

    // Modal Lifecycle Visibility Hooks
    const launchFullscreenWorkspace = () => {
        if (!currentFeaturedItem || !modalOverlay || !modalImg) return;
        const isSubfolder = window.location.pathname.includes('/portfolio');
        modalImg.src = (isSubfolder ? '/portfolio/' : '/') + currentFeaturedItem.file;

        // Synchronize initial configuration parameters natively
        modalTransform.scale = 1; modalTransform.x = 0; modalTransform.y = 0;
        updateImageStyle(modalImg, modalTransform);

        modalOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Lock background scrolling safely
    };

    const dropFullscreenWorkspace = () => {
        if (!modalOverlay) return;
        modalOverlay.style.display = 'none';
        document.body.style.overflow = '';
    };

    if (btnPanelFullscreen) btnPanelFullscreen.addEventListener('click', launchFullscreenWorkspace);
    if (btnModalClose) btnModalClose.addEventListener('click', dropFullscreenWorkspace);

    // Escape Hotkey Intercept Vector Listener
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.keyCode === 27) {
            dropFullscreenWorkspace();
        }
    });
}

/**
 * Extracts, flattens, and sanitizes unique properties from your dataset array.
 */
function extractUniqueValues(key) {
    const valuesSet = new Set();
    images.forEach(item => {
        const value = item[key];
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
            value.forEach(subVal => { 
                const cleanSub = String(subVal).trim();
                if (cleanSub && cleanSub !== "None" && cleanSub !== "") valuesSet.add(cleanSub); 
            });
        } else {
            const cleanVal = String(value).trim();
            if (cleanVal && cleanVal !== "None" && cleanVal !== "") valuesSet.add(cleanVal);
        }
    });
    return [...valuesSet].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
}

function populateSelect(elementId, optionsList) {
    const dropdown = document.getElementById(elementId);
    if (!dropdown) return;
    optionsList.forEach(val => {
        const option = document.createElement('option');
        option.value = val;
        option.textContent = val;
        dropdown.appendChild(option);
    });
}

function buildDropdownOptions() {
    populateSelect('filter-continent', extractUniqueValues('continent'));
    populateSelect('filter-country', extractUniqueValues('country'));
    populateSelect('filter-disaster', extractUniqueValues('disaster'));
    populateSelect('filter-theme', extractUniqueValues('themes'));
    populateSelect('filter-year', extractUniqueValues('year'));
}

function bindInterfaceEvents() {
    const interfaceMap = ['sort', 'continent', 'country', 'disaster', 'theme', 'year'];
    interfaceMap.forEach(key => {
        const element = document.getElementById('filter-' + key);
        if (element) {
            element.addEventListener('change', (e) => {
                activeFilters[key] = e.target.value;
                processFiltersAndRender();
            });
        }
    });

    const resetBtn = document.getElementById('reset-filters');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            interfaceMap.forEach(key => {
                activeFilters[key] = 'all';
                const element = document.getElementById('filter-' + key);
                if (element) element.value = 'all';
            });
            activeFilters.sort = 'newest';
            const sortEl = document.getElementById('filter-sort');
            if (sortEl) sortEl.value = 'newest';
            processFiltersAndRender();
        });
    }
}

function processFiltersAndRender() {
    filteredImages = images.filter(item => {
        const matchContinent = (activeFilters.continent === 'all' || 
            (item.continent && String(item.continent).trim() === activeFilters.continent));
        
        let matchCountry = activeFilters.country === 'all';
        if (!matchCountry && item.country) {
            if (Array.isArray(item.country)) {
                matchCountry = item.country.map(c => String(c).trim()).includes(activeFilters.country);
            } else {
                matchCountry = String(item.country).trim() === activeFilters.country;
            }
        }
        
        let matchDisaster = activeFilters.disaster === 'all';
        if (!matchDisaster && item.disaster) {
            if (Array.isArray(item.disaster)) {
                matchDisaster = item.disaster.map(d => String(d).trim()).includes(activeFilters.disaster);
            } else {
                matchDisaster = String(item.disaster).trim() === activeFilters.disaster;
            }
        } else if (!matchDisaster && (!item.disaster || item.disaster === "")) {
            matchDisaster = false;
        }
        
        const matchTheme = (activeFilters.theme === 'all' || 
            (item.themes && item.themes.map(t => String(t).trim()).includes(activeFilters.theme)));
            
        const matchYear = (activeFilters.year === 'all' || 
            (item.year && String(item.year).trim() === activeFilters.year));

        return matchContinent && matchCountry && matchDisaster && matchTheme && matchYear;
    });

    filteredImages.sort((a, b) => {
        const valA = new Date(a.year, (a.month ? a.month - 1 : 0), 1);
        const valB = new Date(b.year, (b.month ? b.month - 1 : 0), 1);
        return activeFilters.sort === 'newest' ? valB - valA : valA - valB;
    });

    syncMapVectorMarkers();

    if (filteredImages.length > 0) {
        renderFeaturedSelection(filteredImages[0]);
    } else {
        renderEmptyState();
    }
}

function syncMapVectorMarkers() {
    if (!markerClusterGroup || !mapInstance) return;
    markerClusterGroup.clearLayers();

    if (filteredImages.length === 0) {
        mapInstance.setView([15.0, 10.0], 2);
        return;
    }

    const coordinateBounds = [];
    filteredImages.forEach(item => {
        if (item.lat === undefined || item.lng === undefined) return;

        const vectorMarker = L.circleMarker([item.lat, item.lng], {
            color: '#d32f2f',       
            fillColor: '#ef5350',   
            fillOpacity: 0.65,
            radius: 6,
            weight: 2
        });

        vectorMarker.bindTooltip(item.name, { direction: 'top', offset: [0, -5] });
        vectorMarker.on('click', () => { renderFeaturedSelection(item); });

        markerClusterGroup.addLayer(vectorMarker);
        coordinateBounds.push([item.lat, item.lng]);
    });

    if (filteredImages.length === 1) {
        mapInstance.setView(coordinateBounds[0], 5, { animate: true, duration: 1.25 });
    } else if (coordinateBounds.length > 0) {
        const boundingBox = L.latLngBounds(coordinateBounds);
        mapInstance.fitBounds(boundingBox, { padding: [30, 30], maxZoom: 6, animate: true, duration: 1.0 });
    }
}

function renderFeaturedSelection(item) {
    currentFeaturedItem = item;

    const mainImg = document.getElementById('main-map-image');
    if (mainImg) {
        const isSubfolder = window.location.pathname.includes('/portfolio');
        const basePath = isSubfolder ? '/portfolio/' : '/';
        mainImg.src = basePath + item.file; 
        mainImg.alt = item.name;

        // Reset workspace canvas properties automatically whenever switching featured maps
        panelTransform.scale = 1; panelTransform.x = 0; panelTransform.y = 0;
        mainImg.style.transform = `translate(0px, 0px) scale(1)`;
    }

    document.getElementById('project-title').textContent = item.name;
    
    let contextLocation = Array.isArray(item.country) ? item.country.join(', ') : item.country;
    if (item.location) contextLocation = item.location + ' · ' + contextLocation;
    
    let disasterLabel = 'Standard Map';
    if (item.disaster && item.disaster !== "None" && item.disaster !== "") {
        disasterLabel = Array.isArray(item.disaster) ? item.disaster.join('/') : item.disaster;
    }
    
    contextLocation = contextLocation + ' · ' + disasterLabel + ' · ' + item.year;
    document.getElementById('project-location').textContent = contextLocation;

    const containerEl = document.getElementById('project-description-container');
    if (containerEl) {
        const itemDescription = item.description && item.description.trim() !== "" ? item.description : "No project description provided for this layout.";
        containerEl.innerHTML = `<p style="line-height: 1.6; color: #334155; font-size: 0.95rem; margin: 0;">${itemDescription}</p>`;
    }

    if (filteredImages.length > 1 && mapInstance) {
        mapInstance.panTo([item.lat, item.lng], { animate: true });
    }
}

function renderEmptyState() {
    currentFeaturedItem = null;
    const mainImg = document.getElementById('main-map-image');
    if (mainImg) mainImg.src = "";
    
    document.getElementById('project-title').textContent = "No Maps Match Selected Criteria";
    document.getElementById('project-location').textContent = "0 Matches Found";
    
    const containerEl = document.getElementById('project-description-container');
    if (containerEl) {
        containerEl.innerHTML = `<p style="line-height: 1.6; color: #334155; font-size: 0.95rem; margin: 0;">Please adjust or clear your dashboard dropdown filters to see active layouts.</p>`;
    }
}