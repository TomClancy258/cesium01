/** 电子围栏告警级别 */
export type WallLevel = 'normal' | 'warning' | 'danger'

/** 电子围栏视觉样式 */
export type WallVisualStyle = 'layeredRing' | 'arrowWall'

/** 围栏多边形顶点：[经度, 纬度]，首尾闭合 */
export type WallPosition = [number, number]

export interface RawWall {
  id: string
  name: string
  positions: WallPosition[]
  minAltitude: number
  maxAltitude: number
  visualStyle: WallVisualStyle
  country: string
  level: WallLevel
}

export interface Wall extends RawWall {}
