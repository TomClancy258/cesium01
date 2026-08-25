import * as Cesium from 'cesium'
import aircraftPlannedTrajectoryFabricSource from './aircraft-planned-trajectory-material.fabric.glsl?raw'
import airplane01Jpg from '@/assets/img/airplane/jpg/airplane01.jpg'

const AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_TYPE = 'AircraftPlannedTrajectoryPolyline'
const TRAJECTORY_TIME_EPOCH = Cesium.JulianDate.fromDate(new Date(0))

//① registerAircraftPlannedTrajectoryMaterial()  // 全局一次
//          ↓
// ② new AircraftPlannedTrajectoryMaterialProperty()
//          ↓
// ③ entities.add({ polyline: { material: ... } })
//          ↓
// ④ 每帧 getType / getValue → uniforms → fabric.glsl

export const AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_DEFAULTS = {
  image: airplane01Jpg,
  color: Cesium.Color.fromCssColorString('#1E40AF').withAlpha(0.95),
  /** 亮头沿整条路径跑完一圈的时间（仿真时钟，ms） */
  durationMs: 3000,
  /** 同时滚动的彗星头数量；计划航路推荐 1 */
  headCount: 5,
  /** 每个周期内亮头占的比例（靠近终点一侧） */
  headLength: 0.2,
  /** 底线透明度（无亮头处） */
  baseAlpha: 0.22,
}

let isAircraftPlannedTrajectoryMaterialRegistered = false

export interface AircraftPlannedTrajectoryMaterialOptions {
  image?: string
  color?: Cesium.Color
  durationMs?: number
  headCount?: number
  headLength?: number
  baseAlpha?: number
  phase?: number
}

export const registerAircraftPlannedTrajectoryMaterial = (): void => {
  if (isAircraftPlannedTrajectoryMaterialRegistered) return

  Cesium.Material._materialCache.addMaterial(AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_TYPE, {
    fabric: {
      type: AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_TYPE,
      uniforms: {
        image: AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_DEFAULTS.image,
        color: AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_DEFAULTS.color,
        time: 0,
        headCount: AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_DEFAULTS.headCount,
        headLength: AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_DEFAULTS.headLength,
        baseAlpha: AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_DEFAULTS.baseAlpha,
      },
      source: aircraftPlannedTrajectoryFabricSource,
    },
    translucent: () => true,
  })

  isAircraftPlannedTrajectoryMaterialRegistered = true
}

export class AircraftPlannedTrajectoryMaterialProperty {
  private readonly _definitionChanged = new Cesium.Event()
  private readonly _image: string
  private readonly _color: Cesium.Color
  private readonly durationMs: number
  private readonly headCount: number
  private readonly headLength: number
  private readonly baseAlpha: number
  private readonly phase: number

  constructor(options: AircraftPlannedTrajectoryMaterialOptions = {}) {
    this._image = options.image ?? AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_DEFAULTS.image
    this._color =
      options.color?.clone() ?? AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_DEFAULTS.color.clone()
    this.durationMs = options.durationMs ?? AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_DEFAULTS.durationMs
    this.headCount = options.headCount ?? AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_DEFAULTS.headCount
    this.headLength = options.headLength ?? AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_DEFAULTS.headLength
    this.baseAlpha = options.baseAlpha ?? AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_DEFAULTS.baseAlpha
    this.phase = options.phase ?? 0
  }

  get isConstant() {
    return false
  }

  get definitionChanged() {
    return this._definitionChanged
  }

  getType() {
    return AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_TYPE
  }

  getValue(time: Cesium.JulianDate, result?: Record<string, unknown>) {
    const materialResult = result ?? {}
    const elapsedSeconds = Cesium.JulianDate.secondsDifference(time, TRAJECTORY_TIME_EPOCH)
    const elapsedMs = elapsedSeconds * 1000
    const normalizedTime =
      ((elapsedMs + this.phase * this.durationMs) % this.durationMs) / this.durationMs

    materialResult.image = this._image
    materialResult.color = this._color
    materialResult.time = normalizedTime
    materialResult.headCount = this.headCount
    materialResult.headLength = this.headLength
    materialResult.baseAlpha = this.baseAlpha
    return materialResult
  }

  equals(other: unknown) {
    return (
      this === other ||
      (other instanceof AircraftPlannedTrajectoryMaterialProperty &&
        this._image === other._image &&
        Cesium.Color.equals(this._color, other._color) &&
        this.durationMs === other.durationMs &&
        this.headCount === other.headCount &&
        this.headLength === other.headLength &&
        this.baseAlpha === other.baseAlpha &&
        this.phase === other.phase)
    )
  }
}
