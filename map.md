---
layout: default
title: Map
permalink: /map/
---

<section class="hero">
  <h1>Map view</h1>
  <p>Explore all maps by location. Click a marker to view the map.</p>
</section>

<div id="map-container">
  <div id="map"></div>
</div>

<!-- LIGHTBOX JUST FOR THE MAP PAGE (does NOT touch homepage lightbox) -->
<div id="map-lightbox" class="lightbox hidden">
  <span id="map-lightbox-close">&times;</span>

  <div id="map-lightbox-viewer">
    <img id="map-lightbox-img" src="">
  </div>

  <div id="map-lightbox-caption"></div>
</div>

<!-- Leaflet CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">

<!-- MarkerCluster CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster/dist/MarkerCluster.css">
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster/dist/MarkerCluster.Default.css">

<!-- Leaflet JS -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<!-- MarkerCluster JS -->
<script src="https://unpkg.com/leaflet.markercluster/dist/leaflet.markercluster.js"></script>

<!-- Map logic -->
<script type="module">
  import { images } from "{{ '/assets/js/gallery-data.js' | relative_url }}";
  import initMap from "{{ '/assets/js/map-gallery.js' | relative_url }}";

  initMap(images);
</script>
