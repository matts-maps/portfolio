---
layout: default
title: Home
permalink: /
---

<section class="hero">
  <h1>Welcome</h1>
  <p>Explore maps, projects, and geospatial work.</p>
</section>

<h2 class="section-title">Latest Maps</h2>

<div id="filter-bar" class="filter-bar">

  <!-- ROW 1 -->
  <div class="filter-row row-1">
    <label class="search-label">
      Search
      <input id="search-box" type="text" placeholder="Search maps…">
    </label>

    <button id="clear-filters" class="clear-btn">Clear Filters</button>
  </div>

  <!-- ROW 2 -->
  <div class="filter-row row-2">

    <label>
      Sort
      <select id="sort-select">
        <option value="yearmonth">Newest → Oldest</option>
        <option value="alpha">A → Z</option>
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
      Disaster
      <select id="filter-disaster"></select>
    </label>

    <label>
      Themes
      <select id="filter-theme"></select>
    </label>

  </div>

</div>

<div class="gallery-grid" id="gallery-grid"></div>

<!-- LIGHTBOX -->
<div id="lightbox" class="lightbox hidden">

  <span id="lightbox-close">&times;</span>

  <button id="lightbox-prev" class="lightbox-nav">&#10094;</button>
  <button id="lightbox-next" class="lightbox-nav">&#10095;</button>

  <div id="zoom-controls">
    <button id="zoom-in" class="zoom-btn">+</button>
    <button id="zoom-out" class="zoom-btn">−</button>
    <button id="zoom-reset" class="zoom-btn">Reset</button>
  </div>

  <div id="lightbox-viewer">
    <img id="lightbox-img" src="">
  </div>

  <div id="lightbox-caption"></div>
</div>

<script type="module">
  import { images } from "{{ site.baseurl }}/assets/js/gallery-data.js";
  import { initGallery } from "{{ site.baseurl }}/assets/js/gallery.js";

  initGallery(images);
</script>
