import * as Cesium from 'cesium'
import { GROUND_RADAR_SCAN_DEFAULTS } from './ground-radar-scan-material/ground-radar-scan-material'

/** 地面雷达扫描圆默认样式（青色，与卫星雷达同族） */
export const RADAR_DEFAULT_STYLE = {
  color: GROUND_RADAR_SCAN_DEFAULTS.color.clone(),
  highlight: 0,
} as const

export const RADAR_INTERACTION_STYLE = {
  hover: {
    color: Cesium.Color.CYAN.withAlpha(0.95),
    highlight: 1,
  },
  select: {
    color: Cesium.Color.fromCssColorString('#22D3EE').withAlpha(0.98),
    highlight: 1,
  },
} as const
