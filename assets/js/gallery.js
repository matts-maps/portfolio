<script type="module" src="{{ '/assets/js/image-lightbox.js' | relative_url }}"></script>

<script type="module">
  import { images } from "{{ '/assets/js/image-data.js' | relative_url }}";
  import { renderGallery } from "{{ '/assets/js/gallery.js' | relative_url }}";

  renderGallery(images);
</script>