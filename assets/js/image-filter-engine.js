// assets/js/image-filter-engine.js

export function initImageFilterEngine(data, onFilterChange) {
  const searchInput = document.getElementById('ife-search');
  const sortSelect = document.getElementById('ife-sort');
  const continentSelect = document.getElementById('ife-continent');
  const countrySelect = document.getElementById('ife-country');
  const disasterSelect = document.getElementById('ife-disaster');
  const themeSelect = document.getElementById('ife-theme');
  const yearSelect = document.getElementById('ife-year');
  
  // Updated ID to match standard engine naming conventions
  const clearBtn = document.getElementById('ife-clear') || document.getElementById('reset-filters');

  // 1. Dynamic Dropdown Populations
  function populateDropdown(selectElement, items, propertyName, selectedValue) {
    if (!selectElement) return;
    
    // Clear existing options except the placeholder ("All ...")
    while (selectElement.options.length > 1) {
      selectElement.remove(1);
    }
    
    const uniqueValues = [...new Set(items.map(item => item[propertyName]).filter(val => val !== undefined && val !== null && val !== ""))];
    uniqueValues.sort((a, b) => b.toString().localeCompare(a.toString()));
    
    uniqueValues.forEach(val => {
      selectElement.add(new Option(val, val));
    });

    // Reapply previous selection if it's still available in the new subset
    if (selectedValue && uniqueValues.includes(selectedValue)) {
      selectElement.value = selectedValue;
    } else {
      selectElement.value = '';
    }
  }

  function populateThemeDropdown(selectElement, items, selectedValue) {
    if (!selectElement) return;
    while (selectElement.options.length > 1) {
      selectElement.remove(1);
    }
    const uniqueThemes = [...new Set(items.flatMap(item => item.themes || []).filter(Boolean))];
    uniqueThemes.sort().forEach(t => selectElement.add(new Option(t, t)));

    if (selectedValue && uniqueThemes.includes(selectedValue)) {
      selectElement.value = selectedValue;
    } else {
      selectElement.value = '';
    }
  }

  // 2. Filter Processor
  function processData(triggeredByElement = null) {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const sortVal = sortSelect ? sortSelect.value : 'yearmonth';
    const continentVal = continentSelect ? continentSelect.value : '';
    const countryVal = countrySelect ? countrySelect.value : '';
    const disasterVal = disasterSelect ? disasterSelect.value : '';
    const themeVal = themeSelect ? themeSelect.value : '';
    const yearVal = yearSelect ? yearSelect.value : '';

    // Step A: Calculate filtered results
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

    // Step B: Update sibling dropdown choices contextually 
    // We avoid altering the dropdown that the user is actively clicking
    if (triggeredByElement !== continentSelect) {
      // Find what values are valid based on ALL other active filters
      const continentSubset = data.filter(item => {
        return (!query || (item.name && item.name.toLowerCase().includes(query))) &&
               (!countryVal || item.country === countryVal) &&
               (!disasterVal || item.disaster === disasterVal) &&
               (!yearVal || String(item.year) === yearVal) &&
               (!themeVal || (item.themes && item.themes.includes(themeVal)));
      });
      populateDropdown(continentSelect, continentSubset, 'continent', continentVal);
    }

    if (triggeredByElement !== countrySelect) {
      const countrySubset = data.filter(item => {
        return (!query || (item.name && item.name.toLowerCase().includes(query))) &&
               (!continentVal || item.continent === continentVal) &&
               (!disasterVal || item.disaster === disasterVal) &&
               (!yearVal || String(item.year) === yearVal) &&
               (!themeVal || (item.themes && item.themes.includes(themeVal)));
      });
      populateDropdown(countrySelect, countrySubset, 'country', countryVal);
    }

    if (triggeredByElement !== disasterSelect) {
      const disasterSubset = data.filter(item => {
        return (!query || (item.name && item.name.toLowerCase().includes(query))) &&
               (!continentVal || item.continent === continentVal) &&
               (!countryVal || item.country === countryVal) &&
               (!yearVal || String(item.year) === yearVal) &&
               (!themeVal || (item.themes && item.themes.includes(themeVal)));
      });
      populateDropdown(disasterSelect, disasterSubset, 'disaster', disasterVal);
    }

    if (triggeredByElement !== themeSelect) {
      const themeSubset = data.filter(item => {
        return (!query || (item.name && item.name.toLowerCase().includes(query))) &&
               (!continentVal || item.continent === continentVal) &&
               (!countryVal || item.country === countryVal) &&
               (!disasterVal || item.disaster === disasterVal) &&
               (!yearVal || String(item.year) === yearVal);
      });
      populateThemeDropdown(themeSelect, themeSubset, themeVal);
    }

    if (triggeredByElement !== yearSelect) {
      const yearSubset = data.filter(item => {
        return (!query || (item.name && item.name.toLowerCase().includes(query))) &&
               (!continentVal || item.continent === continentVal) &&
               (!countryVal || item.country === countryVal) &&
               (!disasterVal || item.disaster === disasterVal) &&
               (!themeVal || (item.themes && item.themes.includes(themeVal)));
      });
      populateDropdown(yearSelect, yearSubset, 'year', yearVal);
    }

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

  // 4. Event listeners passing the element context
  if (searchInput) searchInput.addEventListener('input', () => processData(searchInput));
  if (sortSelect) sortSelect.addEventListener('change', () => processData(sortSelect));
  if (continentSelect) continentSelect.addEventListener('change', () => processData(continentSelect));
  if (countrySelect) countrySelect.addEventListener('change', () => processData(countrySelect));
  if (disasterSelect) disasterSelect.addEventListener('change', () => processData(disasterSelect));
  if (themeSelect) themeSelect.addEventListener('change', () => processData(themeSelect));
  if (yearSelect) yearSelect.addEventListener('change', () => processData(yearSelect));

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (sortSelect) sortSelect.value = 'yearmonth';
      
      // Clear out selection completely to force full rebuild
      if (continentSelect) continentSelect.value = '';
      if (countrySelect) countrySelect.value = '';
      if (disasterSelect) disasterSelect.value = '';
      if (themeSelect) themeSelect.value = '';
      if (yearSelect) yearSelect.value = '';
      
      processData();
    });
  }

  // Initial render options setup
  populateDropdown(continentSelect, data, 'continent', '');
  populateDropdown(countrySelect, data, 'country', '');
  populateDropdown(disasterSelect, data, 'disaster', '');
  populateDropdown(yearSelect, data, 'year', '');
  populateThemeDropdown(themeSelect, data, '');
  
  processData();
}