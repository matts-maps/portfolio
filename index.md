---
layout: default
title: Home
permalink: /
---

<section class="hero">
  <h1>Welcome</h1>
  <p>Explore maps, projects, and geospatial work.</p>
</section>

<h2>Latest Maps</h2>

<div id="filter-bar" class="filter-bar">

  <label>
    Search
    <input id="search-box" type="text" placeholder="Search maps…">
  </label>

  <label>
    Sort
    <select id="sort-select">
      <option value="year" selected>Year (Newest First)</option>
      <option value="alpha">Alphabetical</option>
      <option value="theme">Theme</option>
    </select>
  </label>

  <label>
    Continent
    <select id="filter-continent"></select>
  </label>

  <label>
    Country
    <select id="filter-country"></select>
  </label>

  <label>
    Location
    <select id="filter-location"></select>
  </label>

  <label>
    Themes
    <select id="filter-theme"></select>
  </label>

  <label>
    Disaster
    <select id="filter-disaster"></select>
  </label>

  <button id="clear-filters" class="clear-btn">Clear Filters</button>

</div>

<div class="gallery-grid" id="gallery-grid"></div>

<script type="module">
  import { images } from "{{ site.baseurl }}/assets/js/gallery-data.js";
  import { initGallery } from "{{ site.baseurl }}/assets/js/gallery.js";

  initGallery(images);
</script>


