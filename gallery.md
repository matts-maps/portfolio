---
layout: default
title: Gallery
permalink: /gallery/
---

<div id="gallery-page-wrapper">

  <!-- Full filter bar (same as homepage) -->
  <div class="filter-bar">
    <input id="filter-search" type="text" placeholder="Search maps…">

    <select id="filter-sort">
      <option value="default">Sort</option>
      <option value="alpha">Alphabetical</option>
      <option value="year">Year (Newest)</option>
    </select>

    <select id="filter-continent">
      <option value="">Continent</option>
    </select>

    <select id="filter-country">
      <option value="">Country</option>
    </select>

    <select id="filter-location">
      <option value="">Location</option>
    </select>

    <select id="filter-disaster">
      <option value="">Disaster</option>
    </select>

    <select id="filter-theme">
      <option value="">Theme</option>
    </select>

    <button id="clear-filters">Clear filters</button>
  </div>

  <!-- Gallery grid -->
  <div id="gallery-grid"></div>

</div>

<!-- Data + logic -->
<script src="{{ '/assets/js/gallery-data.js' | relative_url }}"></script>
<script src="{{ '/assets/js/gallery.js' | relative_url }}"></script>
