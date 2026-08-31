import * as Cesium from 'cesium'
import layeredRingWallFabricSource from './layered-ring-wall-material.fabric.glsl?raw'
import { WALL_LAYERED_RING_DEFAULTS } from '../wall-constants'

export const LAYERED_RING_WALL_MATERIAL_TYPE = 'LayeredRingWallMaterial'
const WALL_TIME_EPOCH = Cesium.JulianDate.fromDate(new Date(0))

export interface LayeredRingWallMaterialOptions {
  color?: Cesium.Color
  durationMs?: number
  bandCount?: number
  bandWidth?: number
  glowStrength?: number
}

let isLayeredRingWallMaterialRegistered = false

export const registerLayeredRingWallMaterial = (): void => {
  if (isLayeredRingWallMaterialRegistered) return

  Cesium.Material._materialCache.addMaterial(LAYERED_RING_WALL_MATERIAL_TYPE, {
    fabric: {
      type: LAYERED_RING_WALL_MATERIAL_TYPE,
      uniforms: {
        color: Cesium.Color.LIME.withAlpha(0.9),
        time: 0,
        bandCount: WALL_LAYERED_RING_DEFAULTS.bandCount,
        bandWidth: WALL_LAYERED_RING_DEFAULTS.bandWidth,
        glowStrength: WALL_LAYERED_RING_DEFAULTS.glowStrength,
      },
      source: layeredRingWallFabricSource,
    },
    translucent: () => true,
  })

  isLayeredRingWallMaterialRegistered = true
}

export const createLayeredRingWallMaterial = (
  options: LayeredRingWallMaterialOptions = {},
): Cesium.Material => {
  registerLayeredRingWallMaterial()

  return new Cesium.Material({
    fabric: {
      type: LAYERED_RING_WALL_MATERIAL_TYPE,
      uniforms: {
        color: options.color?.clone() ?? Cesium.Color.LIME.withAlpha(0.9),
        time: 0,
        bandCount: options.bandCount ?? WALL_LAYERED_RING_DEFAULTS.bandCount,
        bandWidth: options.bandWidth ?? WALL_LAYERED_RING_DEFAULTS.bandWidth,
        glowStrength: options.glowStrength ?? WALL_LAYERED_RING_DEFAULTS.glowStrength,
      },
    },
  })
}

export const updateLayeredRingWallMaterialTime = (
  material: Cesium.Material,
  clockTime: Cesium.JulianDate,
  durationMs: number = WALL_LAYERED_RING_DEFAULTS.durationMs,
): void => {
  const elapsedSeconds = Cesium.JulianDate.secondsDifference(clockTime, WALL_TIME_EPOCH)

  const durationS=durationMs/1000
  //elapsedSeconds%durationS=[0,8)，(elapsedSeconds%durationS)/durationS=[0,1)归一化
  const normalizedTime= (elapsedSeconds%durationS)/durationS
  material.uniforms.time =normalizedTime
}
