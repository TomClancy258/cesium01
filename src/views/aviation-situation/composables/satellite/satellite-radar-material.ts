import * as Cesium from 'cesium'

const SATELLITE_RADAR_MATERIAL_TYPE = 'SatelliteRadarPrimitive'
const RADAR_TIME_EPOCH = Cesium.JulianDate.fromDate(new Date(0))

export const SATELLITE_RADAR_DEFAULTS = {
  color: Cesium.Color.CYAN.withAlpha(0.85),
  durationMs: 2200,
  repeat: 30,
  offset: 0,
  thickness: 0.12,
}

let isSatelliteRadarMaterialRegistered = false

export interface SatelliteRadarMaterialOptions {
  color?: Cesium.Color
  durationMs?: number
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
  Cesium.Material._materialCache.addMaterial(SATELLITE_RADAR_MATERIAL_TYPE, {
    fabric: {
      type: SATELLITE_RADAR_MATERIAL_TYPE,
      uniforms: {
        color: SATELLITE_RADAR_DEFAULTS.color,
        time: 0,
        repeat: SATELLITE_RADAR_DEFAULTS.repeat,
        offset: SATELLITE_RADAR_DEFAULTS.offset,
        thickness: SATELLITE_RADAR_DEFAULTS.thickness,
      },
      source: `
        uniform vec4 color;
        uniform float time;
        uniform float repeat;
        uniform float offset;
        uniform float thickness;

        //Cesium 每个片元调用一次
        // materialInput：该片元的 st、法线等
        // 返回 czm_material 给 Cesium 做光照/混合
        czm_material czm_getMaterial(czm_materialInput materialInput) {
          //material保存可用于照明的材质信息。由所有 czm_getMaterial 函数返回。
          //拿默认材质（含默认 diffuse/alpha/specular 等），后面只改需要的字段。
          czm_material material = czm_getDefaultMaterial(materialInput);

          //纹理坐标，st.s、st.t轴的范围是[0,1]
          //该片元对应的st坐标，比如st.s为.1，st.t为.4
          vec2 st = materialInput.st;

          //spacing环间距
          //repeat = 30 → spacing ≈ 0.033
          // 在径向 [0,1] 上大约分 repeat 段
          float spacing = 1.0 / repeat;

          //radial:到 ST 中心的距离
          //算片元 st 到 (0.5, 0.5) 的欧氏距离
          // 同一距离 → 同一“圈”（在 ST 里是同心圆，贴到锥面上是弯带）
          float radial = distance(st, vec2(0.5));

          // m:相位 + 动画
          //部分                  作用
          // radial              在哪一圈
          // offset              整体相位
          // - time              随时间减小 → 环在动
          // mod(..., spacing)   折回到 [0, spacing)，形成周期重复
          float m = mod(radial + offset - time, spacing);

          //alpha:环的明暗/透明
          //step(edge, x)：x >= edge 为 1，否则为 0。
          //
          //  （1）spacing * (1.0 - thickness)：每条环里“透明段”的上界
          //  （2）thickness 大 → 不透明环更宽
          //  （3）thickness 小 → 环更细、透明缝更多
          //示意（一个周期内）：
          // m:     0 --------|████████|-------- spacing
          //                  ↑ 透明    ↑ 不透明环
          //            step 阈值 = spacing*(1-thickness)
          float alpha = step(spacing * (1.0 - thickness), m);

          //写回材质
          material.diffuse = color.rgb; // 不透明部分用这个颜色，【RGB】
          material.alpha = alpha * color.a;  // 透明缝 alpha≈0，环上 alpha≈color.a，【环可见、缝透明 → 雷达扫描环效果】
          return material;
        }
      `,
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
  private readonly durationMs: number
  private readonly repeat: number
  private readonly offset: number
  private readonly thickness: number
  private readonly phase: number

  constructor(options: SatelliteRadarMaterialOptions = {}) {
    this._color = options.color?.clone() ?? SATELLITE_RADAR_DEFAULTS.color.clone()
    this.durationMs = options.durationMs ?? SATELLITE_RADAR_DEFAULTS.durationMs
    this.repeat = options.repeat ?? SATELLITE_RADAR_DEFAULTS.repeat
    this.offset = options.offset ?? SATELLITE_RADAR_DEFAULTS.offset
    this.thickness = options.thickness ?? SATELLITE_RADAR_DEFAULTS.thickness
    this.phase = options.phase ?? Math.random()
  }

  //false → 随时间变，要持续重算材质
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

  //把 color/time/repeat/offset/thickness 传给 uniform
  getValue(time: Cesium.JulianDate, result?: Record<string, unknown>) {
    const materialResult = result ?? {}
    const elapsedSeconds = Cesium.JulianDate.secondsDifference(time, RADAR_TIME_EPOCH)
    const elapsedMs = elapsedSeconds * 1000
    const normalizedTime = ((elapsedMs + this.phase * this.durationMs) % this.durationMs) / this.durationMs / 10
    materialResult.color = this._color
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
        this.durationMs === other.durationMs &&
        this.repeat === other.repeat &&
        this.offset === other.offset &&
        this.thickness === other.thickness &&
        this.phase === other.phase)
    )
  }
}
