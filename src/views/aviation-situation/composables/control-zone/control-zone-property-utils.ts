import type { ControlZoneRawProperties } from '@/network/control-zone/type'
import type { ControlZoneHoveredProperties } from '@/views/aviation-situation/types/control-zone'
import type { ControlZoneRegionSelectedData } from '@/views/aviation-situation/types/region-selection'

/** 从 renderMap.data 组装 tooltip 业务快照 */
export function toControlZoneHoveredProperties(
  data: ControlZoneRawProperties,
): ControlZoneHoveredProperties {
  return {
    id: data.id,
    name: data.name,
    level: data.level,
    minAltitude: data.minAltitude,
    maxAltitude: data.maxAltitude,
  }
}

/** 从 renderMap.data 组装区域轨选中态 */
export function toControlZoneRegionSelectedData(
  data: ControlZoneRawProperties,
): ControlZoneRegionSelectedData {
  return {
    sourceType: 'controlZone',
    id: data.id,
    name: data.name,
    level: data.level,
    minAltitude: data.minAltitude,
    maxAltitude: data.maxAltitude,
  }
}
