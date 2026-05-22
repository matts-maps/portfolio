// assets/js/map-projects.js
// Entry module for the projects map page

import { projects } from "./projects-data.js";

function initProjectsMap() {
  const mapContainer = document.getElementById("projects-map");
  if (!mapContainer) return;

  const map = L.map("projects-map").setView([20, 0], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  const sidebar = document.getElementById("project-info");

  projects.forEach(item => {
    if (typeof item.lat !== "number" || typeof item.lng !== "number") return;

    const marker = L.marker([item.lat, item.lng]).addTo(map);

    marker.on("click", () => {
      if (!sidebar) return;

      sidebar.innerHTML = `
        <h3>${item.name}</h3>
        <p><strong>Country:</strong> ${item.country || ""}</p>
        <p><strong>Location:</strong> ${item.location || ""}</p>
        <p><strong>Year:</strong> ${item.year || ""}</p>
        <p><strong>Type:</strong> ${item.type || ""}</p>
        <p>${item.description || ""}</p>
      `;
    });
  });
}

document.addEventListener("DOMContentLoaded", initProjectsMap);
