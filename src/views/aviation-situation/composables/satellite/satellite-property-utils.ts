import type { Satellite } from '@/network/satellite/type'
import type { SatelliteHoveredProperties } from '@/views/aviation-situation/types/satellite'
import type { LngLatAlt } from '@/views/aviation-situation/types/shared'

/** 从 renderMap.data + 实时坐标组装 tooltip / 选中态业务快照 */
export function toSatelliteHoveredProperties(
  satellite: Satellite,
  lngLatAlt: LngLatAlt,
): SatelliteHoveredProperties {
  return {
    id: satellite.id,
    sourceType: 'satellite',
    name: satellite.name ?? '',
    country: satellite.country ?? '',
    description: satellite.description ?? '',
    scan: {
      target: satellite.scan.target,
    },
    lngLatAlt: {
      longitude: lngLatAlt.longitude,
      latitude: lngLatAlt.latitude,
      height: lngLatAlt.height,
    },
  }
}
