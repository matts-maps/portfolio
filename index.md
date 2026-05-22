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

<div id="filters" class="filter-bar">
  <select id="filter-continent">
    <option value="">All Continents</option>
  </select>

  <select id="filter-theme">
    <option value="">All Themes</option>
  </select>

  <select id="filter-disaster">
    <option value="">All Disasters</option>
  </select>

  <select id="filter-year">
    <option value="">All Years</option>
  </select>
</div>

<div class="gallery-grid" id="gallery-grid"></div>

<script type="module">
  import { images } from "{{ site.baseurl }}/assets/js/gallery-data.js";
  import { initGallery } from "{{ site.baseurl }}/assets/js/gallery.js";

  initGallery(images);
</script>

