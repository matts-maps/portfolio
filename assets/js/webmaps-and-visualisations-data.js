// visualizations-data.js
export const visualizationProjects = [
  {
    name: "Humanitarian and environmental impact mapping to the La Soufrière volcanic eruption",
    continent: "Caribbean",
    country: ["Saint Vincent and the Grenadines"],
    location: "",
    year: 2021,
    month: 3,
    lat: 13.333333,
    lng: -61.183333,
    themes: ["Humanitarian", "Displacement"],
    disaster: "Volcano",
    description: "Interactive mapping and spatial visualizations capturing the environmental fallout and population displacement patterns following the La Soufrière eruption.",
    // No screenshot fallback properties needed if it embeds successfully
    links: [
      { 
        label: "La Soufrière volcano", 
        url: "https://mapaction.maps.arcgis.com/home/webscene/viewer.html?webscene=319c676a2b034edeb40ef3d00ac4fbcc&_ga=2.220957080.1405317380.1621374070-1796227178.1597106685" 
      }
    ]
  },

  {
    name: "Community Insights for COVID-19 Dashboard",
    continent: "Asia-Pacific",
    country: [],
    location: "",
    year: 2020,
    month: 6,
    lat: -2.5,
    lng: 140.0,
    themes: ["Humanitarian", "Displacement"],
    disaster: "COVID-19",
    description: "The dashboard aims to look at the results of the Community Insights for COVID-19 survey that aims to understand what people already know and still want to know about COVID-19. My role in this dashboard was to design the Kobotoolbox survey that was used to collect the data.",
    screenshot: "covid-community-insights.png", // Background preview image
    embeddable: false, // Explicitly triggers the error text and direct link button overlay
    links: [
      { 
        label: "Community insights for COVID-19", 
        url: "https://sites.google.com/view/rcce-community-insights/" 
      }
    ]
  }
];