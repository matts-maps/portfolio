export function initGallery(images) {
  const grid = document.getElementById("gallery-grid");
  const base = window.location.origin + "/portfolio/";

  // Filter elements
  const fSearch = document.getElementById("search-box");
  const fSort = document.getElementById("sort-select");
  const fContinent = document.getElementById("filter-continent");
  const fCountry = document.getElementById("filter-country");
  const fLocation = document.getElementById("filter-location");
  const fThemes = document.getElementById("filter-themes");
  const fDisaster = document.getElementById("filter-disaster");
  const fYear = document.getElementById("filter-year");

  // Build initial filter options
  populateFilters(images);

  // Initial render
  applyFilters();

  // Attach listeners
  fSearch.oninput =
  fSort.onchange =
  fContinent.onchange =
  fCountry.onchange =
  fLocation.onchange =
  fDisaster.onchange =
  fYear.onchange = applyFilters;

  fThemes.addEventListener("change", applyFilters);

  function applyFilters() {
    const selectedThemes = [...fThemes.querySelectorAll("input:checked")].map(i => i.value);

    let filtered = images.filter(item => {
      return (
        (fSearch.value === "" || item.name.toLowerCase().includes(fSearch.value.toLowerCase())) &&
        (fContinent.value === "" || item.continent === fContinent.value) &&
        (fCountry.value === "" || item.country === fCountry.value) &&
        (fLocation.value === "" || item.location === fLocation.value) &&
        (selectedThemes.length === 0 || selectedThemes.every(t => item.themes.includes(t))) &&
        (fDisaster.value === "" || item.disaster === fDisaster.value) &&
        (fYear.value === "" || item.year.toString() === fYear.value)
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
    fillSelect(fYear, list.map(i => i.year.toString()));

    // Themes = checkboxes
    const themes = [...new Set(list.flatMap(i => i.themes))].sort();
    fThemes.innerHTML = themes.map(t => `
      <label><input type="checkbox" value="${t}"> ${t}</label>
    `).join("");
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
