/**
 * Images data with enhanced data_sources structure
 * 
 * Each image object can include a data_sources array that supports:
 * 1. Simple string format (backward compatible):
 *    "data_sources": ["OpenStreetMap", "LINZ"]
 * 
 * 2. Object format with name and URL (recommended):
 *    "data_sources": [
 *      { "name": "OpenStreetMap", "url": "https://www.openstreetmap.org/" },
 *      { "name": "LINZ", "url": "https://www.linz.govt.nz/" }
 *    ]
 * 
 * 3. Mixed format (both simple strings and objects):
 *    "data_sources": [
 *      "OpenStreetMap",
 *      { "name": "LINZ", "url": "https://www.linz.govt.nz/" }
 *    ]
 */

export const images = [
  {
    "file": "assets/images/maps/2012-brazzaville-munitions.jpg",
    "name": "Distribution and concentrations of reported ordnance (as of 22 March 2012)",
    "continent": "Africa",
    "country": "Republic of the Congo",
    "location": "Brazzaville",
    "year": 2012,
    "month": 3,
    "lat": -4.2634,
    "lng": 15.2429,
    "themes": [
      "Humanitarian"
    ],
    "disaster": "Munitions Explosion",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2014-gaza.jpg",
    "name": "Situational overview (as of 24 July 2014)",
    "continent": "Asia",
    "country": "Gaza",
    "location": "",
    "year": 2014,
    "month": 7,
    "lat": 31.52,
    "lng": 34.45,
    "themes": [
      "Humanitarian",
      "Displacement",
      "Urban"
    ],
    "disaster": "Conflict",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/south-sudan-situational-overview.jpg",
    "name": "Situation overview (as at 5 August 2014)",
    "continent": "Africa",
    "country": "South Sudan",
    "location": "",
    "year": 2014,
    "month": 8,
    "lat": 6.877,
    "lng": 31.307,
    "themes": [
      "Humanitarian",
      "Displacement",
      "Food security",
      "Health"
    ],
    "disaster": "Conflict",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2014-liberia-ebola-humanitarian-presence.jpg",
    "name": "Who, what and where (3W) humanitarian presence (as at 5 September 2014)",
    "continent": "Africa",
    "country": "Liberia",
    "location": "",
    "year": 2014,
    "month": 9,
    "lat": 6.4281,
    "lng": -9.4295,
    "themes": [
      "Health",
      "Humanitarian"
    ],
    "disaster": "Ebola",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2014-liberia-ebola-treatment-units.jpeg",
    "name": "Location and status of Ebola Treatment Units (as of 14 October 2014)",
    "continent": "Africa",
    "country": "Liberia",
    "location": "",
    "year": 2014,
    "month": 10,
    "lat": 6.4281,
    "lng": -9.4295,
    "themes": [
      "Health",
      "Humanitarian"
    ],
    "disaster": "Ebola",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2015-malawi-floods.jpeg",
    "name": "Location of displacement sites - Chickwawa (as of 17 February 2015)",
    "continent": "Africa",
    "country": "Malawi",
    "location": "",
    "year": 2015,
    "month": 2,
    "lat": -13.2543,
    "lng": 34.3015,
    "themes": [
      "Humanitarian"
    ],
    "disaster": "Flood",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2015-vanuatu-wash-distribution.jpeg",
    "name": "Summary of WASH cluster item delivery (as of 25 March 2015)",
    "continent": "Oceania",
    "country": "Vanuatu",
    "location": "",
    "year": 2015,
    "month": 3,
    "lat": -15.3767,
    "lng": 166.9592,
    "themes": [
      "WASH",
      "Humanitarian"
    ],
    "disaster": "Cyclone",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2016-southern-africa-food-security-el-nino.jpg",
    "name": "Southern Africa: Estimated number of current food insecure rural populations (as of 16 Feb 2016)",
    "continent": "Africa",
    "country": "",
    "location": "",
    "year": 2015,
    "month": 3,
    "lat": -27.6673164,
    "lng": 24.8456952,
    "themes": [
      "El Niño",
      "Humanitarian"
    ],
    "disaster": "Climate change",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2015-european-migration.jpg",
    "name": "European Migrant Crisis: Overview (as of 17 November 2015)",
    "continent": "Europe",
    "country": "Multiple",
    "location": "",
    "year": 2015,
    "month": 11,
    "lat": 44.817778,
    "lng": 20.456944,
    "themes": [
      "Humanitarian",
      "Migration"
    ],
    "disaster": "Conflict",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/barry-buddon-half-marathon.png",
    "name": "Barry Buddon half marathon",
    "continent": "Europe",
    "country": "United Kingdom",
    "location": "",
    "year": 2016,
    "month": 1,
    "lat": 56.480556,
    "lng": -2.754167,
    "themes": [
      "Recreation"
    ],
    "disaster": "None",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2016-northern-triangle-people-in-need.jpg",
    "name": "El Salvador, Guatemala and Honduras - People in need (as of 11 November 2016)",
    "continent": "Central America",
    "country": [
      "El Salvador",
      "Guatemala",
      "Honduras"
    ],
    "location": "",
    "year": 2016,
    "month": 11,
    "lat": 13.698889,
    "lng": -89.191389,
    "themes": [
      "Population",
      "Humanitarian",
      "Displacement"
    ],
    "disaster": "",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/glasgow-mono.png",
    "name": "Glasgow monochrome",
    "continent": "Europe",
    "country": "United Kingdom",
    "location": "Glasgow",
    "year": 2017,
    "month": 1,
    "lat": 55.8642,
    "lng": -4.2518,
    "themes": [
      "Urban"
    ],
    "disaster": "None",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2018-dominica-isaac-wind-speed-probabilities.jpeg",
    "name": "Hurricane Isaac - Wind speed probabilities (as at 11 September 2018)",
    "continent": "Caribbean",
    "country": "Dominica",
    "location": "",
    "year": 2018,
    "month": 9,
    "lat": 15.415,
    "lng": -61.371,
    "themes": [
      "Humanitarian",
      "Weather"
    ],
    "disaster": "Hurricane",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2018-philippines-mangkhut-affected-population.jpeg",
    "name": "Affected population (as at 22 September 2018)",
    "continent": "Asia",
    "country": "The Philippines",
    "location": "",
    "year": 2018,
    "month": 9,
    "lat": 12.8797,
    "lng": 121.774,
    "themes": [
      "Humanitarian"
    ],
    "disaster": "Typhoon",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2018-philippines-mangkhut-agriculture-damage-costs.jpeg",
    "name": "Agriculture damage costs (as at 20 September 2018)",
    "continent": "Asia",
    "country": "The Philippines",
    "location": "",
    "year": 2018,
    "month": 9,
    "lat": 12.8797,
    "lng": 121.774,
    "themes": [
      "Humanitarian"
    ],
    "disaster": "Typhoon",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2018-philippines-mangkhut-naga.jpeg",
    "name": "Landslide overview (as at 28 September 2018)",
    "continent": "Asia",
    "country": "The Philippines",
    "location": "Naga City",
    "year": 2018,
    "month": 9,
    "lat": 13.6192,
    "lng": 123.1814,
    "themes": [
      "Humanitarian",
      "Food security",
      "WASH"
    ],
    "disaster": [
      "Typhoon",
      "Landslide"
    ],
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2018-indonesia-idp-camps.jpg",
    "name": "Number of families at IDP camps (as at 22 October 2018)",
    "continent": "Asia",
    "country": "Indonesia",
    "location": "Palu",
    "year": 2018,
    "month": 10,
    "lat": -0.898,
    "lng": 119.8707,
    "themes": [
      "Humanitarian",
      "Displacement"
    ],
    "disaster": [
      "Earthquake",
      "Tsunami",
      "Liquefaction"
    ],
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2018-indonesia-potable-water-distribution-points.jpeg",
    "name": "Location of water distribution points (as of 22 October 2018)",
    "continent": "Asia",
    "country": "Indonesia",
    "location": "Palu",
    "year": 2018,
    "month": 10,
    "lat": -0.898,
    "lng": 119.8707,
    "themes": [
      "Humanitarian",
      "WASH"
    ],
    "disaster": "Earthquake",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2018-indonesia-potable-water-requirements.jpg",
    "name": "Estimated potable water requirements (as at 23 October 2018)",
    "continent": "Asia",
    "country": "Indonesia",
    "location": "Palu",
    "year": 2018,
    "month": 10,
    "lat": -0.898,
    "lng": 119.8707,
    "themes": [
      "Humanitarian",
      "WASH"
    ],
    "disaster": "Earthquake",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2018-indonesia-potable-water-temporary-settlements.jpeg",
    "name": "Estimated potable water requirements - temporary settlements",
    "continent": "Asia",
    "country": "Indonesia",
    "location": "Palu",
    "year": 2018,
    "month": 10,
    "lat": -0.898,
    "lng": 119.8707,
    "themes": [
      "Humanitarian",
      "WASH"
    ],
    "disaster": "Earthquake",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2019-mozambique-idai-who-beira-cholera-cases.jpeg",
    "name": "Cholera cases (as at 2 April 2019)",
    "continent": "Africa",
    "country": "Mozambique",
    "location": "Beira",
    "year": 2019,
    "month": 4,
    "lat": -19.8333,
    "lng": 34.85,
    "themes": [
      "Humanitarian",
      "Health"
    ],
    "disaster": "Cyclone",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2019-mozambique-idai-who-beira-emts-ctcs-health-facilities.jpeg",
    "name": "EMTs, CTCs and health facilities (as at 1 April 2019)",
    "continent": "Africa",
    "country": "Mozambique",
    "location": "Beira",
    "year": 2019,
    "month": 4,
    "lat": -19.8333,
    "lng": 34.85,
    "themes": [
      "Humanitarian",
      "Health"
    ],
    "disaster": "Cyclone",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2019-mozambique-idai-who-sofala-emts-ctcs-health-facilities.jpeg",
    "name": "Health facilities (as at 1 April 2019)",
    "continent": "Africa",
    "country": "Mozambique",
    "location": "Sofala",
    "year": 2019,
    "month": 4,
    "lat": -19.1211,
    "lng": 34.844,
    "themes": [
      "Humanitarian",
      "Health"
    ],
    "disaster": "Cyclone",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2019-mozambique-idai-who-sofala-health-cluster-345w.jpg",
    "name": "Health cluster 4W (as at 1 April 2019)",
    "continent": "Africa",
    "country": "Mozambique",
    "location": "Sofala",
    "year": 2019,
    "month": 4,
    "lat": -19.1211,
    "lng": 34.844,
    "themes": [
      "Humanitarian",
      "Health"
    ],
    "disaster": "Cyclone",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2021-gimac-ethiopia-crops-locusts.jpg",
    "name": "Crops affected by locusts (Jan–Jul 2020)",
    "continent": "Africa",
    "country": "Ethiopia",
    "location": "",
    "year": 2020,
    "month": 7,
    "lat": 9.145,
    "lng": 40.4897,
    "themes": [
      "Humanitarian",
      "Agriculture"
    ],
    "disaster": "Locusts",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2021-gimac-iraq-idp-change.jpg",
    "name": "Tracking changes in the number of IDPs (Aug 2018–Aug 2020)",
    "continent": "Asia",
    "country": "Iraq",
    "location": "",
    "year": 2020,
    "month": 8,
    "lat": 33.2232,
    "lng": 43.6793,
    "themes": [
      "Humanitarian",
      "Displacement"
    ],
    "disaster": "Conflict",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2021-gimac-iraq-shelter-type.jpg",
    "name": "Number of displaced individuals by shelter type (as at 30 August 2020)",
    "continent": "Asia",
    "country": "Iraq",
    "location": "",
    "year": 2020,
    "month": 8,
    "lat": 33.2232,
    "lng": 43.6793,
    "themes": [
      "Humanitarian",
      "Shelter"
    ],
    "disaster": "Conflict",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2021-gimac-ethiopia-commodity-trends.jpg",
    "name": "Commodity trends (Jan 2019–Apr 2020)",
    "continent": "Africa",
    "country": "Ethiopia",
    "location": "",
    "year": 2021,
    "month": 4,
    "lat": 9.145,
    "lng": 40.4897,
    "themes": [
      "Humanitarian",
      "Economy"
    ],
    "disaster": "Conflict",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2021-st-vincent-volcano-situational-overview.jpeg",
    "name": "Situational Overview (as of 21 April 2021)",
    "continent": "Caribbean",
    "country": "St Vincent and the Grenadines",
    "location": "",
    "year": 2021,
    "month": 4,
    "lat": 13.2528,
    "lng": -61.1971,
    "themes": [
      "Humanitarian"
    ],
    "disaster": "Volcano",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2021-gimac-afghanistan.jpg",
    "name": "Projected food insecurity (June–Nov 2021)",
    "continent": "Asia",
    "country": "Afghanistan",
    "location": "",
    "year": 2021,
    "month": 6,
    "lat": 33.9391,
    "lng": 67.71,
    "themes": [
      "Humanitarian",
      "Food security"
    ],
    "disaster": "Conflict",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2021-iraq-security.jpg",
    "name": "Fatalities per event type (Jan 2019–Aug 2020)",
    "continent": "Asia",
    "country": "Iraq",
    "location": "",
    "year": 2021,
    "month": 8,
    "lat": 33.2232,
    "lng": 43.6793,
    "themes": [
      "Humanitarian",
      "Security"
    ],
    "disaster": "Conflict",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/greece.png",
    "name": "Physical geography of Greece",
    "continent": "Europe",
    "country": "Greece",
    "location": "",
    "year": 2022,
    "month": 6,
    "lat": 39,
    "lng": 22,
    "themes": [
      "Physical geography"
    ],
    "disaster": "None",
    "description": "",
    "map_style": "",
    "data_sources": [
      { "name": "GEBCO", "url": "https://www.gebco.net/" },
      { "name": "Marine Regions", "url": "https://www.marineregions.org/" },
      { "name": "OpenStreetMap", "url": "https://www.openstreetmap.org/" },
      { "name": "SRTM", "url": "https://lpdaac.usgs.gov/products/srtmgl1v003/" }
    ]
  },
  {
    "file": "assets/images/maps/hanoi.jpg",
    "name": "Hanoi",
    "continent": "Asia",
    "country": "Vietnam",
    "location": "Hanoi",
    "year": 2024,
    "month": 1,
    "lat": 21.0285,
    "lng": 105.8542,
    "themes": [
      "Urban"
    ],
    "disaster": "None",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/makati-osaka.png",
    "name": "Makati",
    "continent": "Asia",
    "country": "The Philippines",
    "location": "Makati",
    "year": 2024,
    "month": 1,
    "lat": 14.5547,
    "lng": 121.0244,
    "themes": [
      "Transport"
    ],
    "disaster": "None",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/singapore.png",
    "name": "Singapore",
    "continent": "Asia",
    "country": "Singapore",
    "location": "",
    "year": 2024,
    "month": 1,
    "lat": 1.3521,
    "lng": 103.8198,
    "themes": [
      "Urban"
    ],
    "disaster": "None",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/iceland-physical-geography.jpg",
    "name": "Physcial geography of Iceland",
    "continent": "Europe",
    "country": "Iceland",
    "location": "",
    "year": 2024,
    "month": 3,
    "lat": 65,
    "lng": -18,
    "themes": [
      "Landscape"
    ],
    "disaster": "",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/new-zealand-hexagonal-population.jpg",
    "name": "Estimated population (2023)",
    "continent": "Oceania",
    "country": "New Zealand",
    "location": "",
    "year": 2024,
    "month": 11,
    "lat": -42.25,
    "lng": 173.25,
    "themes": [
      "Population"
    ],
    "disaster": "",
    "description": "Part of the 30 maps in 30 days challenge in 2024.",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/caledonian-canal-strip-map.png",
    "name": "Caledonian Canal",
    "continent": "Europe",
    "country": "United Kingdom",
    "location": "Fort William",
    "year": 2025,
    "month": 1,
    "lat": 56.8198,
    "lng": -5.1052,
    "themes": [
      "Recreation"
    ],
    "disaster": "None",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/glasgow.png",
    "name": "Glasgow",
    "continent": "Europe",
    "country": "United Kingdom",
    "location": "Glasgow",
    "year": 2025,
    "month": 1,
    "lat": 55.8642,
    "lng": -4.2518,
    "themes": [
      "Urban"
    ],
    "disaster": "None",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/glencoe-mountain-gathering.png",
    "name": "Glencoe mountain gathering",
    "continent": "Europe",
    "country": "United Kingdom",
    "location": "Glencoe",
    "year": 2025,
    "month": 1,
    "lat": 56.682,
    "lng": -5.102,
    "themes": [
      "Recreation"
    ],
    "disaster": "None",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/new-zealand-raster.jpg",
    "name": "Aotearoa/New Zealand",
    "continent": "Oceania",
    "country": "New Zealand",
    "location": "",
    "year": 2025,
    "month": 1,
    "lat": -41.2865,
    "lng": 174.7762,
    "themes": [
      "Landscape"
    ],
    "disaster": "None",
    "description": "Inspired by this map here - <a href='https://soaratlas.com/maps/oceania-new-zealand-aotearoa-15866?pos=-40.36082373372568%2C173.7623460138845%2C6.64' target='_blank'>Soar Atlas</a>",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/osaka-new.png",
    "name": "Osaka",
    "continent": "Asia",
    "country": "Japan",
    "location": "Osaka",
    "year": 2025,
    "month": 1,
    "lat": 34.6937,
    "lng": 135.5023,
    "themes": [
      "Urban"
    ],
    "disaster": "None",
    "description": "Inspired by the <a href=\"https://www.antiquemapsandprints.com/products/osaka-antique-town-city-plan-honshu-japan-1914-old-map-chart-p-6-018241?_pos=16&_sid=afb666c30&_ss=r\" target=\"_blank\">Osaka antique town city plan</a> by the Japanese Government Railways in 1914. The map uses OpenStreetMap data with the styling of the old map.",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/rockwell-sketch.png",
    "name": "Rockwell sketch map",
    "continent": "Asia",
    "country": "The Philippines",
    "location": "Rockwell, Makati",
    "year": 2025,
    "month": 1,
    "lat": 14.5663,
    "lng": 121.0365,
    "themes": [
      "Urban"
    ],
    "disaster": "None",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/the-jurassic-coast.png",
    "name": "The Jurassic Coast",
    "continent": "Central America",
    "country": [
      "United Kingdom"
    ],
    "location": "Dorset",
    "year": 2025,
    "month": 12,
    "lat": 50.725,
    "lng": -2.9353,
    "themes": [
      "Geology"
    ],
    "disaster": "",
    "description": "Where my passion for geography and geology first started.",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/all-flights-international-auckland-2026.png",
    "name": "International flights from Auckland in 2026",
    "continent": "Oceania",
    "country": "New Zealand",
    "location": "Auckland",
    "year": 2026,
    "month": 1,
    "lat": -36.8509,
    "lng": 174.7645,
    "themes": [
      "Transport"
    ],
    "disaster": "None",
    "description": "Inspired to try my version of this <a href=\"https://somethingaboutmaps.com/Flight-Map\" target=\"_blank\">flight map by Daniel P. Huffman</a> of flights leaving Auckland.",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/all-flights-international-manila-2026.png",
    "name": "International flights from Manila in 2026",
    "continent": "Asia",
    "country": "The Philippines",
    "location": "Manila",
    "year": 2026,
    "month": 1,
    "lat": 14.5995,
    "lng": 120.9842,
    "themes": [
      "Transport"
    ],
    "disaster": "None",
    "description": "This is a second of a \"mini-series\" of flight maps inspired by the original <a href=\"https://somethingaboutmaps.com/Flight-Map\" target=\"_blank\">flight map by Daniel P. Huffman</a>.",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/kinloch-10k.png",
    "name": "Kinloch 10km route",
    "continent": "Europe",
    "country": "New Zealand",
    "location": "Kinloch",
    "year": 2026,
    "month": 1,
    "lat": -38.661,
    "lng": 175.942,
    "themes": [
      "Recreation"
    ],
    "disaster": "None",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/liverpool.png",
    "name": "Liverpool",
    "continent": "Europe",
    "country": "United Kingdom",
    "location": "Liverpool",
    "year": 2026,
    "month": 1,
    "lat": 53.4084,
    "lng": -2.9916,
    "themes": [
      "Urban"
    ],
    "disaster": "None",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/loch-maree.png",
    "name": "Loch Maree",
    "continent": "Europe",
    "country": "United Kingdom",
    "location": "Loch Maree",
    "year": 2026,
    "month": 1,
    "lat": 57.728,
    "lng": -5.528,
    "themes": [
      "Landscape",
      "Bathymetry"
    ],
    "disaster": "None",
    "description": "Inspired by the <a href=\"https://maps.nls.uk/bathymetric/chart/2058\" target=\"_blank\">Bathymetrical Survey of the Fresh-Water Lochs of Scotland</a> that were constructed under the direction of Sir John Murray And Laurence Pullar (1897 - 1909). The uses digitised bathymetric data from the survey with data from OpenStreetMap and other modern day sources.",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/parkrun-taupo.png",
    "name": "Parkrun Taupō",
    "continent": "Oceania",
    "country": "New Zealand",
    "location": "Taupō",
    "year": 2026,
    "month": 1,
    "lat": -38.6857,
    "lng": 176.0702,
    "themes": [
      "Recreation",
      "Running"
    ],
    "disaster": "None",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2026-micronesia-estimated-damage.png",
    "name": "Estimated damage through satellite obervations (as of 24 April 2026)",
    "continent": "Oceania",
    "country": "Federated States of Micronesia",
    "location": "Chuuk State",
    "year": 2026,
    "month": 4,
    "lat": 7.42269,
    "lng": 151.76077,
    "themes": [
      "Humanitarian",
      "Damage assessment"
    ],
    "disaster": "Cyclone",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/2026-micronesia-distances.png",
    "name": "Distances from state ports to the outer islands",
    "continent": "Oceania",
    "country": "Federated States of Micronesia",
    "location": "Chuuk State",
    "year": 2026,
    "month": 4,
    "lat": 7.1269709,
    "lng": 148.8678691,
    "themes": [
      "Humanitarian",
      "Logistics"
    ],
    "disaster": "Cyclone",
    "description": "",
    "map_style": "",
    "data_sources": []
  },
  {
    "file": "assets/images/maps/raglan-harbour.png",
    "name": "Whaingaroa/Raglan Harbour",
    "continent": "Oceania",
    "country": "New Zealand",
    "location": "Wahaingaroa/Raglan",
    "year": 2026,
    "month": 6,
    "lat": -37.78897590456054,
    "lng": 174.90706527684853,
    "themes": [
      "Physical geography"
    ],
    "disaster": "None",
    "description": "Physical geography of Whaingaroa/Raglan Harbour.",
    "map_style": "",
    "data_sources": [
      { "name": "LINZ", "url": "https://www.linz.govt.nz/" },
      { "name": "OpenStreetMap", "url": "https://www.openstreetmap.org/" },
      { "name": "SRTM", "url": "https://lpdaac.usgs.gov/products/srtmgl1v003/" }
    ]
  },
  {
    "file": "assets/images/maps/intramuros-sketch-map.png",
    "name": "Intramuros Sketch Map",
    "continent": "Asia",
    "country": "The Philippines",
    "location": "Intramuros, Manila",
    "year": 2026,
    "month": 7,
    "lat": 14.590830,
    "lng": 120.975000,
    "themes": [
      "Physical geography"
    ],
    "disaster": "None",
    "description": "Sketch map of Intramuros, Manila.",
    "map_style": "Sketch",
    "data_sources": [
      { "name": "NAMRIA" },
      { "name": "OpenStreetMap", "url": "https://www.openstreetmap.org/" }
    ]
  },
  {
    "file": "assets/images/maps/pollock-park-sketch-map.png",
    "name": "Pollock Park Sketch Map",
    "continent": "Europe",
    "country": "United Kingdom",
    "location": "Pollock Park, Glasgow",
    "year": 2026,
    "month": 7,
    "lat": 55.864237,
    "lng": -4.251806,
    "themes": [
      "Physical geography"
    ],
    "disaster": "None",
    "description": "Sketch map of Pollock Park, Glasgow.",
    "map_style": "Sketch",
    "data_sources": [
      { "name": "OpenStreetMap", "url": "https://www.openstreetmap.org/" }
    ]
  }
];