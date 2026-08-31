import * as Cesium from 'cesium'
import arrowWallFabricSource from './arrow-wall-material.fabric.glsl?raw'
import { WALL_ARROW_WALL_DEFAULTS } from '../wall-constants'

export const ARROW_WALL_MATERIAL_TYPE = 'ArrowWallMaterial'
const WALL_TIME_EPOCH = Cesium.JulianDate.fromDate(new Date(0))

export interface ArrowWallMaterialOptions {
  image: string
  scrollDurationMs?: number
}

// 圈/s = 一秒跑多少圈
export const toArrowWallShaderSpeed = (scrollDurationMs: number): number =>
  1 / (scrollDurationMs / 1000)

let isArrowWallMaterialRegistered = false

export const registerArrowWallMaterial = (): void => {
  if (isArrowWallMaterialRegistered) return

  Cesium.Material._materialCache.addMaterial(ARROW_WALL_MATERIAL_TYPE, {
    fabric: {
      type: ARROW_WALL_MATERIAL_TYPE,
      uniforms: {
        image: '',
        time: 0,
      },
      source: arrowWallFabricSource,
    },
    translucent: () => true,
  })

  isArrowWallMaterialRegistered = true
}

export const createArrowWallMaterial = (
  options: ArrowWallMaterialOptions,
): Cesium.Material => {
  registerArrowWallMaterial()

  const scrollDurationMs =
    options.scrollDurationMs ?? WALL_ARROW_WALL_DEFAULTS.scrollDurationMs

  return new Cesium.Material({
    fabric: {
      type: ARROW_WALL_MATERIAL_TYPE,
      uniforms: {
        image: options.image,
        time: 0,
      },
    },
  })
}

export const updateArrowWallMaterialTime = (
  material: Cesium.Material,
  clockTime: Cesium.JulianDate,
  durationMs: number = WALL_ARROW_WALL_DEFAULTS.scrollDurationMs,
): void => {
  const elapsedSeconds = Cesium.JulianDate.secondsDifference(clockTime, WALL_TIME_EPOCH)
  const durationS = durationMs / 1000
  // elapsedSeconds%durationS∈[0,durationS)，再 /durationS → [0,1)
  material.uniforms.time = (elapsedSeconds % durationS) / durationS
}
