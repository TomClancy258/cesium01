import { shallowRef, type ShallowRef } from 'vue'
import type { ControlZoneHoveredProperties } from '@/views/aviation-situation/types/control-zone'

const hoveredProperties = shallowRef<ControlZoneHoveredProperties | null>(null)

export function setControlZoneHoveredProperties(
  properties: ControlZoneHoveredProperties | null,
): void {
  hoveredProperties.value = properties
}

export function getControlZoneHoveredProperties(): ShallowRef<ControlZoneHoveredProperties | null> {
  return hoveredProperties
}
