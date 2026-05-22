import { images } from "{{ site.baseurl }}/assets/js/gallery-data.js";
import { applyFilters } from "{{ site.baseurl }}/assets/js/gallery-filters.js";
import { openLightbox } from "{{ site.baseurl }}/assets/js/lightbox.js";

const container = document.getElementById("gallery-grid");

function renderGallery(list) {
  container.innerHTML = "";

  list.forEach(img => {
    const el = document.createElement("img");
    el.src = `${img.file.startsWith("http") ? img.file : "{{ site.baseurl }}/" + img.file}`;
    el.alt = img.name;
    el.className = "gallery-thumb";

    el.addEventListener("click", () => openLightbox(img));
    container.appendChild(el);
  });
}

renderGallery(images);
applyFilters(images, renderGallery);
