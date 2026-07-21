import * as Cesium from 'cesium'

/**
 * 默认完全透明：体积仍参与 pick，但不染色。
 * 避免多栋 Classification 同时上色时互相抢同一片 3D Tiles mesh。
 */
export const PHOTOGRAMMETRY_BUILDING_DEFAULT_COLOR = Cesium.Color.WHITE.withAlpha(0)

export const PHOTOGRAMMETRY_BUILDING_HOVER_COLOR =
  Cesium.Color.fromCssColorString('#A5F3FC').withAlpha(0.55)

export const PHOTOGRAMMETRY_BUILDING_SELECTED_COLOR =
  Cesium.Color.fromCssColorString('#06B6D4').withAlpha(0.65)
