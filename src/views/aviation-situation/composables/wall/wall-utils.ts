import * as turf from '@turf/turf'
import type { BBox } from 'geojson'
import type { MatchedWall, WallTable } from '@/views/aviation-situation/types/wall'
import type { Wall, WallPosition } from '@/network/wall/type'
import { createPolygonFromLngLatAltArray } from '@/utils/geoUtils'

export function wallPositionsToDegreesArray(positions: WallPosition[]): number[] {
  const flat: number[] = []
  for (const [lng, lat] of positions) {
    flat.push(lng, lat)
  }
  return flat
}

export function buildWallTable(wall: Wall): WallTable {
  const lngLatAltArray: number[] = []
  for (const [lng, lat] of wall.positions) {
    lngLatAltArray.push(lng, lat, wall.minAltitude)
  }
  const graphic = createPolygonFromLngLatAltArray(lngLatAltArray)
  return {
    ...wall,
    graphic,
    bbox: turf.bbox(graphic),
  }
}

export function isPointInWallRegion(
  lngLat: [number, number],
  baroAltitude: number,
  matchedWall: MatchedWall,
  bbox?: BBox,
): boolean {
  const { wall } = matchedWall
  if (baroAltitude < wall.minAltitude || baroAltitude > wall.maxAltitude) {
    return false
  }

  const regionBbox = bbox ?? wall.bbox
  if (
    lngLat[0] < regionBbox[0] ||
    lngLat[0] > regionBbox[2] ||
    lngLat[1] < regionBbox[1] ||
    lngLat[1] > regionBbox[3]
  ) {
    return false
  }

  return turf.booleanPointInPolygon(turf.point(lngLat), wall.graphic)
}

export function getWallCentroid(wall: WallTable): [number, number] {
  const centroid = turf.centroid(wall.graphic)
  return centroid.geometry.coordinates as [number, number]
}
