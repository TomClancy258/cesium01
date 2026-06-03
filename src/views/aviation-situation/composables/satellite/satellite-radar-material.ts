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

  ;(Cesium.Material as any)._materialCache.addMaterial(SATELLITE_RADAR_MATERIAL_TYPE, {
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

        czm_material czm_getMaterial(czm_materialInput materialInput) {
          czm_material material = czm_getDefaultMaterial(materialInput);
          vec2 st = materialInput.st;
          float spacing = 1.0 / repeat;
          float radial = distance(st, vec2(0.5));
          float m = mod(radial + offset - time, spacing);
          float alpha = step(spacing * (1.0 - thickness), m);
          material.diffuse = color.rgb;
          material.alpha = alpha * color.a;
          return material;
        }
      `,
    },
    translucent: () => true,
  })

  isSatelliteRadarMaterialRegistered = true
}

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
    const elapsedMs = elapsedSeconds * 1000
    const normalizedTime = ((elapsedMs + this.phase * this.durationMs) % this.durationMs) / this.durationMs / 10
    materialResult.color = this._color
    materialResult.time = normalizedTime
    materialResult.repeat = this.repeat
    materialResult.offset = this.offset
    materialResult.thickness = this.thickness
    return materialResult
  }

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
