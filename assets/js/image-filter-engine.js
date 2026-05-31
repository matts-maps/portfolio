// assets/js/image-filter-engine.js

export function initImageFilterEngine(data, onFilterChange) {
  const searchInput = document.getElementById('ife-search');
  const sortSelect = document.getElementById('ife-sort');
  const continentSelect = document.getElementById('ife-continent');
  const countrySelect = document.getElementById('ife-country');
  const disasterSelect = document.getElementById('ife-disaster');
  const themeSelect = document.getElementById('ife-theme');
  const yearSelect = document.getElementById('ife-year');
  const clearBtn = document.getElementById('ife-clear');

  // 1. Dynamic Dropdown Populations
  function populateDropdown(selectElement, items, propertyName) {
    if (!selectElement) return;
    // Clear existing options except the first one (e.g., "All ...")
    while (selectElement.options.length > 1) {
      selectElement.remove(1);
    }
    const uniqueValues = [...new Set(items.map(item => item[propertyName]).filter(val => val !== undefined && val !== null && val !== ""))];
    uniqueValues.sort((a, b) => b.toString().localeCompare(a.toString()));
    uniqueValues.forEach(val => selectElement.add(new Option(val, val)));
  }

  populateDropdown(continentSelect, data, 'continent');
  populateDropdown(countrySelect, data, 'country');
  populateDropdown(disasterSelect, data, 'disaster');
  populateDropdown(yearSelect, data, 'year');

  // Special extraction rule for handling the multi-string 'themes' array safely
  if (themeSelect) {
    const uniqueThemes = [...new Set(data.flatMap(item => item.themes || []).filter(Boolean))];
    uniqueThemes.sort().forEach(t => themeSelect.add(new Option(t, t)));
  }

  // 2. Filter Processor
  function processData() {
    // Safely fallback to an empty string if searchInput element doesn't exist
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const sortVal = sortSelect ? sortSelect.value : 'yearmonth';
    const continentVal = continentSelect ? continentSelect.value : '';
    const countryVal = countrySelect ? countrySelect.value : '';
    const disasterVal = disasterSelect ? disasterSelect.value : '';
    const themeVal = themeSelect ? themeSelect.value : '';
    const yearVal = yearSelect ? yearSelect.value : '';

    const results = data.filter(item => {
      const matchesSearch = !query || 
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.country && item.country.toLowerCase().includes(query)) ||
        (item.location && item.location.toLowerCase().includes(query));

      const matchesContinent = !continentVal || item.continent === continentVal;
      const matchesCountry = !countryVal || item.country === countryVal;
      const matchesDisaster = !disasterVal || item.disaster === disasterVal;
      const matchesYear = !yearVal || String(item.year) === yearVal;
      const matchesTheme = !themeVal || (item.themes && item.themes.includes(themeVal));

      return matchesSearch && matchesContinent && matchesCountry && matchesDisaster && matchesYear && matchesTheme;
    });

    // 3. Sorting Execution
    if (sortVal === 'alpha') {
      results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortVal === 'theme') {
      results.sort((a, b) => ((a.themes && a.themes[0]) || '').localeCompare((b.themes && b.themes[0]) || ''));
    } else if (sortVal === 'yearmonth') {
      results.sort((a, b) => {
        const yearDiff = (parseInt(b.year) || 0) - (parseInt(a.year) || 0);
        if (yearDiff !== 0) return yearDiff;
        return (parseInt(b.month) || 0) - (parseInt(a.month) || 0);
      });
    }

    onFilterChange(results);
  }

  // 4. Event listeners
  if (searchInput) searchInput.addEventListener('input', processData);
  if (sortSelect) sortSelect.addEventListener('change', processData);
  if (continentSelect) continentSelect.addEventListener('change', processData);
  if (countrySelect) countrySelect.addEventListener('change', processData);
  if (disasterSelect) disasterSelect.addEventListener('change', processData);
  if (themeSelect) themeSelect.addEventListener('change', processData);
  if (yearSelect) yearSelect.addEventListener('change', processData);

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (sortSelect) sortSelect.value = 'yearmonth';
      if (continentSelect) continentSelect.value = '';
      if (countrySelect) countrySelect.value = '';
      if (disasterSelect) disasterSelect.value = '';
      if (themeSelect) themeSelect.value = '';
      if (yearSelect) yearSelect.value = '';
      processData();
    });
  }

  // Initial render
  processData();
}