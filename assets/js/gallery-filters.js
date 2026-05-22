export function applyFilters(images, render) {
  const search = document.getElementById("filter-search");
  const sort = document.getElementById("filter-sort");

  function update() {
    let list = [...images];

    if (search.value.trim() !== "") {
      const q = search.value.toLowerCase();
      list = list.filter(i => i.name.toLowerCase().includes(q));
    }

    if (sort.value === "alpha") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort.value === "year") {
      list.sort((a, b) => b.year - a.year);
    }

    render(list);
  }

  search.addEventListener("input", update);
  sort.addEventListener("change", update);
}
