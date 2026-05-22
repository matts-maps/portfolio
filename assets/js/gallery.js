(function () {
  const container = document.getElementById("gallery");
  if (!container || !window.GALLERY_ITEMS || !window.FilterUtils) return;

  function render() {
    const items = window.FilterUtils.applyFiltersToItems(window.GALLERY_ITEMS);
    container.innerHTML = "";
    items.forEach((item) => {
      const div = document.createElement("div");
      div.className = "gallery-item";
      div.dataset.id = item.id;
      div.innerHTML = `
        <img src="${item.image}" alt="${item.title}">
        <div class="gallery-item-info">
          <div class="gallery-item-title">${item.title}</div>
          <div class="gallery-item-meta">${item.category} • ${item.tag}</div>
        </div>
      `;
      div.addEventListener("click", () => {
        if (window.Lightbox) {
          window.Lightbox.open(item);
        }
      });
      container.appendChild(div);
    });
  }

  window.addEventListener("filters:changed", render);
  render();
})();
