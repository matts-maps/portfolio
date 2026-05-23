let currentFilteredList = [];
let currentIndex = 0;

export function initGallery(images) {
  const grid = document.getElementById("gallery-grid");
  const base = window.location.origin + "/portfolio/";

  /* -----------------------------
     MOBILE FILTER TOGGLE
  ----------------------------- */
  const mobileToggle = document.getElementById("mobile-filter-toggle");
  const filterWrapper = document.getElementById("filter-panel-wrapper");

  if (mobileToggle && filterWrapper) {
    mobileToggle.addEventListener("click", () => {
      const isOpen = filterWrapper.classList.toggle("open");
      mobileToggle.textContent = isOpen ? "Filters ▴" : "Filters ▾";
    });
  }

  /* -----------------------------
     FILTERS
  ----------------------------- */

  const fSearch = document.getElementById("search-box");
  const fSort = document.getElementById("sort-select");
  const fContinent = document.getElementById("filter-continent");
  const fCountry = document.getElementById("filter-country");
  const fLocation = document.getElementById("filter-location");
  const fDisaster = document.getElementById("filter-disaster");
  const fTheme = document.getElementById("filter-theme");
  const btnClear = document.getElementById("clear-filters");

  populateFilters(images);
  fSort.value = "year";
  applyFilters();

  fSearch.oninput =
  fSort.onchange =
  fContinent.onchange =
  fCountry.onchange =
  fLocation.onchange =
  fDisaster.onchange =
  fTheme.onchange = applyFilters;

  btnClear.onclick = () => {
    fSearch.value = "";
    fSort.value = "year";
    fContinent.value = "";
    fCountry.value = "";
    fLocation.value = "";
    fDisaster.value = "";
    fTheme.value = "";
    applyFilters();
  };

  function applyFilters() {
    let filtered = images.filter(item => {
      return (
        (fSearch.value === "" || item.name.toLowerCase().includes(fSearch.value.toLowerCase())) &&
        (fContinent.value === "" || item.continent === fContinent.value) &&
        (fCountry.value === "" || item.country === fCountry.value) &&
        (fLocation.value === "" || item.location === fLocation.value) &&
        (fDisaster.value === "" || item.disaster === fDisaster.value) &&
        (fTheme.value === "" || item.themes.includes(fTheme.value))
      );
    });

    if (fSort.value === "alpha") filtered.sort((a,b)=>a.name.localeCompare(b.name));
    if (fSort.value === "year") filtered.sort((a,b)=>b.year - a.year);
    if (fSort.value === "theme") filtered.sort((a,b)=>a.themes[0].localeCompare(b.themes[0]));

    currentFilteredList = filtered;
    populateFilters(filtered);
    render(filtered);
  }

  function render(list) {
    grid.innerHTML = "";

    list.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "gallery-card";

      const thumb = item.file.replace("assets/images/maps/", "assets/images/maps/thumbs/");
      const imgSrc = base + thumb;

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

      const captionLine2 = parts.join(" · ");

      card.innerHTML = `
        <img src="${imgSrc}" alt="${item.name}">
        <div class="overlay">
          <h3>${item.name}</h3>
          <p>${captionLine2}</p>
        </div>
      `;

      card.onclick = () => openLightbox(index, item, captionLine2);

      grid.appendChild(card);

      requestAnimationFrame(() => {
        card.classList.add("visible");
      });
    });
  }

  function populateFilters(list) {
    fillSelect(fContinent, list.map(i => i.continent));
    fillSelect(fCountry, list.map(i => i.country));
    fillSelect(fLocation, list.map(i => i.location).filter(Boolean));
    fillSelect(fDisaster, list.map(i => i.disaster));

    const themes = [...new Set(list.flatMap(i => i.themes))].sort();
    fillSelect(fTheme, themes);
  }

  function fillSelect(select, values) {
    const unique = [...new Set(values)].sort();
    const current = select.value;

    select.innerHTML = `<option value="">All</option>`;
    unique.forEach(v => {
      select.innerHTML += `<option value="${v}">${v}</option>`;
    });

    if (unique.includes(current)) select.value = current;
  }

  /* --------------------------------------------------
     LIGHTBOX (TOP-LEFT MATH)
  -------------------------------------------------- */

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const viewer = document.getElementById("lightbox-viewer");

  const zoomInBtn = document.getElementById("zoom-in");
  const zoomOutBtn = document.getElementById("zoom-out");
  const resetBtn = document.getElementById("zoom-reset");
  const btnPrev = document.getElementById("lightbox-prev");
  const btnNext = document.getElementById("lightbox-next");
  const btnClose = document.getElementById("lightbox-close");

  let scale = 1;
  let posX = 0;
  let posY = 0;
  let startX = 0;
  let startY = 0;
  let isPanning = false;

  function applyTransform() {
    lightboxImg.style.transform =
      `translate(${posX}px, ${posY}px) scale(${scale})`;
  }

  function fitToScreen() {
    const vw = viewer.clientWidth;
    const vh = viewer.clientHeight;

    const iw = lightboxImg.naturalWidth;
    const ih = lightboxImg.naturalHeight;

    if (!iw || !ih) return;

    const scaleX = vw / iw;
    const scaleY = vh / ih;
    scale = Math.min(scaleX, scaleY);

    posX = (vw - iw * scale) / 2;
    posY = (vh - ih * scale) / 2;

    applyTransform();
  }

  function openLightbox(index, item, caption) {
    currentIndex = index;

    const fullImg = base + item.file;
    lightboxImg.src = fullImg;

    lightboxCaption.textContent = `${item.name} — ${caption}`;
    lightbox.classList.remove("hidden");

    lightboxImg.onload = () => fitToScreen();
  }

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") lightbox.classList.add("hidden");
  });

  if (btnClose) btnClose.onclick = () => lightbox.classList.add("hidden");

  lightbox.addEventListener("click", e => {
    if (e.target === lightbox) lightbox.classList.add("hidden");
  });

  /* -----------------------------
     PAN
  ----------------------------- */

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

  /* -----------------------------
     SCROLL ZOOM
  ----------------------------- */

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

  /* -----------------------------
     ZOOM BUTTONS
  ----------------------------- */

  if (zoomInBtn) {
    zoomInBtn.onclick = () => {
      const rect = viewer.getBoundingClientRect();
      const mx = rect.width / 2;
      const my = rect.height / 2;

      const oldScale = scale;
      scale = Math.min(scale + 0.2, 8);

      posX = mx - (mx - posX) * (scale / oldScale);
      posY = my - (my - posY) * (scale / oldScale);

      applyTransform();
    };
  }

  if (zoomOutBtn) {
    zoomOutBtn.onclick = () => {
      const rect = viewer.getBoundingClientRect();
      const mx = rect.width / 2;
      const my = rect.height / 2;

      const oldScale = scale;
      scale = Math.max(scale - 0.2, 0.1);

      posX = mx - (mx - posX) * (scale / oldScale);
      posY = my - (my - posY) * (scale / oldScale);

      applyTransform();
    };
  }

  if (resetBtn) resetBtn.onclick = () => fitToScreen();

  /* -----------------------------
     PREV / NEXT
  ----------------------------- */

  function navigate(direction) {
    const list = currentFilteredList;
    currentIndex = (currentIndex + direction + list.length) % list.length;

    const item =