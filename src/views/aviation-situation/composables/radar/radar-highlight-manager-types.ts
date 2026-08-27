import type * as Cesium from 'cesium'
import type { RadarHighlightStyle } from '@/views/aviation-situation/types/radar'

export type RadarPickId = {
  sourceType: 'radar'
  id: string
}

export type RadarPrimitivePair = {
  fillPrimitive: Cesium.GroundPrimitive
  scanMaterial: Cesium.Material
  baseStyle: RadarHighlightStyle
}
