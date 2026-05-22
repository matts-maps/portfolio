// assets/js/gallery.js
// Entry module for the gallery page

import { images } from "./gallery-data.js";
import { initGalleryFilters } from "./gallery-filters.js";
import { initLightbox } from "./lightbox.js";

function renderGallery(list) {
  const gallery = document.getElementById("gallery");
  if (!gallery) return;

  gallery.innerHTML = "";

  list.forEach(item => {
    const card = document.createElement("article");
    card.className = "gallery-item";
    card.setAttribute("data-lightbox-item", "true");

    card.innerHTML = `
      <img src="${item.file}" alt="${item.name}">
      <h3>${item.name}</h3>
      <p>${item.country || ""}${item.location ? " — " + item.location : ""}</p>
    `;

    gallery.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initGalleryFilters(images, renderGallery);
  initLightbox("#gallery");
});
