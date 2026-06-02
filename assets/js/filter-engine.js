export function initFilters(items, onChange) {
  const fSort = document.getElementById("sort-select");
  const fContinent = document.getElementById("filter-continent");
  const fCountry = document.getElementById("filter-country");
  const fDisaster = document.getElementById("filter-disaster"); // <-- Array conversion implemented
  const fType = document.getElementById("filter-type"); 
  const fModality = document.getElementById("filter-modality");
  const fLevel = document.getElementById("filter-level"); 
  const fStatus = document.getElementById("filter-status");   
  const btnReset = document.getElementById("reset-filters");

  /* -----------------------------
      POPULATE SELECT OPTIONS
  ----------------------------- */
  function fill(select, values) {
    if (!select) return; // Guard check in case element isn't in DOM yet
    const unique = [...new Set(values)].filter(Boolean).sort();
    const current = select.value;

    select.innerHTML = `<option value="">All</option>`;
    unique.forEach(v => select.innerHTML += `<option value="${v}">${v}</option>`);

    if (unique.includes(current)) select.value = current;
  }

  function populate(list) {
    fill(fContinent, list.map(i => i.continent));
    
    fill(
      fCountry, 
      list.flatMap(i => Array.isArray(i.country) ? i.country : [i.country])
    );
    
    // CHANGED: Flatten the disaster array values for the dropdown selection
    fill(
      fDisaster,
      list.flatMap(i => Array.isArray(i.disaster) ? i.disaster : [i.disaster])
    );

    fill(fType, list.map(i => i.type));
    
    fill(
      fModality,
      list.flatMap(i => Array.isArray(i.modality) ? i.modality : [i.modality])
    );

    fill(
      fLevel,
      list.flatMap(i => Array.isArray(i.level) ? i.level : [i.level])
    );

    fill(fStatus, list.map(i => i.status));
  }

  /* -----------------------------
      THE FILTER EXECUTION
  ----------------------------- */
  function applyFilters() {
    const filtered = items.filter(i => {
      // 1. Continent
      if (fContinent.value && i.continent !== fContinent.value) return false;

      // 2. Country (Array support)
      if (fCountry.value) {
        const countries = Array.isArray(i.country) ? i.country : [i.country];
        if (!countries.includes(fCountry.value)) return false;
      }

      // 3. CHANGED: Disaster (Array support using .includes)
      if (fDisaster.value) {
        const disasters = Array.isArray(i.disaster) ? i.disaster : [i.disaster];
        if (!disasters.includes(fDisaster.value)) return false;
      }

      // 4. Type
      if (fType.value && i.type !== fType.value) return false;

      // 5. Modality (Array support)
      if (fModality.value) {
        const modalities = Array.isArray(i.modality) ? i.modality : [i.modality];
        if (!modalities.includes(fModality.value)) return false;
      }

      // 6. Level (Array support)
      if (fLevel && fLevel.value) {
        const levels = Array.isArray(i.level) ? i.level : [i.level];
        if (!levels.includes(fLevel.value)) return false;
      }

      // 7. Status
      if (fStatus.value && i.status !== fStatus.value) return false;

      return true;
    });

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

    if (fSort.value === "type") { 
      filtered.sort((a, b) => {
        const aType = a.type || ""; 
        const bType = b.type || ""; 
        return aType.localeCompare(bType);
      });
    }

    onChange(filtered);
  }

  /* -----------------------------
      LISTENERS & INITIALIZATION
  ----------------------------- */
  const filters = [fSort, fContinent, fCountry, fDisaster, fType, fModality, fLevel, fStatus];
  filters.forEach(f => {
    if (f) f.addEventListener("change", applyFilters);
  });

  if (btnReset) {
    btnReset.addEventListener("click", () => {
      filters.forEach(f => {
        if (f) f.value = "";
      });
      applyFilters();
    });
  }

  // Initial Run
  populate(items);
  applyFilters();
}