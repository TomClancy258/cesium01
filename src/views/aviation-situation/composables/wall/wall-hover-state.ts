import { shallowRef } from 'vue'
import type { WallHoveredProperties } from '@/views/aviation-situation/types/wall'

const hoveredProperties = shallowRef<WallHoveredProperties | null>(null)

export const setWallHoveredProperties = (
  properties: WallHoveredProperties | null,
): void => {
  hoveredProperties.value = properties
}

export const getWallHoveredProperties = () => hoveredProperties
