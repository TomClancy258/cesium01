import fs from 'node:fs'

const WALL_OUTPUT = 'D:/code/server/nginx-1.26.3/html/geojson/wall/walls.json'
const RADAR_OUTPUT = 'D:/code/server/nginx-1.26.3/html/geojson/radar/radars.json'
const R = 6371000

const OVERLAP_COUNT = 55
const WALL_ONLY_COUNT = 30
const RADAR_ONLY_COUNT = 15
/** 补足 100 条：15 仅围栏 + 25 仅雷达（最终约 20% 雷达无围栏重叠） */
const FILLER_WALL_COUNT = 15
const FILLER_RADAR_COUNT = 30

const LEVELS = [
  ...Array(20).fill('danger'),
  ...Array(30).fill('warning'),
  ...Array(50).fill('normal'),
]

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
shuffle(LEVELS)

function haversine(lng1, lat1, lng2, lat2) {
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

function offsetPoint(lng, lat, distanceKm, bearingDeg) {
  const latRad = (lat * Math.PI) / 180
  const degPerKmLat = 1 / 111.32
  const degPerKmLng = 1 / (111.32 * Math.cos(latRad))
  const bearing = (bearingDeg * Math.PI) / 180
  return [
    +(lng + distanceKm * Math.sin(bearing) * degPerKmLng).toFixed(5),
    +(lat + distanceKm * Math.cos(bearing) * degPerKmLat).toFixed(5),
  ]
}

function createPolygon(centerLng, centerLat, radiusKm, sides = 7, rotation = 0, seed = 0) {
  const positions = []
  const latRad = (centerLat * Math.PI) / 180
  const degPerKmLat = 1 / 111.32
  const degPerKmLng = 1 / (111.32 * Math.cos(latRad))
  for (let i = 0; i <= sides; i++) {
    const angle = rotation + (2 * Math.PI * i) / sides
    const jitter = 0.88 + (((seed * 17 + i * 13) % 100) / 100) * 0.24
    const r = radiusKm * jitter
    positions.push([
      +(centerLng + r * Math.cos(angle) * degPerKmLng).toFixed(5),
      +(centerLat + r * Math.sin(angle) * degPerKmLat).toFixed(5),
    ])
  }
  return positions
}

function polyCentroid(positions) {
  const pts = positions.slice(0, -1)
  let sx = 0
  let sy = 0
  for (const [lng, lat] of pts) {
    sx += lng
    sy += lat
  }
  return [sx / pts.length, sy / pts.length]
}

function pickWallRadius(sizeTier, seed) {
  const r = (seed * 7) % 100
  if (sizeTier === 'large') return 38 + (r / 100) * 14
  if (sizeTier === 'medium') return 28 + (r / 100) * 10
  return 18 + (r / 100) * 8
}

function pickAlt(level, sizeTier) {
  if (level === 'danger') {
    return { minAltitude: 0, maxAltitude: sizeTier === 'large' ? 12000 : 10000 }
  }
  if (level === 'warning') {
    return { minAltitude: 0, maxAltitude: sizeTier === 'large' ? 10000 : 8500 }
  }
  return { minAltitude: 0, maxAltitude: sizeTier === 'small' ? 4500 : 6000 }
}

function pickVisualStyle(level, idx) {
  if (level === 'danger') return idx % 4 === 0 ? 'layeredRing' : 'arrowWall'
  if (level === 'warning') return idx % 2 ? 'arrowWall' : 'layeredRing'
  return idx % 3 === 0 ? 'arrowWall' : 'layeredRing'
}

/** [cityName, lng, lat, country, sizeTier, region] */
const HUBS = [
  ['Tokyo Metro', 139.69, 35.68, 'Japan', 'large', 'JP'],
  ['Osaka Metro', 135.5, 34.69, 'Japan', 'large', 'JP'],
  ['Nagoya Metro', 136.91, 35.18, 'Japan', 'medium', 'JP'],
  ['Fukuoka Metro', 130.4, 33.59, 'Japan', 'medium', 'JP'],
  ['Sapporo Metro', 141.35, 43.06, 'Japan', 'medium', 'JP'],
  ['Sendai Metro', 140.87, 38.27, 'Japan', 'medium', 'JP'],
  ['Hiroshima Metro', 132.46, 34.39, 'Japan', 'small', 'JP'],
  ['Kobe Metro', 135.2, 34.69, 'Japan', 'small', 'JP'],
  ['Okinawa Corridor', 127.68, 26.21, 'Japan', 'medium', 'JP'],
  ['Chitose Approach', 141.69, 42.78, 'Japan', 'small', 'JP'],
  ['Bangkok Terminal', 100.5, 13.75, 'Thailand', 'large', 'SE'],
  ['Singapore Terminal', 103.99, 1.36, 'Singapore', 'large', 'SE'],
  ['Jakarta Metro', 106.85, -6.12, 'Indonesia', 'large', 'SE'],
  ['Denpasar Corridor', 115.19, -8.75, 'Indonesia', 'medium', 'SE'],
  ['Surabaya Metro', 112.75, -7.26, 'Indonesia', 'medium', 'SE'],
  ['Kuala Lumpur Metro', 101.69, 3.13, 'Malaysia', 'large', 'SE'],
  ['Penang Approach', 100.27, 5.3, 'Malaysia', 'medium', 'SE'],
  ['Manila Terminal', 121.0, 14.51, 'Philippines', 'large', 'SE'],
  ['Cebu Corridor', 123.88, 10.31, 'Philippines', 'medium', 'SE'],
  ['Phnom Penh Metro', 104.92, 11.55, 'Cambodia', 'medium', 'SE'],
  ['Yangon Metro', 96.13, 16.91, 'Myanmar', 'medium', 'SE'],
  ['Colombo Metro', 79.88, 6.93, 'Sri Lanka', 'medium', 'SE'],
  ['Taipei Metro', 121.23, 25.08, 'Taiwan', 'large', 'SE'],
  ['Dhaka Metro', 90.41, 23.81, 'Bangladesh', 'medium', 'SE'],
  ['Chiang Mai Corridor', 98.985, 18.788, 'Thailand', 'medium', 'SE'],
  ['Medan Corridor', 98.672, 3.595, 'Indonesia', 'medium', 'SE'],
  ['Delhi Terminal', 77.1, 28.56, 'India', 'large', 'IN'],
  ['Mumbai Terminal', 72.87, 19.09, 'India', 'large', 'IN'],
  ['Bangalore Metro', 77.59, 13.2, 'India', 'large', 'IN'],
  ['Chennai Metro', 80.17, 12.99, 'India', 'medium', 'IN'],
  ['Kolkata Metro', 88.44, 22.65, 'India', 'medium', 'IN'],
  ['Hyderabad Metro', 78.43, 17.24, 'India', 'medium', 'IN'],
  ['Ahmedabad Metro', 72.57, 23.02, 'India', 'medium', 'IN'],
  ['Kochi Corridor', 76.27, 10.15, 'India', 'small', 'IN'],
  ['Jaipur Metro', 75.79, 26.91, 'India', 'small', 'IN'],
  ['Lucknow Metro', 80.95, 26.85, 'India', 'small', 'IN'],
  ['Goa Approach', 73.83, 15.38, 'India', 'small', 'IN'],
  ['Amritsar Metro', 74.87, 31.63, 'India', 'small', 'IN'],
  ['Guwahati Metro', 91.736, 26.144, 'India', 'medium', 'IN'],
  ['Pune Metro', 73.856, 18.52, 'India', 'medium', 'IN'],
  ['Warsaw Metro', 21.01, 52.17, 'Poland', 'large', 'EU'],
  ['Krakow Metro', 19.79, 50.08, 'Poland', 'medium', 'EU'],
  ['Prague Metro', 14.44, 50.08, 'Czech Republic', 'large', 'EU'],
  ['Budapest Metro', 19.04, 47.5, 'Hungary', 'large', 'EU'],
  ['Bucharest Metro', 26.1, 44.43, 'Romania', 'medium', 'EU'],
  ['Sofia Metro', 23.32, 42.7, 'Bulgaria', 'medium', 'EU'],
  ['Kyiv Metro', 30.52, 50.45, 'Ukraine', 'large', 'EU'],
  ['Belgrade Metro', 20.46, 44.79, 'Serbia', 'medium', 'EU'],
  ['Zagreb Metro', 15.98, 45.74, 'Croatia', 'medium', 'EU'],
  ['Bratislava Metro', 17.11, 48.15, 'Slovakia', 'small', 'EU'],
  ['Vilnius Metro', 25.28, 54.63, 'Lithuania', 'medium', 'EU'],
  ['Riga Metro', 24.11, 56.95, 'Latvia', 'medium', 'EU'],
  ['Tallinn Metro', 24.75, 59.44, 'Estonia', 'small', 'EU'],
  ['Minsk Metro', 27.56, 53.9, 'Belarus', 'medium', 'EU'],
  ['London Terminal', -0.45, 51.47, 'United Kingdom', 'large', 'EU'],
  ['Manchester Metro', -2.28, 53.35, 'United Kingdom', 'medium', 'EU'],
  ['Paris Terminal', 2.55, 49.01, 'France', 'large', 'EU'],
  ['Lyon Metro', 4.84, 45.72, 'France', 'medium', 'EU'],
  ['Frankfurt Terminal', 8.57, 50.04, 'Germany', 'large', 'EU'],
  ['Munich Metro', 11.79, 48.35, 'Germany', 'medium', 'EU'],
  ['Berlin Metro', 13.4, 52.52, 'Germany', 'large', 'EU'],
  ['Amsterdam Terminal', 4.76, 52.31, 'Netherlands', 'large', 'EU'],
  ['Brussels Metro', 4.35, 50.85, 'Belgium', 'medium', 'EU'],
  ['Madrid Terminal', -3.57, 40.49, 'Spain', 'large', 'EU'],
  ['Barcelona Metro', 2.08, 41.3, 'Spain', 'medium', 'EU'],
  ['Rome Terminal', 12.24, 41.8, 'Italy', 'large', 'EU'],
  ['Milan Metro', 9.28, 45.46, 'Italy', 'medium', 'EU'],
  ['Vienna Metro', 16.37, 48.21, 'Austria', 'medium', 'EU'],
  ['Zurich Metro', 8.55, 47.46, 'Switzerland', 'medium', 'EU'],
  ['Copenhagen Metro', 12.57, 55.62, 'Denmark', 'medium', 'EU'],
  ['Stockholm Metro', 17.94, 59.65, 'Sweden', 'medium', 'EU'],
  ['Oslo Metro', 11.1, 60.19, 'Norway', 'medium', 'EU'],
  ['Helsinki Metro', 24.96, 60.32, 'Finland', 'medium', 'EU'],
  ['Dublin Metro', -6.27, 53.43, 'Ireland', 'medium', 'EU'],
  ['Lisbon Metro', -9.14, 38.78, 'Portugal', 'medium', 'EU'],
  ['Athens Metro', 23.73, 37.94, 'Greece', 'medium', 'EU'],
  ['Hamburg Metro', 9.99, 53.63, 'Germany', 'medium', 'EU'],
  ['Luxembourg Metro', 6.13, 49.63, 'Luxembourg', 'small', 'EU'],
  ['Dubai Terminal', 55.36, 25.25, 'United Arab Emirates', 'large', 'ME'],
  ['Abu Dhabi Metro', 54.65, 24.43, 'United Arab Emirates', 'medium', 'ME'],
  ['Doha Terminal', 51.61, 25.26, 'Qatar', 'large', 'ME'],
  ['Riyadh Metro', 46.72, 24.71, 'Saudi Arabia', 'large', 'ME'],
  ['Jeddah Metro', 39.17, 21.68, 'Saudi Arabia', 'medium', 'ME'],
  ['Tel Aviv Terminal', 34.89, 32.0, 'Israel', 'large', 'ME'],
  ['Amman Metro', 35.99, 31.72, 'Jordan', 'medium', 'ME'],
  ['Beirut Metro', 35.49, 33.82, 'Lebanon', 'medium', 'ME'],
  ['Istanbul Terminal', 28.95, 41.01, 'Turkey', 'large', 'ME'],
  ['Ankara Metro', 32.86, 39.92, 'Turkey', 'medium', 'ME'],
  ['Baghdad Metro', 44.36, 33.31, 'Iraq', 'medium', 'ME'],
  ['Kuwait Metro', 47.97, 29.23, 'Kuwait', 'medium', 'ME'],
  ['Muscat Metro', 58.54, 23.59, 'Oman', 'medium', 'ME'],
  ['Karachi Metro', 67.16, 24.91, 'Pakistan', 'medium', 'ME'],
  ['Islamabad Metro', 73.1, 33.62, 'Pakistan', 'medium', 'ME'],
  ['Baku Metro', 49.85, 40.41, 'Azerbaijan', 'medium', 'ME'],
  ['Sydney Terminal', 151.18, -33.87, 'Australia', 'large', 'AU'],
  ['Melbourne Terminal', 144.84, -37.67, 'Australia', 'large', 'AU'],
  ['Brisbane Metro', 153.12, -27.38, 'Australia', 'medium', 'AU'],
  ['Canberra Metro', 149.19, -35.31, 'Australia', 'medium', 'AU'],
  ['Adelaide Metro', 138.6, -34.93, 'Australia', 'medium', 'AU'],
  ['Gold Coast Metro', 153.4, -28.17, 'Australia', 'medium', 'AU'],
  ['Hobart Metro', 147.33, -42.84, 'Australia', 'small', 'AU'],
  ['Cairns Metro', 145.75, -16.89, 'Australia', 'small', 'AU'],
  // filler hubs for wall-only / radar-only to reach exact counts
  ['Nara Corridor', 135.82, 34.68, 'Japan', 'small', 'JP'],
  ['Da Nang Corridor', 108.22, 16.07, 'Thailand', 'medium', 'SE'],
  ['Varanasi Metro', 82.973, 25.317, 'India', 'small', 'IN'],
  ['Reykjavik Watch', -21.942, 64.146, 'Iceland', 'medium', 'EU'],
  ['Cairo Watch', 31.235, 30.044, 'Egypt', 'large', 'ME'],
  ['Kabul Watch', 69.207, 34.555, 'Afghanistan', 'medium', 'ME'],
  ['Port Moresby Watch', 147.18, -9.443, 'Papua New Guinea', 'medium', 'SE'],
  ['Male Watch', 73.509, 4.175, 'Maldives', 'small', 'SE'],
  ['Kuching Watch', 110.359, 1.553, 'Malaysia', 'medium', 'SE'],
  ['Davao Watch', 125.612, 7.073, 'Philippines', 'medium', 'SE'],
  ['Perth Corridor', 115.86, -31.95, 'Australia', 'medium', 'AU'],
  ['Darwin Corridor', 130.84, -12.46, 'Australia', 'medium', 'AU'],
  ['Tbilisi Watch', 44.793, 41.715, 'Georgia', 'medium', 'ME'],
  ['Sanaa Watch', 44.207, 15.369, 'Yemen', 'medium', 'ME'],
  ['Tripoli Watch', 13.191, 32.887, 'Libya', 'medium', 'ME'],
]

if (HUBS.length < 100) {
  throw new Error(`Need at least 100 hubs, got ${HUBS.length}`)
}

/** 可探测飞机雷达（按枢纽名匹配，不依赖 RDR 序号） */
const DETECT_SURVEILLANCE_KEYWORDS = [
  'London',
  'Paris',
  'Frankfurt',
  'Berlin',
  'Amsterdam',
  'Madrid',
  'Rome',
  'Warsaw',
  'Prague',
  'Stockholm',
  'Oslo',
  'Delhi',
  'Mumbai',
  'Chennai',
  'Kolkata',
  'Bangalore',
  'Hyderabad',
  'Ahmedabad',
  'Dubai',
]

function isDetectRadar(cityOrRadarName) {
  return DETECT_SURVEILLANCE_KEYWORDS.some((keyword) => cityOrRadarName.includes(keyword))
}

/** 与雷达共址的 55 个枢纽（优先含可探测城市 + 主要终端区） */
const OVERLAP_HUB_NAMES = new Set([
  'Tokyo Metro', 'Osaka Metro', 'Bangkok Terminal', 'Singapore Terminal', 'Jakarta Metro',
  'Kuala Lumpur Metro', 'Manila Terminal', 'Taipei Metro', 'Delhi Terminal', 'Mumbai Terminal',
  'Bangalore Metro', 'Chennai Metro', 'Kolkata Metro', 'Hyderabad Metro', 'Ahmedabad Metro',
  'London Terminal', 'Paris Terminal', 'Frankfurt Terminal', 'Berlin Metro', 'Amsterdam Terminal',
  'Madrid Terminal', 'Rome Terminal', 'Milan Metro', 'Zurich Metro', 'Stockholm Metro', 'Oslo Metro',
  'Warsaw Metro', 'Prague Metro', 'Budapest Metro', 'Kyiv Metro', 'Dubai Terminal', 'Doha Terminal',
  'Riyadh Metro', 'Tel Aviv Terminal', 'Istanbul Terminal', 'Sydney Terminal', 'Melbourne Terminal',
  'Brisbane Metro', 'Nagoya Metro', 'Surabaya Metro', 'Dhaka Metro', 'Colombo Metro',
  'Athens Metro', 'Vienna Metro', 'Copenhagen Metro', 'Helsinki Metro', 'Dublin Metro',
  'Lisbon Metro', 'Barcelona Metro', 'Munich Metro', 'Brussels Metro', 'Ankara Metro',
  'Abu Dhabi Metro', 'Gold Coast Metro', 'Fukuoka Metro',
])

const overlapHubs = HUBS.filter((hub) => OVERLAP_HUB_NAMES.has(hub[0]))
if (overlapHubs.length !== OVERLAP_COUNT) {
  throw new Error(`Expected ${OVERLAP_COUNT} overlap hubs, got ${overlapHubs.length}`)
}

const nonOverlapHubs = HUBS.filter((hub) => !OVERLAP_HUB_NAMES.has(hub[0]))

const assignments = [
  ...overlapHubs.map((hub, idx) => ({ hub, idx, mode: 'overlap' })),
  ...nonOverlapHubs.slice(0, WALL_ONLY_COUNT).map((hub, idx) => ({
    hub,
    idx: idx + OVERLAP_COUNT,
    mode: 'wallOnly',
  })),
  ...nonOverlapHubs.slice(WALL_ONLY_COUNT, WALL_ONLY_COUNT + RADAR_ONLY_COUNT).map((hub, idx) => ({
    hub,
    idx: idx + OVERLAP_COUNT + WALL_ONLY_COUNT,
    mode: 'radarOnly',
  })),
]

const regionCounters = { JP: 0, SE: 0, IN: 0, EU: 0, ME: 0, AU: 0 }
function nextRadarId(region) {
  regionCounters[region] += 1
  const prefix =
    region === 'JP' ? 'JP' : region === 'SE' ? 'SE' : region === 'IN' ? 'IN' : region === 'EU' ? 'EU' : region === 'ME' ? 'ME' : 'AU'
  return `${prefix}-RDR-${String(regionCounters[region]).padStart(2, '0')}`
}

const overlapAssignments = assignments.filter((a) => a.mode === 'overlap')
const wallOnlyAssignments = assignments.filter((a) => a.mode === 'wallOnly')
const radarOnlyAssignments = assignments.filter((a) => a.mode === 'radarOnly')

if (overlapAssignments.length !== OVERLAP_COUNT) throw new Error('overlap count mismatch')
if (wallOnlyAssignments.length !== WALL_ONLY_COUNT) throw new Error('wallOnly count mismatch')
if (radarOnlyAssignments.length !== RADAR_ONLY_COUNT) throw new Error('radarOnly count mismatch')

const radars = []
const walls = []

for (const { hub, idx, mode } of overlapAssignments) {
  const [cityName, lng, lat, country, sizeTier, region] = hub
  const radarId = nextRadarId(region)
  const radarRadius = 52000 + (idx % 7) * 2500
  const wallOffsetKm = 18 + (idx % 9) * 1.1
  const wallBearing = (idx * 53 + 17) % 360
  const [wallLng, wallLat] = offsetPoint(lng, lat, wallOffsetKm, wallBearing)

  radars.push({
    id: radarId,
    name: `${cityName.replace(/ Metro| Terminal| Corridor| Approach/g, '')} Surveillance`,
    center: { longitude: lng, latitude: lat, altitude: 50 + (idx % 400) },
    radiusMeters: radarRadius,
    detectAircraft: isDetectRadar(cityName),
    country,
  })

  const level = LEVELS[walls.length]
  const radius = pickWallRadius(sizeTier, idx)
  walls.push({
    id: `WALL-${String(walls.length + 1).padStart(3, '0')}`,
    name: `${cityName} Electronic Fence`,
    positions: createPolygon(wallLng, wallLat, radius, 7, (idx * 0.37) % (Math.PI * 2), idx),
    ...pickAlt(level, sizeTier),
    visualStyle: pickVisualStyle(level, idx),
    country,
    level,
  })
}

for (const { hub, idx, mode } of wallOnlyAssignments) {
  const [cityName, lng, lat, country, sizeTier, region] = hub
  let wallLng = lng
  let wallLat = lat
  let attempts = 0
  while (attempts < 24) {
    const nearest = radars.reduce(
      (best, radar) => {
        const d = haversine(wallLng, wallLat, radar.center.longitude, radar.center.latitude)
        return d < best.d ? { d, radar } : best
      },
      { d: Infinity, radar: null },
    )
    const clearance = nearest.d - nearest.radar.radiusMeters
    if (clearance > 45000) break
    const awayBearing =
      (Math.atan2(
        wallLng - nearest.radar.center.longitude,
        wallLat - nearest.radar.center.latitude,
      ) *
        180) /
        Math.PI +
      180
    ;[wallLng, wallLat] = offsetPoint(wallLng, wallLat, 45 + attempts * 8, awayBearing + attempts * 11)
    attempts += 1
  }

  const level = LEVELS[walls.length]
  const radius = pickWallRadius(sizeTier, idx)
  walls.push({
    id: `WALL-${String(walls.length + 1).padStart(3, '0')}`,
    name: `${cityName} Electronic Fence`,
    positions: createPolygon(wallLng, wallLat, radius, 7, (idx * 0.41) % (Math.PI * 2), idx),
    ...pickAlt(level, sizeTier),
    visualStyle: pickVisualStyle(level, idx),
    country,
    level,
  })
}

for (const { hub, idx } of radarOnlyAssignments) {
  const [cityName, lng, lat, country, , region] = hub
  const radarId = nextRadarId(region)
  radars.push({
    id: radarId,
    name: `${cityName.replace(/ Metro| Terminal| Corridor| Approach| Watch/g, '')} Surveillance`,
    center: { longitude: lng, latitude: lat, altitude: 50 + (idx % 500) },
    radiusMeters: 68000 + (idx % 6) * 4000,
    detectAircraft: isDetectRadar(cityName),
    country,
  })
}

// Fill remaining walls/radars to 100 each with strict separation
let fillIdx = 100
while (walls.length < OVERLAP_COUNT + WALL_ONLY_COUNT + FILLER_WALL_COUNT) {
  const hub = HUBS[fillIdx % HUBS.length]
  fillIdx += 1
  const [cityName, lng, lat, country, sizeTier] = hub
  let wallLng = lng
  let wallLat = lat
  for (let t = 0; t < 20; t++) {
    const inside = radars.some((radar) => {
      const d = haversine(wallLng, wallLat, radar.center.longitude, radar.center.latitude)
      return d <= radar.radiusMeters + 5000
    })
    if (!inside) break
    ;[wallLng, wallLat] = offsetPoint(lng, lat, 60 + t * 12, (t * 71 + fillIdx * 13) % 360)
  }
  const level = LEVELS[walls.length]
  walls.push({
    id: `WALL-${String(walls.length + 1).padStart(3, '0')}`,
    name: `${cityName} Electronic Fence`,
    positions: createPolygon(wallLng, wallLat, pickWallRadius(sizeTier, fillIdx), 7, fillIdx * 0.2, fillIdx),
    ...pickAlt(level, sizeTier),
    visualStyle: pickVisualStyle(level, fillIdx),
    country,
    level,
  })
}

while (radars.length < OVERLAP_COUNT + RADAR_ONLY_COUNT + FILLER_RADAR_COUNT) {
  const hub = HUBS[(fillIdx + radars.length * 3) % HUBS.length]
  const [cityName, lng, lat, country, , region] = hub
  let radarLng = lng
  let radarLat = lat
  for (let t = 0; t < 16; t++) {
    const conflict = walls.some((wall) => {
      const [cx, cy] = polyCentroid(wall.positions)
      return haversine(cx, cy, radarLng, radarLat) <= 72000
    })
    if (!conflict) break
    ;[radarLng, radarLat] = offsetPoint(lng, lat, 55 + t * 10, (t * 59 + fillIdx) % 360)
  }
  const radarId = nextRadarId(region)
  radars.push({
    id: radarId,
    name: `${cityName.replace(/ Metro| Terminal| Corridor| Approach| Watch/g, '')} Surveillance`,
    center: { longitude: radarLng, latitude: radarLat, altitude: 80 + (radars.length % 300) },
    radiusMeters: 70000 + (radars.length % 5) * 5000,
    detectAircraft: isDetectRadar(cityName),
    country,
  })
}

for (const radar of radars) {
  radar.detectAircraft = false
}
let detectCount = 0
for (const keyword of DETECT_SURVEILLANCE_KEYWORDS) {
  const radar = radars.find((r) => r.name.includes(keyword) && !r.detectAircraft)
  if (!radar) continue
  radar.detectAircraft = true
  detectCount += 1
}

function wallInsideRadar(wall, radar) {
  const [cx, cy] = polyCentroid(wall.positions)
  return haversine(cx, cy, radar.center.longitude, radar.center.latitude) <= radar.radiusMeters
}

let overlapWalls = 0
for (const wall of walls) {
  if (radars.some((radar) => wallInsideRadar(wall, radar))) overlapWalls += 1
}

let radarOnlyCount = 0
for (const radar of radars) {
  const hasWall = walls.some((wall) => wallInsideRadar(wall, radar))
  if (!hasWall) radarOnlyCount += 1
}

let wallOnlyCount = 0
for (const wall of walls) {
  if (!radars.some((radar) => wallInsideRadar(wall, radar))) wallOnlyCount += 1
}

fs.writeFileSync(WALL_OUTPUT, `${JSON.stringify(walls, null, 2)}\n`)
fs.writeFileSync(RADAR_OUTPUT, `${JSON.stringify(radars, null, 2)}\n`)

console.log('Written', WALL_OUTPUT, `(${walls.length} walls)`)
console.log('Written', RADAR_OUTPUT, `(${radars.length} radars)`)
console.log('Levels:', {
  danger: walls.filter((w) => w.level === 'danger').length,
  warning: walls.filter((w) => w.level === 'warning').length,
  normal: walls.filter((w) => w.level === 'normal').length,
})
console.log('Overlap walls (centroid in radar):', overlapWalls, `(${overlapWalls}%)`)
console.log('Wall-only:', wallOnlyCount, `(${wallOnlyCount}%)`)
console.log('Radar-only (no wall in circle):', radarOnlyCount, `(${radarOnlyCount}%)`)
