import type {
  BostonBuildingRawProperties,
  MelbourneBuildingRawProperties,
  PhotogrammetryBuildingBBox,
  PhotogrammetryBuildingFeature,
  PhotogrammetryBuildingPolygonCoordinates,
  PhotogrammetryBuildingPosition,
  PhotogrammetryBuildingProperties,
  PhotogrammetryRawBuildingFeature,
} from './type'

const FEET_TO_METERS = 0.3048
/** 裁切后最多加载栋数，避免 ClassificationPrimitive 一次塞爆 */
export const PHOTOGRAMMETRY_BUILDING_LOAD_LIMIT = 2500

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const toMetersFromBostonHeight = (feetOrMeters: number): number => {
  // Analyze Boston 屋顶打断数据高程/层高多为英尺
  return Math.max(feetOrMeters * FEET_TO_METERS, 3)
}

const getOuterRing = (
  geometry: PhotogrammetryRawBuildingFeature['geometry'],
): PhotogrammetryBuildingPosition[] | null => {
  if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates)) {
    const ring = geometry.coordinates[0] as PhotogrammetryBuildingPosition[] | undefined
    return ring?.length ? ring : null
  }
  if (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) {
    const first = geometry.coordinates[0] as PhotogrammetryBuildingPosition[][] | undefined
    const ring = first?.[0]
    return ring?.length ? ring : null
  }
  return null
}

const ringCentroid = (ring: PhotogrammetryBuildingPosition[]): { lng: number; lat: number } => {
  let sumLng = 0
  let sumLat = 0
  const n = ring.length
  for (const pos of ring) {
    sumLng += pos[0]
    sumLat += pos[1]
  }
  return { lng: sumLng / n, lat: sumLat / n }
}

export const isPointInBBox = (
  lng: number,
  lat: number,
  bbox: PhotogrammetryBuildingBBox,
): boolean => lng >= bbox.west && lng <= bbox.east && lat >= bbox.south && lat <= bbox.north

export const expandBBox = (
  bbox: PhotogrammetryBuildingBBox,
  padRatio = 0.05,
): PhotogrammetryBuildingBBox => {
  const lngPad = (bbox.east - bbox.west) * padRatio
  const latPad = (bbox.north - bbox.south) * padRatio
  return {
    west: bbox.west - lngPad,
    south: bbox.south - latPad,
    east: bbox.east + lngPad,
    north: bbox.north + latPad,
  }
}

export const normalizeBostonBuildingFeature = (
  raw: PhotogrammetryRawBuildingFeature,
): PhotogrammetryBuildingFeature | null => {
  const ring = getOuterRing(raw.geometry)
  if (!ring) return null

  const props = raw.properties as BostonBuildingRawProperties
  const objectId = props.OBJECTID ?? raw.id
  if (objectId === undefined || objectId === null) return null

  const landUse = props.Land_Use || props.PART_USE || undefined
  const rawHgt = isFiniteNumber(props.BLDG_HGT_2010) ? props.BLDG_HGT_2010 : 20
  const height = toMetersFromBostonHeight(rawHgt)

  const properties: PhotogrammetryBuildingProperties = {
    id: `boston-${objectId}`,
    name: landUse ? `Boston ${landUse} #${objectId}` : `Boston Building #${objectId}`,
    minHeight: 0,
    height,
    buildingHeight: height,
    city: 'Boston',
    landUse,
  }

  const coordinates: PhotogrammetryBuildingPolygonCoordinates = [ring]
  return {
    type: 'Feature',
    properties,
    geometry: { type: 'Polygon', coordinates },
  }
}

export const normalizeMelbourneBuildingFeature = (
  raw: PhotogrammetryRawBuildingFeature,
): PhotogrammetryBuildingFeature | null => {
  const ring = getOuterRing(raw.geometry)
  if (!ring) return null

  const props = raw.properties as MelbourneBuildingRawProperties
  const structureId = props.structure_id ?? props.objectid ?? raw.id
  if (structureId === undefined || structureId === null) return null

  const extrusion = isFiniteNumber(props.structure_extrusion)
    ? props.structure_extrusion
    : isFiniteNumber(props.footprint_extrusion)
      ? props.footprint_extrusion
      : 10
  const buildingHeight = Math.max(extrusion, 3)
  const roofType = props.roof_type || undefined

  // Melbourne 高程为 AHD 米级绝对高；Classification 体积必须盖住 mesh。
  // 若仍用 minHeight=0 + 相对楼高，盒子在椭球附近，和楼体不相交 → 高亮偏矮 / 拾取不到。
  const BOTTOM_PAD = 20
  const TOP_PAD = 30
  let bottom = isFiniteNumber(props.structure_min_elevation)
    ? props.structure_min_elevation
    : 0
  let top = isFiniteNumber(props.structure_max_elevation)
    ? props.structure_max_elevation
    : bottom + buildingHeight
  if (top <= bottom) {
    top = bottom + buildingHeight
  }

  const properties: PhotogrammetryBuildingProperties = {
    id: `melbourne-${structureId}`,
    name: roofType
      ? `Melbourne ${roofType} #${structureId}`
      : `Melbourne Building #${structureId}`,
    minHeight: bottom - BOTTOM_PAD,
    height: top + TOP_PAD,
    buildingHeight,
    city: 'Melbourne',
    landUse: props.footprint_type || undefined,
    roofType,
  }

  return {
    type: 'Feature',
    properties,
    geometry: { type: 'Polygon', coordinates: [ring] },
  }
}

export const filterBuildingsByBBox = (
  features: PhotogrammetryBuildingFeature[],
  bbox: PhotogrammetryBuildingBBox,
  limit = PHOTOGRAMMETRY_BUILDING_LOAD_LIMIT,
): PhotogrammetryBuildingFeature[] => {
  const padded = expandBBox(bbox)
  const result: PhotogrammetryBuildingFeature[] = []
  for (const feature of features) {
    const ring = feature.geometry.coordinates[0]
    if (!ring?.length) continue
    const { lng, lat } = ringCentroid(ring)
    if (!isPointInBBox(lng, lat, padded)) continue
    result.push(feature)
    if (result.length >= limit) break
  }
  return result
}
