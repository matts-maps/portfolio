const container = document.getElementById("gallery-grid");

galleryData.forEach(item => {
  const card = document.createElement("div");
  card.className = "gallery-card";

  card.innerHTML = `
    <img src="${item.image}" alt="${item.name}">
    <h3>${item.name}</h3>
    <p>${item.description || ""}</p>
  `;

  container.appendChild(card);
});
