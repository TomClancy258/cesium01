import { writeFileSync } from 'node:fs'

const OUTPUT = 'D:/code/server/nginx-1.26.3/html/geojson/radar/radars.json'
const R = 6371000

function haversine(lng1, lat1, lng2, lat2) {
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

const sites = [
  // Europe 25
  { region: 'EU', country: 'Germany', name: 'Berlin Surveillance', lng: 13.405, lat: 52.52, alt: 34, radius: 90000 },
  { region: 'EU', country: 'France', name: 'Paris Surveillance', lng: 2.352, lat: 48.856, alt: 42, radius: 85000 },
  { region: 'EU', country: 'United Kingdom', name: 'London Surveillance', lng: -0.127, lat: 51.507, alt: 11, radius: 85000 },
  { region: 'EU', country: 'Spain', name: 'Madrid Surveillance', lng: -3.703, lat: 40.416, alt: 667, radius: 95000 },
  { region: 'EU', country: 'Italy', name: 'Rome Surveillance', lng: 12.496, lat: 41.902, alt: 21, radius: 90000 },
  { region: 'EU', country: 'Poland', name: 'Warsaw Surveillance', lng: 21.012, lat: 52.229, alt: 106, radius: 90000 },
  { region: 'EU', country: 'Greece', name: 'Athens Surveillance', lng: 23.727, lat: 37.983, alt: 70, radius: 85000 },
  { region: 'EU', country: 'Netherlands', name: 'Amsterdam Surveillance', lng: 4.904, lat: 52.367, alt: -2, radius: 80000 },
  { region: 'EU', country: 'Sweden', name: 'Stockholm Surveillance', lng: 18.068, lat: 59.329, alt: 28, radius: 95000 },
  { region: 'EU', country: 'Norway', name: 'Oslo Surveillance', lng: 10.752, lat: 59.913, alt: 23, radius: 95000 },
  { region: 'EU', country: 'Romania', name: 'Bucharest Surveillance', lng: 26.102, lat: 44.426, alt: 85, radius: 90000 },
  { region: 'EU', country: 'Portugal', name: 'Lisbon Surveillance', lng: -9.139, lat: 38.722, alt: 2, radius: 90000 },
  { region: 'EU', country: 'Austria', name: 'Vienna Surveillance', lng: 16.373, lat: 48.208, alt: 171, radius: 85000 },
  { region: 'EU', country: 'Czech Republic', name: 'Prague Surveillance', lng: 14.437, lat: 50.075, alt: 200, radius: 85000 },
  { region: 'EU', country: 'Hungary', name: 'Budapest Surveillance', lng: 19.04, lat: 47.497, alt: 96, radius: 85000 },
  { region: 'EU', country: 'Finland', name: 'Helsinki Surveillance', lng: 24.938, lat: 60.169, alt: 17, radius: 95000 },
  { region: 'EU', country: 'Ireland', name: 'Dublin Surveillance', lng: -6.26, lat: 53.349, alt: 20, radius: 90000 },
  { region: 'EU', country: 'Belgium', name: 'Brussels Surveillance', lng: 4.351, lat: 50.85, alt: 13, radius: 65000 },
  { region: 'EU', country: 'Switzerland', name: 'Zurich Surveillance', lng: 8.541, lat: 47.376, alt: 408, radius: 80000 },
  { region: 'EU', country: 'Denmark', name: 'Copenhagen Surveillance', lng: 12.568, lat: 55.676, alt: 9, radius: 85000 },
  { region: 'EU', country: 'Croatia', name: 'Zagreb Surveillance', lng: 15.981, lat: 45.815, alt: 122, radius: 85000 },
  { region: 'EU', country: 'Bulgaria', name: 'Sofia Surveillance', lng: 23.321, lat: 42.697, alt: 550, radius: 90000 },
  { region: 'EU', country: 'Ukraine', name: 'Kyiv Surveillance', lng: 30.523, lat: 50.45, alt: 179, radius: 95000 },
  { region: 'EU', country: 'Serbia', name: 'Belgrade Surveillance', lng: 20.448, lat: 44.786, alt: 117, radius: 85000 },
  { region: 'EU', country: 'Iceland', name: 'Reykjavik Surveillance', lng: -21.942, lat: 64.146, alt: 61, radius: 100000 },
  // Middle East 25
  { region: 'ME', country: 'Saudi Arabia', name: 'Riyadh Surveillance', lng: 46.675, lat: 24.713, alt: 612, radius: 100000 },
  { region: 'ME', country: 'Saudi Arabia', name: 'Jeddah Surveillance', lng: 39.192, lat: 21.485, alt: 12, radius: 95000 },
  { region: 'ME', country: 'United Arab Emirates', name: 'Dubai Surveillance', lng: 55.27, lat: 25.204, alt: 8, radius: 90000 },
  { region: 'ME', country: 'Egypt', name: 'Cairo Surveillance', lng: 31.235, lat: 30.044, alt: 23, radius: 95000 },
  { region: 'ME', country: 'Egypt', name: 'Aswan Surveillance', lng: 32.899, lat: 24.088, alt: 194, radius: 90000 },
  { region: 'ME', country: 'Iran', name: 'Tehran Surveillance', lng: 51.389, lat: 35.689, alt: 1200, radius: 95000 },
  { region: 'ME', country: 'Iran', name: 'Shiraz Surveillance', lng: 52.531, lat: 29.592, alt: 1486, radius: 90000 },
  { region: 'ME', country: 'Iraq', name: 'Baghdad Surveillance', lng: 44.366, lat: 33.315, alt: 34, radius: 95000 },
  { region: 'ME', country: 'Jordan', name: 'Amman Surveillance', lng: 35.93, lat: 31.953, alt: 757, radius: 60000 },
  { region: 'ME', country: 'Oman', name: 'Muscat Surveillance', lng: 58.405, lat: 23.588, alt: 8, radius: 95000 },
  { region: 'ME', country: 'Qatar', name: 'Doha Surveillance', lng: 51.531, lat: 25.285, alt: 10, radius: 65000 },
  { region: 'ME', country: 'Kuwait', name: 'Kuwait City Surveillance', lng: 47.977, lat: 29.375, alt: 5, radius: 90000 },
  { region: 'ME', country: 'Bahrain', name: 'Manama Surveillance', lng: 50.557, lat: 26.066, alt: 2, radius: 60000 },
  { region: 'ME', country: 'Lebanon', name: 'Beirut Surveillance', lng: 35.501, lat: 33.893, alt: 19, radius: 48000 },
  { region: 'ME', country: 'Israel', name: 'Tel Aviv Surveillance', lng: 34.781, lat: 32.085, alt: 5, radius: 55000 },
  { region: 'ME', country: 'Turkey', name: 'Ankara Surveillance', lng: 32.859, lat: 39.933, alt: 938, radius: 95000 },
  { region: 'ME', country: 'Turkey', name: 'Istanbul Surveillance', lng: 28.978, lat: 41.008, alt: 39, radius: 90000 },
  { region: 'ME', country: 'Yemen', name: 'Sanaa Surveillance', lng: 44.207, lat: 15.369, alt: 2250, radius: 90000 },
  { region: 'ME', country: 'Syria', name: 'Damascus Surveillance', lng: 36.276, lat: 33.513, alt: 680, radius: 48000 },
  { region: 'ME', country: 'Libya', name: 'Tripoli Surveillance', lng: 13.191, lat: 32.887, alt: 9, radius: 95000 },
  { region: 'ME', country: 'Sudan', name: 'Khartoum Surveillance', lng: 32.559, lat: 15.5, alt: 381, radius: 95000 },
  { region: 'ME', country: 'Pakistan', name: 'Karachi Surveillance', lng: 67.01, lat: 24.861, alt: 8, radius: 95000 },
  { region: 'ME', country: 'Afghanistan', name: 'Kabul Surveillance', lng: 69.207, lat: 34.555, alt: 1791, radius: 90000 },
  { region: 'ME', country: 'Azerbaijan', name: 'Baku Surveillance', lng: 49.867, lat: 40.409, alt: -28, radius: 90000 },
  { region: 'ME', country: 'Georgia', name: 'Tbilisi Surveillance', lng: 44.793, lat: 41.715, alt: 458, radius: 85000 },
  // India 25
  { region: 'IN', country: 'India', name: 'Delhi Surveillance', lng: 77.102, lat: 28.704, alt: 216, radius: 80000 },
  { region: 'IN', country: 'India', name: 'Mumbai Surveillance', lng: 72.877, lat: 19.076, alt: 14, radius: 75000 },
  { region: 'IN', country: 'India', name: 'Chennai Surveillance', lng: 80.27, lat: 13.082, alt: 6, radius: 85000 },
  { region: 'IN', country: 'India', name: 'Kolkata Surveillance', lng: 88.363, lat: 22.572, alt: 9, radius: 90000 },
  { region: 'IN', country: 'India', name: 'Bangalore Surveillance', lng: 77.594, lat: 12.971, alt: 920, radius: 80000 },
  { region: 'IN', country: 'India', name: 'Hyderabad Surveillance', lng: 78.486, lat: 17.385, alt: 542, radius: 85000 },
  { region: 'IN', country: 'India', name: 'Ahmedabad Surveillance', lng: 72.571, lat: 23.022, alt: 53, radius: 85000 },
  { region: 'IN', country: 'India', name: 'Jaipur Surveillance', lng: 75.787, lat: 26.912, alt: 431, radius: 75000 },
  { region: 'IN', country: 'India', name: 'Lucknow Surveillance', lng: 80.946, lat: 26.846, alt: 123, radius: 85000 },
  { region: 'IN', country: 'India', name: 'Kochi Surveillance', lng: 76.267, lat: 9.931, alt: 2, radius: 65000 },
  { region: 'IN', country: 'India', name: 'Guwahati Surveillance', lng: 91.736, lat: 26.144, alt: 54, radius: 90000 },
  { region: 'IN', country: 'India', name: 'Srinagar Surveillance', lng: 74.797, lat: 34.083, alt: 1585, radius: 85000 },
  { region: 'IN', country: 'India', name: 'Nagpur Surveillance', lng: 79.088, lat: 21.145, alt: 310, radius: 85000 },
  { region: 'IN', country: 'India', name: 'Bhubaneswar Surveillance', lng: 85.824, lat: 20.296, alt: 45, radius: 85000 },
  { region: 'IN', country: 'India', name: 'Chandigarh Surveillance', lng: 76.779, lat: 30.733, alt: 350, radius: 75000 },
  { region: 'IN', country: 'India', name: 'Patna Surveillance', lng: 85.137, lat: 25.594, alt: 53, radius: 65000 },
  { region: 'IN', country: 'India', name: 'Indore Surveillance', lng: 75.857, lat: 22.719, alt: 553, radius: 80000 },
  { region: 'IN', country: 'India', name: 'Coimbatore Surveillance', lng: 76.955, lat: 11.016, alt: 411, radius: 65000 },
  { region: 'IN', country: 'India', name: 'Visakhapatnam Surveillance', lng: 83.218, lat: 17.686, alt: 5, radius: 85000 },
  { region: 'IN', country: 'India', name: 'Thiruvananthapuram Surveillance', lng: 76.936, lat: 8.524, alt: 8, radius: 75000 },
  { region: 'IN', country: 'India', name: 'Dehradun Surveillance', lng: 78.032, lat: 30.316, alt: 640, radius: 75000 },
  { region: 'IN', country: 'India', name: 'Ranchi Surveillance', lng: 85.309, lat: 23.344, alt: 651, radius: 65000 },
  { region: 'IN', country: 'India', name: 'Amritsar Surveillance', lng: 74.872, lat: 31.634, alt: 234, radius: 80000 },
  { region: 'IN', country: 'India', name: 'Pune Surveillance', lng: 73.856, lat: 18.52, alt: 560, radius: 58000 },
  { region: 'IN', country: 'India', name: 'Varanasi Surveillance', lng: 82.973, lat: 25.317, alt: 81, radius: 80000 },
  // Southeast Asia 25
  { region: 'SE', country: 'Singapore', name: 'Singapore Surveillance', lng: 103.819, lat: 1.352, alt: 15, radius: 70000 },
  { region: 'SE', country: 'Malaysia', name: 'Kuala Lumpur Surveillance', lng: 101.686, lat: 3.139, alt: 22, radius: 85000 },
  { region: 'SE', country: 'Malaysia', name: 'Kuching Surveillance', lng: 110.359, lat: 1.553, alt: 8, radius: 95000 },
  { region: 'SE', country: 'Thailand', name: 'Bangkok Surveillance', lng: 100.501, lat: 13.756, alt: 2, radius: 90000 },
  { region: 'SE', country: 'Thailand', name: 'Chiang Mai Surveillance', lng: 98.985, lat: 18.788, alt: 314, radius: 90000 },
  { region: 'SE', country: 'Indonesia', name: 'Jakarta Surveillance', lng: 106.845, lat: -6.208, alt: 8, radius: 90000 },
  { region: 'SE', country: 'Indonesia', name: 'Surabaya Surveillance', lng: 112.752, lat: -7.257, alt: 6, radius: 90000 },
  { region: 'SE', country: 'Indonesia', name: 'Medan Surveillance', lng: 98.672, lat: 3.595, alt: 26, radius: 85000 },
  { region: 'SE', country: 'Philippines', name: 'Manila Surveillance', lng: 120.984, lat: 14.599, alt: 7, radius: 85000 },
  { region: 'SE', country: 'Philippines', name: 'Cebu Surveillance', lng: 123.885, lat: 10.315, alt: 10, radius: 85000 },
  { region: 'SE', country: 'Philippines', name: 'Davao Surveillance', lng: 125.612, lat: 7.073, alt: 6, radius: 90000 },
  { region: 'SE', country: 'Vietnam', name: 'Hanoi Surveillance', lng: 105.834, lat: 21.028, alt: 16, radius: 90000 },
  { region: 'SE', country: 'Vietnam', name: 'Ho Chi Minh City Surveillance', lng: 106.629, lat: 10.823, alt: 19, radius: 90000 },
  { region: 'SE', country: 'Myanmar', name: 'Yangon Surveillance', lng: 96.195, lat: 16.866, alt: 15, radius: 90000 },
  { region: 'SE', country: 'Cambodia', name: 'Phnom Penh Surveillance', lng: 104.928, lat: 11.556, alt: 12, radius: 85000 },
  { region: 'SE', country: 'Laos', name: 'Vientiane Surveillance', lng: 102.633, lat: 17.975, alt: 174, radius: 85000 },
  { region: 'SE', country: 'Brunei', name: 'Bandar Seri Begawan Surveillance', lng: 114.948, lat: 4.903, alt: 14, radius: 80000 },
  { region: 'SE', country: 'Timor-Leste', name: 'Dili Surveillance', lng: 125.573, lat: -8.556, alt: 8, radius: 90000 },
  { region: 'SE', country: 'Taiwan', name: 'Taipei Surveillance', lng: 121.565, lat: 25.033, alt: 9, radius: 85000 },
  { region: 'SE', country: 'Sri Lanka', name: 'Colombo Surveillance', lng: 79.861, lat: 6.927, alt: 7, radius: 85000 },
  { region: 'SE', country: 'Bangladesh', name: 'Dhaka Surveillance', lng: 90.412, lat: 23.81, alt: 4, radius: 90000 },
  { region: 'SE', country: 'Nepal', name: 'Kathmandu Surveillance', lng: 85.324, lat: 27.717, alt: 1400, radius: 80000 },
  { region: 'SE', country: 'Maldives', name: 'Male Surveillance', lng: 73.509, lat: 4.175, alt: 2, radius: 75000 },
  { region: 'SE', country: 'Papua New Guinea', name: 'Port Moresby Surveillance', lng: 147.18, lat: -9.443, alt: 35, radius: 95000 },
  { region: 'SE', country: 'Hong Kong', name: 'Hong Kong Surveillance', lng: 114.169, lat: 22.319, alt: 18, radius: 75000 },
]

const falseDetectIds = new Set([
  'EU-RDR-05',
  'EU-RDR-18',
  'ME-RDR-07',
  'ME-RDR-20',
  'IN-RDR-04',
  'IN-RDR-12',
  'IN-RDR-23',
  'SE-RDR-01',
  'SE-RDR-14',
  'SE-RDR-22',
])

const counters = { EU: 0, ME: 0, IN: 0, SE: 0 }
const radars = sites.map((site) => {
  counters[site.region] += 1
  const id = `${site.region}-RDR-${String(counters[site.region]).padStart(2, '0')}`
  return {
    id,
    name: site.name,
    center: {
      longitude: site.lng,
      latitude: site.lat,
      altitude: site.alt,
    },
    radiusMeters: site.radius,
    detectAircraft: !falseDetectIds.has(id),
    country: site.country,
  }
})

let highOverlap = 0
for (let i = 0; i < radars.length; i++) {
  for (let j = i + 1; j < radars.length; j++) {
    const a = radars[i]
    const b = radars[j]
    const d = haversine(
      a.center.longitude,
      a.center.latitude,
      b.center.longitude,
      b.center.latitude,
    )
    const overlap = a.radiusMeters + b.radiusMeters - d
    if (overlap > 0) {
      const ratio = overlap / Math.min(a.radiusMeters, b.radiusMeters)
      if (ratio > 0.3) {
        highOverlap += 1
        console.warn(
          `overlap ${a.id} ${b.id}: dist ${(d / 1000).toFixed(0)}km overlap ${(overlap / 1000).toFixed(0)}km`,
        )
      }
    }
  }
}

writeFileSync(OUTPUT, `${JSON.stringify(radars, null, 2)}\n`, 'utf8')
console.log(`Wrote ${radars.length} radars to ${OUTPUT}, high-overlap pairs: ${highOverlap}`)
