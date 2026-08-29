import * as Cesium from 'cesium'
import groundRadarScanFabricSource from './ground-radar-scan-material.fabric.glsl?raw'

export const GROUND_RADAR_SCAN_MATERIAL_TYPE = 'GroundRadarScanMaterial'
const RADAR_TIME_EPOCH = Cesium.JulianDate.fromDate(new Date(0))

export const GROUND_RADAR_SCAN_DEFAULTS = {
  color: Cesium.Color.CYAN.withAlpha(0.85),
  /** 扇形绕圆心转一圈的时间（仿真时钟，ms），与卫星 sweepDurationMs 同语义 */
  sweepDurationMs: 8_000,
  /** 扫描扇形角度（度） */
  sectorAngleDeg: 45,
  /** 整圆底色 alpha；纯扫描动画为 0，范围可视化可 0.05~0.08 */
  baseAlpha: 0,
  /** 外缘描边 alpha 强度（非线宽） */
  rimStrength: 0.75,
} as const

export interface GroundRadarScanMaterialOptions {
  color?: Cesium.Color
  sweepDurationMs?: number
  sectorAngleDeg?: number
  phase?: number // 每雷达 Math.random() 初始相位偏移，让多雷达不同步扫
  baseAlpha?: number
  rimStrength?: number
}

/** shader uniform：圈/秒，由 sweepDurationMs 换算 */
export const toGroundRadarShaderSpeed = (sweepDurationMs: number): number =>
  1000 / sweepDurationMs

/** shader uniform：占整圆比例 [0,1]，由 sectorAngleDeg 换算 */
export const toGroundRadarShaderSectorWidth = (sectorAngleDeg: number): number =>
  sectorAngleDeg / 360

let isGroundRadarScanMaterialRegistered = false

export const registerGroundRadarScanMaterial = (): void => {
  if (isGroundRadarScanMaterialRegistered) return

  Cesium.Material._materialCache.addMaterial(GROUND_RADAR_SCAN_MATERIAL_TYPE, {
    fabric: {
      type: GROUND_RADAR_SCAN_MATERIAL_TYPE,
      uniforms: {
        color: GROUND_RADAR_SCAN_DEFAULTS.color,
        time: 0,
        speed: toGroundRadarShaderSpeed(GROUND_RADAR_SCAN_DEFAULTS.sweepDurationMs),
        phase: 0,
        sectorWidth: toGroundRadarShaderSectorWidth(GROUND_RADAR_SCAN_DEFAULTS.sectorAngleDeg),
        baseAlpha: GROUND_RADAR_SCAN_DEFAULTS.baseAlpha,
        rimStrength: GROUND_RADAR_SCAN_DEFAULTS.rimStrength,
        highlight: 0, // 0（hover 时 1）交互高亮：略提亮 rim / diffuse，不改扫描逻辑
      },
      source: groundRadarScanFabricSource,
    },
    translucent: () => true,
  })

  isGroundRadarScanMaterialRegistered = true
}

export const createGroundRadarScanMaterial = (
  options: GroundRadarScanMaterialOptions = {},
): Cesium.Material => {
  registerGroundRadarScanMaterial()

  const sweepDurationMs =
    options.sweepDurationMs ?? GROUND_RADAR_SCAN_DEFAULTS.sweepDurationMs
  const sectorAngleDeg = options.sectorAngleDeg ?? GROUND_RADAR_SCAN_DEFAULTS.sectorAngleDeg

  return new Cesium.Material({
    fabric: {
      type: GROUND_RADAR_SCAN_MATERIAL_TYPE,
      uniforms: {
        color: options.color?.clone() ?? GROUND_RADAR_SCAN_DEFAULTS.color.clone(),
        time: 0,
        speed: toGroundRadarShaderSpeed(sweepDurationMs),
        phase: options.phase ?? Math.random(),
        sectorWidth: toGroundRadarShaderSectorWidth(sectorAngleDeg),
        baseAlpha: options.baseAlpha ?? GROUND_RADAR_SCAN_DEFAULTS.baseAlpha,
        rimStrength: options.rimStrength ?? GROUND_RADAR_SCAN_DEFAULTS.rimStrength,
        highlight: 0,
      },
    },
  })
}

export const updateGroundRadarScanMaterialTime = (
  material: Cesium.Material,
  clockTime: Cesium.JulianDate,
): void => {
  const elapsedSeconds = Cesium.JulianDate.secondsDifference(clockTime, RADAR_TIME_EPOCH)
  // 必须在 JS 里先归一化到 [0,1)。直接传「自 1970 起的秒数」(≈1.7e9)
  // 到 GPU float32 会丢小数精度，shader 里 fract(time * speed) 几乎不变。
  // const speed =
  //   Number(material.uniforms.speed) ||
  //   toGroundRadarShaderSpeed(GROUND_RADAR_SCAN_DEFAULTS.sweepDurationMs)
  // const head = ((elapsedSeconds * speed) % 1 + 1) % 1
  //speed= 圈/秒
  const speed=toGroundRadarShaderSpeed(GROUND_RADAR_SCAN_DEFAULTS.sweepDurationMs)
  //head为当前时间elapsedSeconds转了多少圈，再归一化
  const head= elapsedSeconds*speed%1
  material.uniforms.time = head
}
