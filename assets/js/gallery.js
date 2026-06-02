import { openLightbox, updateLightboxList } from "./image-lightbox.js";

let currentFilteredList = [];
let currentIndex = 0;

export function initGallery(images) {
  const grid = document.getElementById("gallery-grid");
  const base = window.location.origin + "/portfolio/";

  // Filter elements mapped EXACTLY to image-filter-bar.html IDs
  const fSort = document.getElementById("ife-sort");
  const fContinent = document.getElementById("ife-continent");
  const fCountry = document.getElementById("ife-country");
  const fDisaster = document.getElementById("ife-disaster");
  const fTheme = document.getElementById("ife-theme");
  const fYear = document.getElementById("ife-year");
  const btnClear = document.getElementById("reset-filters");

  // Build initial filter options dropdown values
  populateFilters(images);

  // Default sort setup
  if (fSort) fSort.value = "yearmonth";

  // Initial render run
  applyFilters();

  // Attach event listeners to matched elements
  const filterElements = [fSort, fContinent, fCountry, fDisaster, fTheme, fYear];
  filterElements.forEach(el => {
    if (el) el.onchange = applyFilters;
  });

  // Fixed Reset Button Event Handler
  if (btnClear) {
    btnClear.onclick = () => {
      if (fSort) fSort.value = "yearmonth";
      if (fContinent) fContinent.value = "";
      if (fCountry) fCountry.value = "";
      if (fDisaster) fDisaster.value = "";
      if (fTheme) fTheme.value = "";
      if (fYear) fYear.value = "";
      applyFilters();
    };
  }

  function applyFilters() {
    let filtered = images.filter(item => {
      return (
        (!fContinent || fContinent.value === "" || item.continent === fContinent.value) &&
        (!fCountry || fCountry.value === "" || item.country === fCountry.value) &&
        (!fDisaster || fDisaster.value === "" || item.disaster === fDisaster.value) &&
        (!fTheme || fTheme.value === "" || (item.themes && item.themes.includes(fTheme.value))) &&
        (!fYear || fYear.value === "" || String(item.year) === fYear.value)
      );
    });

    /* -----------------------------
        SORTING LOGIC
    ----------------------------- */
    if (fSort && fSort.value === "alpha") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (fSort && fSort.value === "yearmonth") {
      filtered.sort((a, b) => {
        const getMonthNum = m => {
          if (typeof m === "number") return m;
          if (!m) return 0;
          const map = {
            january: 1, february: 2, march: 3, april: 4,
            may: 5, june: 6, july: 7, august: 8,
            september: 9, october: 10, november: 11, december: 12
          };
          return map[m.toLowerCase()] || 0;
        };

        const aMonth = getMonthNum(a.month);
        const bMonth = getMonthNum(b.month);

        if (b.year !== a.year) return b.year - a.year;
        return bMonth - aMonth;
      });
    }

    if (fSort && fSort.value === "theme") {
      filtered.sort((a, b) => {
        const aTheme = (a.themes && a.themes[0]) ? a.themes[0] : "";
        const bTheme = (b.themes && b.themes[0]) ? b.themes[0] : "";
        return aTheme.localeCompare(bTheme);
      });
    }

    currentFilteredList = filtered;
    
    // Updates global tracking arrays inside your lightbox
    updateLightboxList(filtered);
    
    populateFilters(filtered);
    render(filtered);
  }

  function render(list) {
    if (!grid) return;
    grid.innerHTML = "";

    list.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "gallery-card";

      const thumb = item.file ? item.file.replace("assets/images/maps/", "assets/images/maps/thumbs/") : "";
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
      if (item.year) {
        parts.push(item.year);
      }

      const captionLine2 = parts.join(" · ");

      card.innerHTML = `
        <img src="${imgSrc}" alt="${item.name || 'Map'}">
        <div class="overlay">
          <h3>${item.name || 'Untitled Map'}</h3>
          <p>${captionLine2}</p>
        </div>
      `;

      // Hand index parameters off to interactive presentation triggers
      card.onclick = () => openLightbox(index);

      grid.appendChild(card);

      requestAnimationFrame(() => {
        card.classList.add("visible");
      });
    });
  }

  function populateFilters(list) {
    if (fContinent) fillSelect(fContinent, list.map(i => i.continent));
    if (fCountry) fillSelect(fCountry, list.map(i => i.country));
    if (fDisaster) fillSelect(fDisaster, list.map(i => i.disaster));
    if (fYear) fillSelect(fYear, list.map(i => i.year).filter(Boolean));

    if (fTheme) {
      const themes = [...new Set(list.flatMap(i => i.themes || []))].filter(Boolean).sort();
      fillSelect(fTheme, themes);
    }
  }

  function fillSelect(select, values) {
    const unique = [...new Set(values)].filter(Boolean).sort();
    const current = select.value;

    select.innerHTML = `<option value="">All</option>`;
    unique.forEach(v => {
      select.innerHTML += `<option value="${v}">${v}</option>`;
    });

    if (unique.includes(current)) select.value = current;
  }
}