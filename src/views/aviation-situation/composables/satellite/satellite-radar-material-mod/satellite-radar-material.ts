import * as Cesium from 'cesium'
import satelliteRadarFabricSource from './satellite-radar-material-circle-middle-position.fabric.glsl?raw'

const SATELLITE_RADAR_MATERIAL_TYPE = 'SatelliteRadarPrimitive'
const RADAR_TIME_EPOCH = Cesium.JulianDate.fromDate(new Date(0))

//目标                                    更合适
//多条细雷达环、要控间距/环宽/sweepDurationMs  mod + step
//想要波浪感、霓虹条纹、学习 sin 相位           sin,【step 硬切会有锯齿，可用smoothstep 软边/抗锯齿】

//① registerSatelliteRadarMaterial()     // 全局一次，注册 shader 模板
//          ↓
// ② new SatelliteRadarMaterialProperty() // 每颗卫星一次，只跑 constructor，存参数
//          ↓
// ③ entities.add({ cylinder: { material: ... } })
//          ↓
// ④ 每帧渲染时 Cesium 反复调用：
//       getType()  → 'SatelliteRadarPrimitive'（用哪个 shader）
//       getValue(time) → { color, time, repeat, offset, thickness }
//          ↓
// ⑤ GPU 片元着色器里用这些 uniform 算每个像素颜色

export const SATELLITE_RADAR_DEFAULTS = {
  color: Cesium.Color.CYAN.withAlpha(0.85),
  /** 单圈从锥顶扫到锥底的行程时间（仿真时钟，ms） */
  sweepDurationMs: 100_000,
  repeat: 30, //径向纹理上重复 30 段，不是 30 个独立在动的圈
  offset: 0, //整体相位偏移（环在径向上平移）
  thickness: 0.12, //thickness 越大 → 环越粗,缝越窄，0.5时两者差不多
}

let isSatelliteRadarMaterialRegistered = false

export interface SatelliteRadarMaterialOptions {
  color?: Cesium.Color
  sweepDurationMs?: number
  repeat?: number
  offset?: number
  thickness?: number
  phase?: number
}

export const registerSatelliteRadarMaterial = (): void => {
  if (isSatelliteRadarMaterialRegistered) return

  //是 Cesium Fabric 自定义材质的全局注册方式，不只给 entity.cylinder，也适用于任何用 Material 的地方。

  //凡是用 MaterialProperty / Material 的都可以，例如：
  //
  // Entity：cylinder、ellipse、ellipsoid、polygon、corridor、wall…
  // Primitive：带 material 的几何体
  // 不是 Entity 专属，而是 Material 系统 专属。

  //Primitive（CylinderGeometry + MaterialAppearance）
  //   └─ appearance.material = new Cesium.Material({ fabric })   ✅
  //
  // Entity（cylinder / ellipse / …）
  //   └─ material: new ColorMaterialProperty(...)              ✅
  //   └─ material: new StripeMaterialProperty(...)             ✅
  //   └─ material: new SatelliteRadarMaterialProperty(...)     ✅ 自定义
  //   └─ material: new Cesium.Material(...)                    ❌
  Cesium.Material._materialCache.addMaterial(SATELLITE_RADAR_MATERIAL_TYPE, {
    fabric: {
      type: SATELLITE_RADAR_MATERIAL_TYPE,
      uniforms: {
        color: SATELLITE_RADAR_DEFAULTS.color,
        time: 0,
        repeat: SATELLITE_RADAR_DEFAULTS.repeat,
        sweepDurationMs: SATELLITE_RADAR_DEFAULTS.sweepDurationMs,
        offset: SATELLITE_RADAR_DEFAULTS.offset,
        thickness: SATELLITE_RADAR_DEFAULTS.thickness,
      },
      source: satelliteRadarFabricSource,
    },
    translucent: () => true,
  })

  isSatelliteRadarMaterialRegistered = true
}

//只有用自定义shader才能实现从圆锥顶部到圆底的上下动态圆圈，StripeMaterialProperty只能设置左右的动态光圈
//一百个卫星，就会new 一百个SatelliteRadarMaterialProperty，性能和一百个CallbackProperty差不多
//推荐SatelliteRadarMaterialProperty + onTick（要改类）,性能：onTick 里 N 次 setValue，可 100ms 节流；比每帧 N 次 getValue 更可控
//什么时候再考虑改
// 同时可见卫星 很多（例如 500+），或 profiling 显示材质/CPU 明显吃紧
// 想和 cylinder.length 统一在一个 100ms visual tick 里管
export class SatelliteRadarMaterialProperty {
  private readonly _definitionChanged = new Cesium.Event()
  private readonly _color: Cesium.Color
  private readonly sweepDurationMs: number
  private readonly repeat: number
  private readonly offset: number
  private readonly thickness: number
  private readonly phase: number

  constructor(options: SatelliteRadarMaterialOptions = {}) {
    this._color = options.color?.clone() ?? SATELLITE_RADAR_DEFAULTS.color.clone()
    this.sweepDurationMs = options.sweepDurationMs ?? SATELLITE_RADAR_DEFAULTS.sweepDurationMs
    this.repeat = options.repeat ?? SATELLITE_RADAR_DEFAULTS.repeat
    this.offset = options.offset ?? SATELLITE_RADAR_DEFAULTS.offset
    this.thickness = options.thickness ?? SATELLITE_RADAR_DEFAULTS.thickness
    this.phase = options.phase ?? Math.random()
  }

  //isConstant = false 就是在告诉 Cesium：每帧都要重新算，别缓存。
  get isConstant() {
    return false
  }

  //材质定义变了时通知 entity 刷新
  get definitionChanged() {
    return this._definitionChanged
  }

  // 决定用哪个已注册 shader（SatelliteRadarPrimitive）
  getType() {
    return SATELLITE_RADAR_MATERIAL_TYPE
  }

  //每帧渲染时 Cesium 反复调用：
  //把新的 color/time/repeat/offset/thickness 传给 uniform
  getValue(time: Cesium.JulianDate, result?: Record<string, unknown>) {
    const materialResult = result ?? {}
    const elapsedSeconds = Cesium.JulianDate.secondsDifference(time, RADAR_TIME_EPOCH)
    const elapsedMs = elapsedSeconds * 1000

    const normalizedTime = ((elapsedMs + this.phase * this.sweepDurationMs) % this.sweepDurationMs) / this.sweepDurationMs
    materialResult.color = this._color
    //只有time在随时间变化，真正驱动动画的只有 time，其它 uniform（即这里的其它参数） 是创建时定死的常量。
    materialResult.time = normalizedTime
    materialResult.repeat = this.repeat
    materialResult.offset = this.offset
    materialResult.thickness = this.thickness
    return materialResult
  }

  //比较两个 Property 是否相同，少做无效更新
  equals(other: unknown) {
    return (
      this === other ||
      (other instanceof SatelliteRadarMaterialProperty &&
        Cesium.Color.equals(this._color, other._color) &&
        this.sweepDurationMs === other.sweepDurationMs &&
        this.repeat === other.repeat &&
        this.offset === other.offset &&
        this.thickness === other.thickness &&
        this.phase === other.phase)
    )
  }
}
