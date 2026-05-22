export function renderGallery(images) {
  const container = document.getElementById("gallery-grid");

  const base = window.location.origin + "/portfolio/";

  images.forEach(item => {
    const card = document.createElement("div");
    card.className = "gallery-card";

    const imgSrc = base + item.file.replace(/^\/+/, "");

    card.innerHTML = `
      <img src="${imgSrc}" alt="${item.name}">
      <h3>${item.name}</h3>
      <p>${item.location || item.country || ""}</p>
    `;

    container.appendChild(card);
  });
}
