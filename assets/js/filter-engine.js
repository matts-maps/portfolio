export function initFilters(items, onChange) {
  const fSort = document.getElementById("sort-select");
  const fContinent = document.getElementById("filter-continent");
  const fCountry = document.getElementById("filter-country");
  const fDisaster = document.getElementById("filter-disaster");
  const fType = document.getElementById("filter-type"); // CHANGED: selector for type instead of theme
  const fModality = document.getElementById("filter-modality");
  const fStatus = document.getElementById("filter-status");   
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
    fill(fDisaster, list.map(i => i.disaster));
    fill(fType, list.map(i => i.type)); // CHANGED: maps direct string values from i.type

    // Modality is an array → flatten it
    fill(
      fModality,
      list.flatMap(i => Array.isArray(i.modality) ? i.modality : [i.modality])
    );

    // Status filter
    fill(fStatus, list.map(i => i.status));
  }

  /* -----------------------------
      APPLY FILTERS
  ----------------------------- */
  function apply() {
    let filtered = items.filter(i => {
      const matchContinent = fContinent.value === "" || i.continent === fContinent.value;
      const matchCountry = fCountry.value === "" || i.country === fCountry.value;
      const matchDisaster = fDisaster.value === "" || i.disaster === fDisaster.value;
      const matchType = fType.value === "" || i.type === fType.value; // CHANGED: string value equality check

      // Correct modality matching for arrays
      const matchModality =
        fModality.value === "" ||
        (Array.isArray(i.modality)
          ? i.modality.includes(fModality.value)
          : i.modality === fModality.value);

      // Status filter
      const matchStatus = fStatus.value === "" || i.status === fStatus.value;

      return (
        matchContinent &&
        matchCountry &&
        matchDisaster &&
        matchType && // CHANGED
        matchModality &&
        matchStatus
      );
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

    // CHANGED: Sort alphabetically by Type category string instead of Theme array values
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
      EVENT LISTENERS
  ----------------------------- */
  fSort.onchange =
  fContinent.onchange =
  fCountry.onchange =
  fDisaster.onchange =
  fType.onchange = // CHANGED
  fModality.onchange =
  fStatus.onchange = apply;

  btnReset.onclick = () => {
    fSort.value = "yearmonth";
    fContinent.value = "";
    fCountry.value = "";
    fDisaster.value = "";
    fType.value = ""; // CHANGED
    fModality.value = "";
    fStatus.value = "";   
    apply();
  };

  populate(items);
  apply();
}