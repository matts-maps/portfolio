export function initGallery(images) {
  const grid = document.getElementById("gallery-grid");
  const base = window.location.origin + "/portfolio/";

  // Filter elements
  const fSearch = document.getElementById("search-box");
  const fSort = document.getElementById("sort-select");
  const fContinent = document.getElementById("filter-continent");
  const fCountry = document.getElementById("filter-country");
  const fLocation = document.getElementById("filter-location");
  const fTheme = document.getElementById("filter-theme");
  const fDisaster = document.getElementById("filter-disaster");
  const btnClear = document.getElementById("clear-filters");

  // Build initial filter options
  populateFilters(images);

  // Default sort = newest first
  fSort.value = "year";

  // Initial render
  applyFilters();

  // Attach listeners
  fSearch.oninput =
  fSort.onchange =
  fContinent.onchange =
  fCountry.onchange =
  fLocation.onchange =
  fTheme.onchange =
  fDisaster.onchange = applyFilters;

  btnClear.onclick = () => {
    fSearch.value = "";
    fSort.value = "year";
    fContinent.value = "";
    fCountry.value = "";
    fLocation.value = "";
    fTheme.value = "";
    fDisaster.value = "";
    applyFilters();
  };

  function applyFilters() {
    let filtered = images.filter(item => {
      return (
        (fSearch.value === "" || item.name.toLowerCase().includes(fSearch.value.toLowerCase())) &&
        (fContinent.value === "" || item.continent === fContinent.value) &&
        (fCountry.value === "" || item.country === fCountry.value) &&
        (fLocation.value === "" || item.location === fLocation.value) &&
        (fTheme.value === "" || item.themes.includes(fTheme.value)) &&
        (fDisaster.value === "" || item.disaster === fDisaster.value)
      );
    });

    // Sorting
    if (fSort.value === "alpha") filtered.sort((a,b)=>a.name.localeCompare(b.name));
    if (fSort.value === "year") filtered.sort((a,b)=>b.year - a.year);
    if (fSort.value === "theme") filtered.sort((a,b)=>a.themes[0].localeCompare(b.themes[0]));

    // Update dependent filters
    populateFilters(filtered);

    // Render
    render(filtered);
  }

  function render(list) {
    grid.innerHTML = "";

    list.forEach(item => {
      const card = document.createElement("div");
      card.className = "gallery-card";

      const thumb = item.file.replace("assets/images/maps/", "assets/images/maps/thumbs/");
      const imgSrc = base + thumb;

      card.innerHTML = `
        <img src="${imgSrc}" alt="${item.name}">
        <h3>${item.name}</h3>
        <p>${item.location || item.country || ""}</p>
      `;

      grid.appendChild(card);
    });
  }

  function populateFilters(list) {
    fillSelect(fContinent, list.map(i => i.continent));
    fillSelect(fCountry, list.map(i => i.country));
    fillSelect(fLocation, list.map(i => i.location).filter(Boolean));
    fillSelect(fDisaster, list.map(i => i.disaster));

    // Themes dropdown
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
}
