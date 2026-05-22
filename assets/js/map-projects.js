import { projects } from "./projects-data.js";

function initProjectsMap() {
  const mapContainer = document.getElementById("projects-map");
  if (!mapContainer) return;

  const map = L.map("projects-map").setView([20, 0], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  projects.forEach(p => {
    if (typeof p.lat !== "number" || typeof p.lng !== "number") return;

    const marker = L.marker([p.lat, p.lng]).addTo(map);
    const title = p.name || "Project";
    const country = p.country || "";
    const org = p.organisation || "";
    const type = p.projectType || "";
    const level = p.level || "";

    marker.bindPopup(`
      <strong>${title}</strong><br>
      ${country}<br>
      ${org}${type ? " — " + type : ""}${level ? "<br>" + level : ""}
    `);
  });
}

document.addEventListener("DOMContentLoaded", initProjectsMap);
