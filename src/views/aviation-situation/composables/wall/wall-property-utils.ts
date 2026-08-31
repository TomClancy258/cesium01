import type { WallHoveredProperties, WallTable } from '@/views/aviation-situation/types/wall'

export function toWallHoveredProperties(
  wall: WallTable,
  aircraftCount: number,
): WallHoveredProperties {
  return {
    ...wall,
    aircraftCount,
  }
}
