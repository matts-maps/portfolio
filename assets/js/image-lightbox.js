// assets/js/image-lightbox.js

let dynamicContextItems = [];
let currentIndex = 0;

// 1. Export the initialization function the layouts are looking for
export function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  if (!lightbox) return;

  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', navigatePrev);
  nextBtn.addEventListener('click', navigateNext);

  // Close when clicking the dark background overlay
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Keyboard navigation shortcuts
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigatePrev();
    if (e.key === 'ArrowRight') navigateNext();
  });
}

// 2. Export the sync tool that updates the navigation loop based on active filters
export function updateLightboxPool(filteredData) {
  dynamicContextItems = filteredData;
}

// 3. Export the launcher triggered by grid card or map pin clicks
export function launchLightbox(targetItem) {
  const index = dynamicContextItems.findIndex(item => item.name === targetItem.name);
  
  if (index === -1) {
    dynamicContextItems = [targetItem];
    currentIndex = 0;
  } else {
    currentIndex = index;
  }

  renderState();
  document.getElementById('lightbox').classList.add('active');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
}

function navigatePrev() {
  if (dynamicContextItems.length <= 1) return;
  currentIndex = (currentIndex - 1 + dynamicContextItems.length) % dynamicContextItems.length;
  renderState();
}

function navigateNext() {
  if (dynamicContextItems.length <= 1) return;
  currentIndex = (currentIndex + 1) % dynamicContextItems.length;
  renderState();
}

// 4. Render the modal elements using your custom image-data.js schema keys
function renderState() {
  const current = dynamicContextItems[currentIndex];
  if (!current) return;

  // Resolve subfolder asset routing paths dynamically
  const baseUrl = window.location.pathname.startsWith('/portfolio') ? '/portfolio' : '';
  const imgUrl = current.file ? `${baseUrl}/${current.file}` : '';
  const metaCaption = `${current.country || ''} — ${current.year || ''} [${current.disaster || 'General'}]`;

  document.getElementById('lightbox-img').src = imgUrl;
  document.getElementById('lightbox-title').textContent = current.name || 'Untitled Map';
  document.getElementById('lightbox-desc').textContent = metaCaption;
}