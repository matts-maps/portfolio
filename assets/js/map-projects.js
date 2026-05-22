import { projects } from "{{ site.baseurl }}/assets/js/projects-data.js";

function initProjectsMap() {
  const map = L.map("projects-map").setView([20, 0], 2);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
  }).addTo(map);

  projects.forEach(p => {
    const marker = L.marker([p.lat, p.lng]).addTo(map);

    marker.on("click", () => {
      const panel = document.getElementById("project-info");
      panel.innerHTML = `
        <h2>${p.title}</h2>
        <p>${p.description}</p>
        <p><strong>Location:</strong> ${p.location}</p>
        <a href="${p.link}" target="_blank">View project</a>
      `;
    });
  });
}

document.addEventListener("DOMContentLoaded", initProjectsMap);
