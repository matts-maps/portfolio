// assets/js/image-filter-engine.js

export function initImageFilterEngine(data, onFilterChange) {
  const searchInput = document.getElementById('ife-search');
  const sortSelect = document.getElementById('ife-sort');
  const continentSelect = document.getElementById('ife-continent');
  const countrySelect = document.getElementById('ife-country');
  const disasterSelect = document.getElementById('ife-disaster');
  const themeSelect = document.getElementById('ife-theme');
  const yearSelect = document.getElementById('ife-year');
  
  const clearBtn = document.getElementById('ife-clear') || document.getElementById('reset-filters');

  // Helper helper to normalize single strings or arrays cleanly into a standard flat array
  const getDisasterArray = (item) => {
    if (!item.disaster) return [];
    return Array.isArray(item.disaster) ? item.disaster : [item.disaster];
  };

  // 1. Dynamic Dropdown Populations
  function populateDropdown(selectElement, items, propertyName, selectedValue) {
    if (!selectElement) return;
    
    // Safely remove dynamically generated values while preserving "All" and custom group categories
    for (let i = selectElement.options.length - 1; i >= 0; i--) {
      const optVal = selectElement.options[i].value;
      if (optVal !== "" && optVal !== "tropical-cyclone") {
        selectElement.remove(i);
      }
    }
    
    // Use flatMap to read values whether they are strings or explicit arrays
    let uniqueValues = [];
    if (propertyName === 'disaster') {
      uniqueValues = [...new Set(items.flatMap(item => getDisasterArray(item)).filter(Boolean))];
    } else {
      uniqueValues = [...new Set(items.map(item => item[propertyName]).filter(val => val !== undefined && val !== null && val !== ""))];
    }
    
    // Filter out individual values covered by the tropical cyclone group item
    let finalValues = uniqueValues;
    if (propertyName === 'disaster') {
      finalValues = uniqueValues.filter(val => !['Cyclone', 'Hurricane', 'Typhoon'].includes(val));
    }
    
    finalValues.sort((a, b) => b.toString().localeCompare(a.toString()));
    
    finalValues.forEach(val => {
      selectElement.add(new Option(val, val));
    });

    // Reapply previous selection if it's still available in the new subset context
    if (selectedValue && (selectedValue === 'tropical-cyclone' || uniqueValues.includes(selectedValue))) {
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

  // Helper matching condition to check selection parameters against modern arrays or legacy string keys
  function itemMatchesDisaster(item, filterValue) {
    if (!filterValue) return true;
    const disasterList = getDisasterArray(item);
    
    if (filterValue === 'tropical-cyclone') {
      return disasterList.some(d => ['Cyclone', 'Hurricane', 'Typhoon'].includes(d));
    }
    return disasterList.includes(filterValue);
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
      const matchesDisaster = itemMatchesDisaster(item, disasterVal);
      const matchesYear = !yearVal || String(item.year) === yearVal;
      const matchesTheme = !themeVal || (item.themes && item.themes.includes(themeVal));

      return matchesSearch && matchesContinent && matchesCountry && matchesDisaster && matchesYear && matchesTheme;
    });

    // Step B: Update sibling dropdown choices contextually 
    if (triggeredByElement !== continentSelect) {
      const continentSubset = data.filter(item => {
        return (!query || (item.name && item.name.toLowerCase().includes(query))) &&
               (!countryVal || item.country === countryVal) &&
               itemMatchesDisaster(item, disasterVal) &&
               (!yearVal || String(item.year) === yearVal) &&
               (!themeVal || (item.themes && item.themes.includes(themeVal)));
      });
      populateDropdown(continentSelect, continentSubset, 'continent', continentVal);
    }

    if (triggeredByElement !== countrySelect) {
      const countrySubset = data.filter(item => {
        return (!query || (item.name && item.name.toLowerCase().includes(query))) &&
               (!continentVal || item.continent === continentVal) &&
               itemMatchesDisaster(item, disasterVal) &&
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
               itemMatchesDisaster(item, disasterVal) &&
               (!yearVal || String(item.year) === yearVal);
      });
      populateThemeDropdown(themeSelect, themeSubset, themeVal);
    }

    if (triggeredByElement !== yearSelect) {
      const yearSubset = data.filter(item => {
        return (!query || (item.name && item.name.toLowerCase().includes(query))) &&
               (!continentVal || item.continent === continentVal) &&
               (!countryVal || item.country === countryVal) &&
               itemMatchesDisaster(item, disasterVal) &&
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