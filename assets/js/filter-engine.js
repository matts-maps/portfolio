// Generic filter engine shared by the Projects page and the Home/Map pages.
// Each page supplies a config describing its own <select>/<input> ids, which
// data fields they filter, and which sort options it offers.

function toArray(v) {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

function monthNum(m) {
  if (!m) return 0;
  const parsed = parseInt(m, 10);
  if (!isNaN(parsed)) return parsed;
  const names = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
  };
  return names[String(m).toLowerCase()] || 0;
}

export const SORT = {
  alpha: (a, b) => (a.name || "").localeCompare(b.name || ""),
  year: (a, b) => (Number(b.year) || 0) - (Number(a.year) || 0),
  yearmonth: (a, b) =>
    (Number(b.year) || 0) - (Number(a.year) || 0) || monthNum(b.month) - monthNum(a.month),
  byField: key => (a, b) => (a[key] || "").localeCompare(b[key] || ""),
  byFirstOf: arrayKey => (a, b) =>
    ((a[arrayKey] && a[arrayKey][0]) || "").localeCompare((b[arrayKey] && b[arrayKey][0]) || "")
};

function matchesField(item, field, filterValue) {
  if (!filterValue) return true;
  const raw = item[field.prop];

  if (field.groups && field.groups[filterValue]) {
    const itemValues = field.arrayValued ? toArray(raw) : [raw];
    return itemValues.some(v => field.groups[filterValue].includes(v));
  }

  if (field.arrayValued) return toArray(raw).includes(filterValue);

  return String(raw ?? "") === filterValue;
}

function matchesSearch(item, query, searchFields) {
  if (!query) return true;
  return searchFields.some(prop =>
    toArray(item[prop]).some(v => String(v).toLowerCase().includes(query))
  );
}

function populateSelect(selectEl, rawValues, selectedValue, { preserve = [], excludeRaw = [], order = "asc" } = {}) {
  if (!selectEl) return;

  const unique = [...new Set(rawValues)]
    .filter(v => v !== undefined && v !== null && v !== "")
    .filter(v => !excludeRaw.includes(v));

  const sorted = order === "desc-numeric"
    ? unique.sort((a, b) => Number(b) - Number(a))
    : unique.sort((a, b) => a.toString().localeCompare(b.toString()));

  for (let i = selectEl.options.length - 1; i >= 0; i--) {
    const val = selectEl.options[i].value;
    if (val !== "" && !preserve.includes(val)) selectEl.remove(i);
  }

  sorted.forEach(v => selectEl.add(new Option(v, v)));

  const validValues = new Set([...sorted.map(String), ...preserve]);
  selectEl.value = selectedValue && validValues.has(selectedValue) ? selectedValue : "";
}

function resetControl(el) {
  if (!el) return;
  el.value = el.tagName === "SELECT" && el.options.length ? el.options[0].value : "";
}

export function initFilterEngine(items, onChange, config) {
  const {
    searchEl: searchElId,
    searchFields = [],
    sortEl: sortElId,
    resetEl: resetElId,
    fields = [],
    sort = {}
  } = config;

  const searchInput = searchElId ? document.getElementById(searchElId) : null;
  const sortSelect = sortElId ? document.getElementById(sortElId) : null;
  const resetBtn = resetElId ? document.getElementById(resetElId) : null;

  const controls = fields.map(field => ({
    ...field,
    prop: field.prop || field.key,
    el: document.getElementById(field.elId)
  }));

  function currentValues() {
    const values = {};
    controls.forEach(c => { values[c.key] = c.el ? c.el.value : ""; });
    return values;
  }

  function itemMatches(item, values, skipKey) {
    return controls.every(c => c.key === skipKey || matchesField(item, c, values[c.key]));
  }

  function apply() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const values = currentValues();

    const results = items.filter(item =>
      matchesSearch(item, query, searchFields) && itemMatches(item, values, null)
    );

    // Each dropdown's own options are computed from every filter EXCEPT its
    // own selection, so choosing a value never removes other choices from
    // that same dropdown.
    controls.forEach(c => {
      const subset = items.filter(item =>
        matchesSearch(item, query, searchFields) && itemMatches(item, values, c.key)
      );
      const rawValues = c.arrayValued
        ? subset.flatMap(item => toArray(item[c.prop]))
        : subset.map(item => item[c.prop]);

      populateSelect(c.el, rawValues, values[c.key], {
        preserve: c.groups ? Object.keys(c.groups) : [],
        excludeRaw: c.groups ? Object.values(c.groups).flat() : [],
        order: c.optionOrder || "asc"
      });
    });

    const comparator = sortSelect && sort[sortSelect.value];
    if (comparator) results.sort(comparator);

    onChange(results);
  }

  [sortSelect, searchInput, ...controls.map(c => c.el)].forEach(el => {
    if (!el) return;
    el.addEventListener(el.tagName === "INPUT" ? "input" : "change", apply);
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      resetControl(sortSelect);
      resetControl(searchInput);
      controls.forEach(c => resetControl(c.el));
      apply();
    });
  }

  apply();
}
