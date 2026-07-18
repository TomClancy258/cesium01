import { emitCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import type * as Cesium from 'cesium'
import type { PhotogrammetryHoveredProperties } from '@/views/aviation-situation/types/photogrammetry'

/** 倾斜摄影 hover：仅发 tooltip 事件，不高亮 */
export const handlePhotogrammetryHover = (
  properties: PhotogrammetryHoveredProperties,
  screenPosition: Cesium.Cartesian2,
) => {
  emitCesiumEvent('photogrammetryHover', properties, screenPosition)
}
