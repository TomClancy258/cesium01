import { shallowRef } from 'vue'
import type { RadarHoveredProperties } from '@/views/aviation-situation/types/radar'

const hoveredProperties = shallowRef<RadarHoveredProperties | null>(null)

export const setRadarHoveredProperties = (
  properties: RadarHoveredProperties | null,
): void => {
  hoveredProperties.value = properties
}

export const getRadarHoveredProperties = () => hoveredProperties
