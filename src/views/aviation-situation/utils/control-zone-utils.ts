import * as turf from '@turf/turf'
import { MatchedControlZone } from '@/views/aviation-situation/types/control-zone'

export function isPointInControlZoneRegion(
  lngLat: [number, number],
  matchedControlZone: MatchedControlZone,
  bbox?: turf.BBox,
): boolean {
  const {
    graphic,
  } = matchedControlZone

    const regionBbox = bbox ?? matchedControlZone.bbox
    if (!regionBbox) return false
    if (lngLat[0] < regionBbox[0] || lngLat[0] > regionBbox[2] ||
      lngLat[1] < regionBbox[1] || lngLat[1] > regionBbox[3]) return false
    return turf.booleanPointInPolygon(turf.point(lngLat), graphic)
}
