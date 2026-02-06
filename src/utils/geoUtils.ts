import type { Cartesian2 } from 'cesium'
import type { TooltipState } from '@/views/aviation-situation/types/shared'

export function isValidCoordinate(
  longitude: unknown,
  latitude: unknown
): boolean {
  return (
    longitude != null &&
    latitude != null &&
    typeof longitude === 'number' &&
    typeof latitude === 'number' &&
    isFinite(longitude) &&
    isFinite(latitude)
  )
}

export function updateTooltip<T>(
  tooltip: TooltipState<T>,
  screenPosition: Cartesian2,
  properties: T
): void {
  tooltip.position.left = screenPosition.x + 10
  tooltip.position.top = screenPosition.y + 50
  tooltip.properties = { ...properties }
  tooltip.visible = true
}
