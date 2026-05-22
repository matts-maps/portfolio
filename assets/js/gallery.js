export function initGallery(images) {
  const container = document.getElementById("gallery-grid");

  const base = window.location.origin + "/portfolio/";

  // Build dropdown options
  populateFilters(images);

  // Render initial gallery
  render(images);

  // Attach filter listeners
  document.getElementById("filter-continent").addEventListener("change", applyFilters);
  document.getElementById("filter-theme").addEventListener("change", applyFilters);
  document.getElementById("filter-disaster").addEventListener("change", applyFilters);
  document.getElementById("filter-year").addEventListener("change", applyFilters);

  function applyFilters() {
    const c = document.getElementById("filter-continent").value;
    const t = document.getElementById("filter-theme").value;
    const d = document.getElementById("filter-disaster").value;
    const y = document.getElementById("filter-year").value;

    const filtered = images.filter(item => {
      return (
        (c === "" || item.continent === c) &&
        (t === "" || item.themes.includes(t)) &&
        (d === "" || item.disaster === d) &&
        (y === "" || item.year.toString() === y)
      );
    });

    render(filtered);
  }

  function render(list) {
    container.innerHTML = "";

    list.forEach(item => {
      const card = document.createElement("div");
      card.className = "gallery-card";

      const thumbPath = item.file.replace(
        "assets/images/maps/",
        "assets/images/maps/thumbs/"
      );

      const imgSrc = base + thumbPath.replace(/^\/+/, "");

      card.innerHTML = `
        <img src="${imgSrc}" alt="${item.name}">
        <h3>${item.name}</h3>
        <p>${item.location || item.country || ""}</p>
      `;

      container.appendChild(card);
    });
  }
}

function populateFilters(images) {
  const continents = new Set();
  const themes = new Set();
  const disasters = new Set();
  const years = new Set();

  images.forEach(i => {
    continents.add(i.continent);
    i.themes.forEach(t => themes.add(t));
    disasters.add(i.disaster);
    years.add(i.year);
  });

  fill("filter-continent", continents);
  fill("filter-theme", themes);
  fill("filter-disaster", disasters);
  fill("filter-year", years);

  function fill(id, set) {
    const select = document.getElementById(id);
    [...set].sort().forEach(v => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });
  }
}
