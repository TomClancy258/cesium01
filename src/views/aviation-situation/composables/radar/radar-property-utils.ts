import type { RadarTable, RadarHoveredProperties } from '@/views/aviation-situation/types/radar'

export function toRadarHoveredProperties(
  radar: RadarTable,
  aircraftCount: number,
): RadarHoveredProperties {
  return {
    ...radar,
    aircraftCount,
  }
}
