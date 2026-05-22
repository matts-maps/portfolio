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

<div class="gallery-grid" id="gallery-grid"></div>

<script type="module">
  import { images } from "{{ site.baseurl }}/assets/js/gallery-data.js";
  import { renderGallery } from "{{ site.baseurl }}/assets/js/gallery.js";

  renderGallery(images);
</script>
