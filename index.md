---
layout: default
title: Home
permalink: /
---

<!-- FILTER BAR ACROSS THE TOP -->
<div id="filter-bar" class="filter-bar">

  <input id="search-box" type="text" placeholder="Search maps…">

  <select id="sort-select">
    <option value="alpha">Alphabetical</option>
    <option value="year">Year</option>
    <option value="theme">Theme</option>
  </select>

  <select id="filter-continent"></select>
  <select id="filter-country"></select>
  <select id="filter-location"></select>

  <div id="filter-themes" class="theme-checkboxes"></div>

  <select id="filter-disaster"></select>
  <select id="filter-year"></select>

</div>

<!-- MASONRY GRID -->
<div class="gallery-grid" id="gallery-grid"></div>

<script type="module">
  import { images } from "{{ site.baseurl }}/assets/js/gallery-data.js";
  import { initGallery } from "{{ site.baseurl }}/assets/js/gallery.js";

  initGallery(images);
</script>
