export function initFilters(items, onChange) {
  const fSort = document.getElementById("sort-select");
  const fContinent = document.getElementById("filter-continent");
  const fCountry = document.getElementById("filter-country");
  const fLocation = document.getElementById("filter-location");
  const fDisaster = document.getElementById("filter-disaster");
  const fTheme = document.getElementById("filter-theme");
  const fModality = document.getElementById("filter-modality");
  const btnReset = document.getElementById("reset-filters");

  /* -----------------------------
     POPULATE SELECT OPTIONS
  ----------------------------- */
  function fill(select, values) {
    const unique = [...new Set(values)].filter(Boolean).sort();
    const current = select.value;

    select.innerHTML = `<option value="">All</option>`;
    unique.forEach(v => select.innerHTML += `<option value="${v}">${v}</option>`);

    if (unique.includes(current)) select.value = current;
  }

  function populate(list) {
    fill(fContinent, list.map(i => i.continent));
    fill(fCountry, list.map(i => i.country));
    fill(fLocation, list.map(i => i.location));
    fill(fDisaster, list.map(i => i.disaster));
    fill(fTheme, list.flatMap(i => i.themes));
    fill(fModality, list.map(i => i.modality));
  }

  /* -----------------------------
     APPLY FILTERS
  ----------------------------- */
  function apply() {
    let filtered = items.filter(i =>
      (fContinent.value === "" || i.continent === fContinent.value) &&
      (fCountry.value === "" || i.country === fCountry.value) &&
      (
        fLocation.value === "" ||
        (i.location && i.location === fLocation.value)
      ) &&
      (fDisaster.value === "" || i.disaster === fDisaster.value) &&
      (fTheme.value === "" || i.themes.includes(fTheme.value)) &&
      (fModality.value === "" || i.modality === fModality.value)
    );

    // Repopulate dropdowns based on filtered list
    populate(filtered);

    // SORTING
    if (fSort.value === "alpha") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (fSort.value === "year") {
      filtered.sort((a, b) => Number(b.year) - Number(a.year));
    }

    if (fSort.value === "yearmonth") {
      const monthNum = m => ({
        january:1,february:2,march:3,april:4,may:5,june:6,
        july:7,august:8,september:9,october:10,november:11,december:12
      }[String(m).toLowerCase()] || 0);

      filtered.sort((a, b) =>
        Number(b.year) - Number(a.year) ||
        monthNum(b.month) - monthNum(a.month)
      );
    }

    if (fSort.value === "theme") {
      filtered.sort((a, b) => {
        const aTheme = a.themes[0] || "";
        const bTheme = b.themes[0] || "";
        return aTheme.localeCompare(bTheme);
      });
    }

    onChange(filtered);
  }

  /* -----------------------------
     EVENT LISTENERS
  ----------------------------- */
  fSort.onchange =
  fContinent.onchange =
  fCountry.onchange =
  fLocation.onchange =
  fDisaster.onchange =
  fTheme.onchange =
  fModality.onchange = apply;

  btnReset.onclick = () => {
    fSort.value = "yearmonth";
    fContinent.value = "";
    fCountry.value = "";
    fLocation.value = "";
    fDisaster.value = "";
    fTheme.value = "";
    fModality.value = "";
    apply();
  };

  populate(items);
  apply();
}
