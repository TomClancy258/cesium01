import * as Cesium from 'cesium'
import type { ControlZoneLevel } from '@/network/control-zone/type'

export const CONTROL_ZONE_LEVEL_STYLES: Record<
  ControlZoneLevel,
  { material: Cesium.Color; outlineColor: Cesium.Color }
> = {
  warning: {
    material: Cesium.Color.ORANGE.withAlpha(0.35),
    outlineColor: Cesium.Color.ORANGE,
  },
  danger: {
    material: Cesium.Color.RED.withAlpha(0.2),
    outlineColor: Cesium.Color.RED,
  },
  info: {
    material: Cesium.Color.SKYBLUE.withAlpha(0.25),
    outlineColor: Cesium.Color.SKYBLUE,
  },
  normal: {
    material: Cesium.Color.LIME.withAlpha(0.15),
    outlineColor: Cesium.Color.LIME,
  },
}

export const CONTROL_ZONE_INTERACTION_OUTLINE = {
  hover: Cesium.Color.fromCssColorString('#A5F3FC'),
  select: Cesium.Color.fromCssColorString('#06B6D4'),
}
