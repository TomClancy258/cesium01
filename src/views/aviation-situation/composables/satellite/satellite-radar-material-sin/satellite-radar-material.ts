import * as Cesium from 'cesium'
import satelliteRadarFabricSource from './satellite-radar-material.fabric.glsl?raw'
import airplane01Jpg from '@/assets/img/airplane/jpg/airplane01.jpg'

const SATELLITE_RADAR_MATERIAL_TYPE = 'SatelliteRadarPrimitive'
const RADAR_TIME_EPOCH = Cesium.JulianDate.fromDate(new Date(0))

export const SATELLITE_RADAR_DEFAULTS = {
  image: airplane01Jpg,
  color: Cesium.Color.CYAN.withAlpha(0.85),
  /** 单圈从锥顶扫到锥底的行程时间（仿真时钟，ms） */
  sweepDurationMs: 50_000,
  /** 径向环数，对应 shader 中 sin 频率；与 time 相乘使 sweepDurationMs = 顶→底 */
  ringCount: 20,
  repeat: 30,
  offset: 0,
  thickness: 0.12,
}

let isSatelliteRadarMaterialRegistered = false

export interface SatelliteRadarMaterialOptions {
  image?: string
  color?: Cesium.Color
  sweepDurationMs?: number
  ringCount?: number
  repeat?: number
  offset?: number
  thickness?: number
  phase?: number
}

export const registerSatelliteRadarMaterial = (): void => {
  if (isSatelliteRadarMaterialRegistered) return

  Cesium.Material._materialCache.addMaterial(SATELLITE_RADAR_MATERIAL_TYPE, {
    fabric: {
      type: SATELLITE_RADAR_MATERIAL_TYPE,
      uniforms: {
        image: SATELLITE_RADAR_DEFAULTS.image,
        color: SATELLITE_RADAR_DEFAULTS.color,
        time: 0,
        ringCount: SATELLITE_RADAR_DEFAULTS.ringCount,
        repeat: SATELLITE_RADAR_DEFAULTS.repeat,
        offset: SATELLITE_RADAR_DEFAULTS.offset,
        thickness: SATELLITE_RADAR_DEFAULTS.thickness,
      },
      source: satelliteRadarFabricSource,
    },
    translucent: () => true,
  })

  isSatelliteRadarMaterialRegistered = true
}

export class SatelliteRadarMaterialProperty {
  private readonly _definitionChanged = new Cesium.Event()
  private readonly _image: string
  private readonly _color: Cesium.Color
  private readonly sweepDurationMs: number
  private readonly ringCount: number
  private readonly repeat: number
  private readonly offset: number
  private readonly thickness: number
  private readonly phase: number

  constructor(options: SatelliteRadarMaterialOptions = {}) {
    this._image = options.image ?? SATELLITE_RADAR_DEFAULTS.image
    this._color = options.color?.clone() ?? SATELLITE_RADAR_DEFAULTS.color.clone()
    this.sweepDurationMs = options.sweepDurationMs ?? SATELLITE_RADAR_DEFAULTS.sweepDurationMs
    this.ringCount = options.ringCount ?? SATELLITE_RADAR_DEFAULTS.ringCount
    this.repeat = options.repeat ?? SATELLITE_RADAR_DEFAULTS.repeat
    this.offset = options.offset ?? SATELLITE_RADAR_DEFAULTS.offset
    this.thickness = options.thickness ?? SATELLITE_RADAR_DEFAULTS.thickness
    this.phase = options.phase ?? Math.random()
  }

  get isConstant() {
    return false
  }

  get definitionChanged() {
    return this._definitionChanged
  }

  getType() {
    return SATELLITE_RADAR_MATERIAL_TYPE
  }

  getValue(time: Cesium.JulianDate, result?: Record<string, unknown>) {
    const materialResult = result ?? {}
    const elapsedSeconds = Cesium.JulianDate.secondsDifference(time, RADAR_TIME_EPOCH)
    //elapsedMs 从固定纪元 1970-01-01 到现在过了多少毫秒
    const elapsedMs = elapsedSeconds * 1000
    //删掉this.phase * this.sweepDurationMs也无妨，只是把该卫星扫描的初始时间+[0,1)*光圈周期
    //% this.sweepDurationMs=[0,this.sweepDurationMs=光圈动画周期=5s)
    const phasedMs = (elapsedMs + this.phase * this.sweepDurationMs) % this.sweepDurationMs
    //normalizedTime 当前时间占sweepDurationMs的百分比，[0,1)
    const normalizedTime = phasedMs / this.sweepDurationMs
    materialResult.image = this._image
    materialResult.color = this._color
    //normalizedTime：sweepDurationMs 内从 0→1，对应单圈顶→底
    materialResult.time = normalizedTime
    materialResult.ringCount = this.ringCount
    materialResult.repeat = this.repeat
    materialResult.offset = this.offset
    materialResult.thickness = this.thickness
    return materialResult
  }

  equals(other: unknown) {
    return (
      this === other ||
      (other instanceof SatelliteRadarMaterialProperty &&
        this._image === other._image &&
        Cesium.Color.equals(this._color, other._color) &&
        this.sweepDurationMs === other.sweepDurationMs &&
        this.ringCount === other.ringCount &&
        this.repeat === other.repeat &&
        this.offset === other.offset &&
        this.thickness === other.thickness &&
        this.phase === other.phase)
    )
  }
}
