import * as Cesium from 'cesium'

/** 默认雷达圆样式（扫描 GLSL 接入前先用纯色） */
export const RADAR_DEFAULT_STYLE = {
  fillColor: Cesium.Color.RED.withAlpha(0.12),
  outlineColor: Cesium.Color.RED.withAlpha(0.85),
} as const

export const RADAR_INTERACTION_OUTLINE = {
  hover: Cesium.Color.fromCssColorString('#FCA5A5'),
  select: Cesium.Color.fromCssColorString('#EF4444'),
} as const
