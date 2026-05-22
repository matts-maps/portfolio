---
layout: default
title: Home
permalink: /
---

<div class="layout">
  
  <!-- LEFT FILTER PANEL -->
  <aside id="filter-panel">
    <h2>Filters</h2>

    <input id="search-box" type="text" placeholder="Search maps…">

    <h3>Sort</h3>
    <select id="sort-select">
      <option value="alpha">Alphabetical</option>
      <option value="year">Year</option>
      <option value="theme">Theme</option>
    </select>

    <h3>Continent</h3>
    <select id="filter-continent"></select>

    <h3>Country</h3>
    <select id="filter-country"></select>

    <h3>Location</h3>
    <select id="filter-location"></select>

    <h3>Themes</h3>
    <div id="filter-themes"></div>

    <h3>Disaster</h3>
    <select id="filter-disaster"></select>

    <h3>Year</h3>
    <select id="filter-year"></select>

  </aside>

  <!-- RIGHT MASONRY GRID -->
  <div class="gallery-grid" id="gallery-grid"></div>

</div>

<script type="module">
  import { images } from "{{ site.baseurl }}/assets/js/gallery-data.js";
  import { initGallery } from "{{ site.baseurl }}/assets/js/gallery.js";

  initGallery(images);
</script>
