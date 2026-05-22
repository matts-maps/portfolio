(function () {
  function getFilterValues() {
    const search = (document.getElementById("filter-search") || {}).value || "";
    const category = (document.getElementById("filter-category") || {}).value || "";
    const tag = (document.getElementById("filter-tag") || {}).value || "";
    return { search: search.toLowerCase(), category, tag };
  }

  function applyFiltersToItems(items) {
    const { search, category, tag } = getFilterValues();
    return items.filter((item) => {
      const matchesSearch =
        !search ||
        (item.title && item.title.toLowerCase().includes(search)) ||
        (item.description && item.description.toLowerCase().includes(search));
      const matchesCategory = !category || item.category === category;
      const matchesTag = !tag || item.tag === tag;
      return matchesSearch && matchesCategory && matchesTag;
    });
  }

  window.FilterUtils = {
    getFilterValues,
    applyFiltersToItems
  };

  ["filter-search", "filter-category", "filter-tag"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      const event = new CustomEvent("filters:changed");
      window.dispatchEvent(event);
    });
    el.addEventListener("change", () => {
      const event = new CustomEvent("filters:changed");
      window.dispatchEvent(event);
    });
  });
})();
