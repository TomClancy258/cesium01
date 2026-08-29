import * as Cesium from 'cesium'
import { GROUND_RADAR_SCAN_DEFAULTS } from './ground-radar-scan-material/ground-radar-scan-material'

/** 地面雷达扫描圆默认样式（青色，与卫星雷达同族） */
export const RADAR_DEFAULT_STYLE = {
  color: GROUND_RADAR_SCAN_DEFAULTS.color.clone(),
} as const

export const RADAR_INTERACTION_STYLE = {
  /** 浅青：略亮于默认 CYAN */
  hover: {
    color: Cesium.Color.fromCssColorString('#A5F3FC').withAlpha(0.95),
  },
  /** 深青：明显深于默认 CYAN / hover，与管控区选中同色阶 */
  select: {
    color: Cesium.Color.fromCssColorString('#06B6D4').withAlpha(1),
  },
} as const
