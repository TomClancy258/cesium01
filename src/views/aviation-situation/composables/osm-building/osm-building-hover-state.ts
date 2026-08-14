import { shallowRef, type ShallowRef } from 'vue'
import type { OSMBuildingHoveredProperties } from '@/views/aviation-situation/types/osm-building'

const hoveredProperties = shallowRef<OSMBuildingHoveredProperties | null>(null)

export function setOsmBuildingHoveredProperties(
  properties: OSMBuildingHoveredProperties | null,
): void {
  hoveredProperties.value = properties
}

export function getOsmBuildingHoveredProperties(): ShallowRef<OSMBuildingHoveredProperties | null> {
  return hoveredProperties
}
