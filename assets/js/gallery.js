export function renderGallery(images) {
  const container = document.getElementById("gallery-grid");

  images.forEach(item => {
    const card = document.createElement("div");
    card.className = "gallery-card";

    card.innerHTML = `
      <img src="{{ site.baseurl }}/${item.file}" alt="${item.name}">
      <h3>${item.name}</h3>
      <p>${item.location || item.country || ""}</p>
    `;

    container.appendChild(card);
  });
}
