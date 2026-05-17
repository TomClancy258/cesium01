//aircraft-constants.ts
import airplaneBlueSvgRaw from '@/assets/img/airplane/svg/airplane-blue.svg?raw'
import airplaneHoveredSvgRaw from '@/assets/img/airplane/svg/airplane-hovered.svg?raw'
import airplaneSelectedSvgRaw from '@/assets/img/airplane/svg/airplane-selected.svg?raw'
import airplaneSpatialSelectedSvgRaw from '@/assets/img/airplane/svg/airplane-spatial-selected.svg?raw'
import airplaneSatelliteConeScanSvgRaw from '@/assets/img/airplane/svg/airplane-satellite-cone-scan.svg?raw'
import airplaneHighRiskSvgRaw from '@/assets/img/airplane/svg/airplane-high-risk.svg?raw'

// SVG 资源 DataURL
export const airplaneBlueSvgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airplaneBlueSvgRaw)}`
export const airplaneHoveredSvgRawDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airplaneHoveredSvgRaw)}`
export const airplaneSelectedSvgRawDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airplaneSelectedSvgRaw)}`
export const airplaneSpatialSelectedSvgRawDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airplaneSpatialSelectedSvgRaw)}`
export const airplaneSatelliteConeScanSvgRawDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airplaneSatelliteConeScanSvgRaw)}`
export const airplaneHighRiskSvgRawDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airplaneHighRiskSvgRaw)}`

// 高度-颜色映射配置
export const altitudeColorMap = [
  { min: -Infinity, max: 0, color: 'rgba(0, 255, 0, 1)' }, // 0 及以下：绿色
  { min: 0, max: 1000, color: 'rgba(173, 255, 47, 1)' }, // 0-1000：浅绿
  { min: 1000, max: 3000, color: 'rgba(255, 255, 0, 1)' }, // 1000-3000：黄色
  { min: 3000, max: 5000, color: 'rgba(255, 165, 0, 1)' }, // 3000-5000：橙色
  { min: 5000, max: 8000, color: 'rgba(255, 0, 0, 1)' }, // 5000-8000：红色
  { min: 8000, max: 10000, color: 'rgba(128, 0, 128, 1)' }, // 8000-10000：紫色
  { min: 10000, max: Infinity, color: 'rgba(128, 0, 128, 1)' }, // 10000+：紫色
]

// 标签显示距离阈值（米）
// export const AIRCRAFT_LABEL_SHOW_DISTANCE = 2000_000
// export const AIRCRAFT_LABEL_SHOW_DISTANCE = 400_000
export const AIRCRAFT_LABEL_SHOW_DISTANCE = 800_000
// export const AIRCRAFT_LABEL_SHOW_DISTANCE = 250_000
