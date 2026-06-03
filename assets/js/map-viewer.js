import { images } from './image-data.js';

// Application State Variables
let filteredImages = [...images];
let currentFeaturedItem = null;
let isInitialPageLoad = true; // Flag to trace first-run initialization states

const activeFilters = {
    sort: 'yearmonth',
    continent: '',
    country: '',
    disaster: '',
    theme: '',
    year: ''
};

// Leaflet Engine Control Context Global Holders
let mapInstance = null;
let markerClusterGroup = null;
let activeStarMarker = null; // Independent global holder for the active map star symbol

// Zoom and Pan State Vectors Architecture Tracker
const panelTransform = { scale: 1, x: 0, y: 0, isDragging: false, startX: 0, startY: 0 };
const modalTransform = { scale: 1, x: 0, y: 0, isDragging: false, startX: 0, startY: 0 };

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Interactive Leaflet Map Instance Window
    initializeLeafletSystem();
    
    // 2. Bind Interactive Event Listeners
    bindInterfaceEvents();
    
    // 3. Initialize specialized image workspace pan & scaling vectors
    initializeImageInteractionHandlers();

    // 4. Run initial filter pass, populate dependent dropdowns, and paint points
    processFiltersAndRender();
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

/**
 * Extracts unique values from a specific subset array instead of the global image stack
 */
function extractUniqueValuesFromSubset(subset, key) {
    const valuesSet = new Set();
    subset.forEach(item => {
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

/**
 * Updates dropdown options dynamically while keeping the selected choice active
 */
function updateDropdownMenuOptions(elementId, optionsList, currentValue) {
    const dropdown = document.getElementById(elementId);
    if (!dropdown) return;

    dropdown.innerHTML = '<option value="">All</option>';

    optionsList.forEach(val => {
        const option = document.createElement('option');
        option.value = val;
        option.textContent = val;
        if (val === currentValue) {
            option.selected = true;
        }
        dropdown.appendChild(option);
    });
}

/**
 * Recalculates what options should be visible based on current selections
 */
function buildDynamicDropdowns() {
    const filterKeys = ['continent', 'country', 'disaster', 'theme', 'year'];
    const dataMapping = { continent: 'continent', country: 'country', disaster: 'disaster', theme: 'themes', year: 'year' };

    filterKeys.forEach(key => {
        const temporarySubset = images.filter(item => {
            const matchContinent = (key === 'continent' || activeFilters.continent === '' || 
                (item.continent && String(item.continent).trim() === activeFilters.continent));
            
            let matchCountry = key === 'country' || activeFilters.country === '';
            if (!matchCountry && item.country) {
                if (Array.isArray(item.country)) {
                    matchCountry = item.country.map(c => String(c).trim()).includes(activeFilters.country);
                } else {
                    matchCountry = String(item.country).trim() === activeFilters.country;
                }
            }
            
            let matchDisaster = key === 'disaster' || activeFilters.disaster === '';
            if (!matchDisaster && item.disaster) {
                if (Array.isArray(item.disaster)) {
                    matchDisaster = item.disaster.map(d => String(d).trim()).includes(activeFilters.disaster);
                } else {
                    matchDisaster = String(item.disaster).trim() === activeFilters.disaster;
                }
            } else if (!matchDisaster && (!item.disaster || item.disaster === "")) {
                matchDisaster = false;
            }
            
            const matchTheme = (key === 'theme' || activeFilters.theme === '' || 
                (item.themes && item.themes.map(t => String(t).trim()).includes(activeFilters.theme)));
                
            const matchYear = (key === 'year' || activeFilters.year === '' || 
                (item.year && String(item.year).trim() === activeFilters.year));

            return matchContinent && matchCountry && matchDisaster && matchTheme && matchYear;
        });

        const uniqueValues = extractUniqueValuesFromSubset(temporarySubset, dataMapping[key]);
        updateDropdownMenuOptions('ife-' + key, uniqueValues, activeFilters[key]);
    });
}

function bindInterfaceEvents() {
    const interfaceMap = ['sort', 'continent', 'country', 'disaster', 'theme', 'year'];
    interfaceMap.forEach(key => {
        const element = document.getElementById('ife-' + key);
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
                activeFilters[key] = '';
                const element = document.getElementById('ife-' + key);
                if (element) element.value = '';
            });
            activeFilters.sort = 'yearmonth';
            const sortEl = document.getElementById('ife-sort');
            if (sortEl) sortEl.value = 'yearmonth';
            processFiltersAndRender();
        });
    }
}

function processFiltersAndRender() {
    filteredImages = images.filter(item => {
        const matchContinent = (activeFilters.continent === '' || 
            (item.continent && String(item.continent).trim() === activeFilters.continent));
        
        let matchCountry = activeFilters.country === '';
        if (!matchCountry && item.country) {
            if (Array.isArray(item.country)) {
                matchCountry = item.country.map(c => String(c).trim()).includes(activeFilters.country);
            } else {
                matchCountry = String(item.country).trim() === activeFilters.country;
            }
        }
        
        let matchDisaster = activeFilters.disaster === '';
        if (!matchDisaster && item.disaster) {
            if (Array.isArray(item.disaster)) {
                matchDisaster = item.disaster.map(d => String(d).trim()).includes(activeFilters.disaster);
            } else {
                matchDisaster = String(item.disaster).trim() === activeFilters.disaster;
            }
        } else if (!matchDisaster && (!item.disaster || item.disaster === "")) {
            matchDisaster = false;
        }
        
        const matchTheme = (activeFilters.theme === '' || 
            (item.themes && item.themes.map(t => String(t).trim()).includes(activeFilters.theme)));
            
        const matchYear = (activeFilters.year === '' || 
            (item.year && String(item.year).trim() === activeFilters.year));

        return matchContinent && matchCountry && matchDisaster && matchTheme && matchYear;
    });

    filteredImages.sort((a, b) => {
        const valA = new Date(a.year, (a.month ? a.month - 1 : 0), 1);
        const valB = new Date(b.year, (b.month ? b.month - 1 : 0), 1);
        return activeFilters.sort === 'yearmonth' ? valB - valA : valA - valB;
    });

    buildDynamicDropdowns();

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
    if (activeStarMarker) {
        mapInstance.removeLayer(activeStarMarker);
        activeStarMarker = null;
    }

    if (filteredImages.length === 0) return;

    const redStarIcon = L.divIcon({
        html: '<i class="fa-solid fa-star" style="color: #ff0000; font-size: 18px; -webkit-text-stroke: 1.5px #ffffff; display: block;"></i>',
        className: 'custom-star-marker',
        iconSize: [18, 18],
        iconAnchor: [9, 9]
    });

    filteredImages.forEach(item => {
        if (item.lat === undefined || item.lng === undefined) return;

        // Bypass clusters entirely for the active featured star marker
        if (currentFeaturedItem && item.file === currentFeaturedItem.file) {
            activeStarMarker = L.marker([item.lat, item.lng], { 
                icon: redStarIcon,
                zIndexOffset: 5000 
            });

            activeStarMarker.bindTooltip(item.name, { direction: 'top', offset: [0, -5] });
            activeStarMarker.on('click', () => {
                if (mapInstance) mapInstance.panTo([item.lat, item.lng], { animate: true });
            });

            activeStarMarker.addTo(mapInstance);
        } else {
            const blueCircleMarker = L.circleMarker([item.lat, item.lng], {
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
                if (mapInstance) mapInstance.panTo([item.lat, item.lng], { animate: true });
            });

            markerClusterGroup.addLayer(blueCircleMarker);
        }
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
    
    let contextLocation = Array.isArray(item.country) ? item.country.join(', ') : item.country;
    if (item.location) contextLocation = item.location + ' · ' + contextLocation;
    
    let disasterLabel = 'Standard Map';
    if (item.disaster && item.disaster !== "None" && item.disaster !== "") {
        disasterLabel = Array.isArray(item.disaster) ? item.disaster.join('/') : item.disaster;
    }
    
    document.getElementById('project-location').textContent = contextLocation + ' · ' + disasterLabel + ' · ' + item.year;

    const containerEl = document.getElementById('project-description-container');
    if (containerEl) {
        containerEl.innerHTML = `<p style="line-height: 1.6; color: #334155; font-size: 0.95rem; margin: 0;">${item.description || "No project description provided."}</p>`;
    }
}

function renderEmptyState() {
    currentFeaturedItem = null;
    if (document.getElementById('main-map-image')) document.getElementById('main-map-image').src = "";
    document.getElementById('project-title').textContent = "No Maps Match Selected Criteria";
    document.getElementById('project-location').textContent = "0 Matches Found";
    if (document.getElementById('project-description-container')) {
        document.getElementById('project-description-container').innerHTML = `<p style="line-height: 1.6; color: #334155; font-size: 0.95rem; margin: 0;">Please adjust or clear filters.</p>`;
    }
}