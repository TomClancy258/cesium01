import { emitCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import type * as Cesium from 'cesium'
import { highlightPhotogrammetryBuildingOnHover } from '@/views/aviation-situation/composables/highlight-manager/photogrammetry-building-highlight-manager'
import { PHOTOGRAMMETRY_BUILDING_HOVER_COLOR } from '@/views/aviation-situation/composables/photogrammetry/photogrammetry-constants'
import type {
  PhotogrammetryBuildingHoveredProperties,
  PhotogrammetryBuildingSelectedProperties,
} from '@/views/aviation-situation/types/photogrammetry'

export const handlePhotogrammetryBuildingHover = (
  properties: PhotogrammetryBuildingHoveredProperties,
  screenPosition: Cesium.Cartesian2,
) => {
  highlightPhotogrammetryBuildingOnHover(properties.id, PHOTOGRAMMETRY_BUILDING_HOVER_COLOR)
  emitCesiumEvent('photogrammetryBuildingHover', properties, screenPosition)
}

export const handlePhotogrammetryBuildingLeftClick = (
  properties: PhotogrammetryBuildingSelectedProperties,
): void => {
  emitCesiumEvent('photogrammetryBuildingLeftClick', properties)
}
