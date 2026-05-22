export function initGalleryFilters(images, renderCallback) {
  const searchBox = document.getElementById("filter-search");
  const sortSelect = document.getElementById("filter-sort");
  const continentSelect = document.getElementById("filter-continent");
  const countrySelect = document.getElementById("filter-country");
  const locationSelect = document.getElementById("filter-location");
  const disasterSelect = document.getElementById("filter-disaster");
  const themeContainer = document.getElementById("filter-themes");
  const resetBtn = document.getElementById("filter-reset");

  if (!renderCallback) return;

  const continents = [...new Set(images.map(i => i.continent).filter(Boolean))];
  const countries = [...new Set(images.map(i => i.country).filter(Boolean))];
  const locations = [...new Set(images.map(i => i.location).filter(Boolean))];
  const disasters = [...new Set(images.map(i => i.disaster).filter(Boolean))];
  const themes = [...new Set(images.flatMap(i => i.themes || []))];

  function populateSelect(select, list) {
    if (!select) return;
    select.innerHTML = "";
    const allOpt = document.createElement("option");
    allOpt.value = "";
    allOpt.textContent = "All";
    select.appendChild(allOpt);
    list.sort().forEach(item => {
      const opt = document.createElement("option");
      opt.value = item;
      opt.textContent = item;
      select.appendChild(opt);
    });
  }

  populateSelect(continentSelect, continents);
  populateSelect(countrySelect, countries);
  populateSelect(locationSelect, locations);
  populateSelect(disasterSelect, disasters);

  if (themeContainer) {
    themeContainer.innerHTML = "";
    themes.sort().forEach(theme => {
      const label = document.createElement("label");
      label.className = "theme-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = theme;

      label.appendChild(checkbox);
      label.append(" " + theme);
      themeContainer.appendChild(label);
    });
  }

  function applyFilters() {
    let filtered = [...images];

    const search = searchBox?.value.toLowerCase() || "";
    const sort = sortSelect?.value || "alpha";
    const continent = continentSelect?.value || "";
    const country = countrySelect?.value || "";
    const location = locationSelect?.value || "";
    const disaster = disasterSelect?.value || "";

    const selectedThemes = themeContainer
      ? [...themeContainer.querySelectorAll("input:checked")].map(cb => cb.value)
      : [];

    if (search) {
      filtered = filtered.filter(i =>
        i.name.toLowerCase().includes(search) ||
        i.country.toLowerCase().includes(search) ||
        (i.location || "").toLowerCase().includes(search)
      );
    }

    if (continent) filtered = filtered.filter(i => i.continent === continent);
    if (country) filtered = filtered.filter(i => i.country === country);
    if (location) filtered = filtered.filter(i => i.location === location);
    if (disaster) filtered = filtered.filter(i => i.disaster === disaster);

    if (selectedThemes.length > 0) {
      filtered = filtered.filter(i =>
        selectedThemes.every(t => (i.themes || []).includes(t))
      );
    }

    if (sort === "alpha") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "year") {
      filtered.sort((a, b) => (a.year || 0) - (b.year || 0));
    } else if (sort === "theme") {
      filtered.sort((a, b) =>
        ((a.themes && a.themes[0]) || "").localeCompare(
          (b.themes && b.themes[0]) || ""
        )
      );
    }

    renderCallback(filtered);
  }

  resetBtn?.addEventListener("click", () => {
    if (searchBox) searchBox.value = "";
    if (sortSelect) sortSelect.value = "alpha";
    if (continentSelect) continentSelect.value = "";
    if (countrySelect) countrySelect.value = "";
    if (locationSelect) locationSelect.value = "";
    if (disasterSelect) disasterSelect.value = "";
    if (themeContainer) {
      themeContainer.querySelectorAll("input").forEach(cb => (cb.checked = false));
    }
    applyFilters();
  });

  [searchBox, sortSelect, continentSelect, countrySelect, locationSelect, disasterSelect]
    .filter(Boolean)
    .forEach(el => el.addEventListener("input", applyFilters));

  themeContainer?.addEventListener("change", applyFilters);

  applyFilters();
}
