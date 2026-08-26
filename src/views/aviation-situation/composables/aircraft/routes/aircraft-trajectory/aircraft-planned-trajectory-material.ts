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
  color: Cesium.Color.fromCssColorString('#1E40AF').withAlpha(1),
  /**
   * time 走完 [0,1) 的时长（仿真时钟，ms）。
   * 配合 glsl：fract((st.s - time) * headCount)
   * → 无论 headCount 多少，都是「一个亮头从线一端跑到另一端」的时间。
   */
  durationMs: 8000,
  /** 同一时刻线上的彗星个数（不影响跑完全线的时长） */
  headCount: 5,
  /** 每个周期内亮头占比 */
  headLength: 0.2,
  /** 每个周期内尾占比（接在头后面，往起点一侧） */
  tailLength: 0.3,
  /** 亮头 alpha */
  headAlpha: 1.0,
  /** 底线 / 尾末端 alpha（整路始终可见） */
  otherAlpha: 0.35,
}

let isAircraftPlannedTrajectoryMaterialRegistered = false

export interface AircraftPlannedTrajectoryMaterialOptions {
  image?: string
  color?: Cesium.Color
  durationMs?: number
  headCount?: number
  headLength?: number
  tailLength?: number
  headAlpha?: number
  otherAlpha?: number
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
        tailLength: AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_DEFAULTS.tailLength,
        headAlpha: AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_DEFAULTS.headAlpha,
        otherAlpha: AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_DEFAULTS.otherAlpha,
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
  private readonly tailLength: number
  private readonly headAlpha: number
  private readonly otherAlpha: number
  private readonly phase: number

  constructor(options: AircraftPlannedTrajectoryMaterialOptions = {}) {
    this._image = options.image ?? AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_DEFAULTS.image
    this._color =
      options.color?.clone() ?? AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_DEFAULTS.color.clone()
    this.durationMs = options.durationMs ?? AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_DEFAULTS.durationMs
    this.headCount = options.headCount ?? AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_DEFAULTS.headCount
    this.headLength = options.headLength ?? AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_DEFAULTS.headLength
    this.tailLength = options.tailLength ?? AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_DEFAULTS.tailLength
    this.headAlpha = options.headAlpha ?? AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_DEFAULTS.headAlpha
    this.otherAlpha = options.otherAlpha ?? AIRCRAFT_PLANNED_TRAJECTORY_MATERIAL_DEFAULTS.otherAlpha
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
    materialResult.tailLength = this.tailLength
    materialResult.headAlpha = this.headAlpha
    materialResult.otherAlpha = this.otherAlpha
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
        this.tailLength === other.tailLength &&
        this.headAlpha === other.headAlpha &&
        this.otherAlpha === other.otherAlpha &&
        this.phase === other.phase)
    )
  }
}
