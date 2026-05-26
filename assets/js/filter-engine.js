export function initFilters(images, onChange) {
  const fSearch = document.getElementById("search-box");
  const fSort = document.getElementById("sort-select");
  const fContinent = document.getElementById("filter-continent");
  const fCountry = document.getElementById("filter-country");
  const fLocation = document.getElementById("filter-location");
  const fDisaster = document.getElementById("filter-disaster");
  const fTheme = document.getElementById("filter-theme");
  const btnClear = document.getElementById("clear-filters");

  /* --------------------------------------------------
     CYCLONE GROUP LOGIC
  -------------------------------------------------- */
  const cycloneGroup = ["Cyclone", "Hurricane", "Typhoon"];
  const cycloneLabel = "Cyclone, Hurricane, Typhoon";

  /* --------------------------------------------------
     POPULATE SELECT OPTIONS
  -------------------------------------------------- */
  function fillSelect(select, values) {
    const unique = [...new Set(values)].sort();
    const current = select.value;

    select.innerHTML = `<option value="">All</option>`;
    unique.forEach(v => {
      if (v && v !== "None" && v !== "Multiple") {
        select.innerHTML += `<option value="${v}">${v}</option>`;
      }
    });

    if (unique.includes(current)) select.value = current;
  }

  function populateFilters(list) {
    fillSelect(fContinent, list.map(i => i.continent));
    fillSelect(fCountry, list.map(i => i.country));
    fillSelect(fLocation, list.map(i => i.location).filter(Boolean));

    // ⭐ Disaster dropdown: always show the combined cyclone option
    const disasters = [...new Set(
      list.map(i =>
        cycloneGroup.includes(i.disaster)
          ? cycloneLabel
          : i.disaster
      )
    )].sort();

    fDisaster.innerHTML = `<option value="">All</option>` +
      disasters.map(d => `<option value="${d}">${d}</option>`).join("");

    // Themes
    const themes = [...new Set(list.flatMap(i => i.themes))].sort();
    fillSelect(fTheme, themes);
  }

  /* --------------------------------------------------
     APPLY FILTERS
  -------------------------------------------------- */
  function applyFilters() {
    let filtered = images.filter(item => {
      // Search
      if (fSearch.value &&
          !item.name.toLowerCase().includes(fSearch.value.toLowerCase())) {
        return false;
      }

      // Continent
      if (fContinent.value && item.continent !== fContinent.value) return false;

      // Country
      if (fCountry.value && item.country !== fCountry.value) return false;

      // Location
      if (fLocation.value && item.location !== fLocation.value) return false;

      // ⭐ Disaster logic (combined cyclone option)
      if (fDisaster.value === cycloneLabel) {
        if (!cycloneGroup.includes(item.disaster)) return false;
      } else if (fDisaster.value && item.disaster !== fDisaster.value) {
        return false;
      }

      // Theme
      if (fTheme.value && !item.themes.includes(fTheme.value)) return false;

      return true;
    });

    // Sorting
    if (fSort.value === "alpha") filtered.sort((a,b)=>a.name.localeCompare(b.name));
    if (fSort.value === "year") filtered.sort((a,b)=>b.year - a.year);
    if (fSort.value === "theme") filtered.sort((a,b)=>a.themes[0].localeCompare(b.themes[0]));

    // Repopulate dropdowns based on filtered list
    populateFilters(filtered);

    // Send filtered list back to gallery/map
    onChange(filtered);
  }

  /* --------------------------------------------------
     EVENT LISTENERS
  -------------------------------------------------- */
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

  /* --------------------------------------------------
     INITIAL POPULATION + FILTER
  -------------------------------------------------- */
  populateFilters(images);
  applyFilters();
}
