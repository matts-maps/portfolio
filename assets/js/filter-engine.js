export function initFilters(images, onChange) {
  const fSearch = document.getElementById("search-box");
  const fSort = document.getElementById("sort-select");
  const fContinent = document.getElementById("filter-continent");
  const fCountry = document.getElementById("filter-country");
  const fLocation = document.getElementById("filter-location");
  const fDisaster = document.getElementById("filter-disaster");
  const fTheme = document.getElementById("filter-theme");
  const btnClear = document.getElementById("clear-filters");

  /* -----------------------------
     POPULATE SELECT OPTIONS
  ----------------------------- */
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
    fillSelect(fDisaster, list.map(i => i.disaster));

    const themes = [...new Set(list.flatMap(i => i.themes))].sort();
    fillSelect(fTheme, themes);
  }

  /* -----------------------------
     APPLY FILTERS
  ----------------------------- */
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

    // Sorting
    if (fSort.value === "alpha") filtered.sort((a,b)=>a.name.localeCompare(b.name));
    if (fSort.value === "year") filtered.sort((a,b)=>b.year - a.year);
    if (fSort.value === "theme") filtered.sort((a,b)=>a.themes[0].localeCompare(b.themes[0]));

    // ⭐ Repopulate dropdowns based on filtered list
    populateFilters(filtered);

    // ⭐ Send filtered list back to map
    onChange(filtered);
  }

  /* -----------------------------
     EVENT LISTENERS
  ----------------------------- */
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

  /* -----------------------------
     INITIAL POPULATION + FILTER
  ----------------------------- */

  // ⭐ Populate dropdowns BEFORE filtering
  populateFilters(images);

  // ⭐ Apply filters (initial render)
  applyFilters();
}
