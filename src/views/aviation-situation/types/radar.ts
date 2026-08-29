import type { Radar } from '@/network/radar/type'
import type { Aircraft } from '@/network/aircraft/types/aircraft'

/** 探测能力筛选：全部 / 是 / 否（对标机场风险等级单选，而非管控等级多选） */
export type RadarDetectAircraftFilter = 'all' | 'yes' | 'no'

export interface RadarFilterForm {
  id: string
  name: string
  countries: string[]
  detectAircraft: RadarDetectAircraftFilter
  visible: boolean
}

export interface RadarTable extends Radar {}

export type MatchedRadar = {
  radar: RadarTable
  aircraft: { aircraftMap: Map<string, Aircraft> }
}

export function createMatchedRadar(radar: RadarTable): MatchedRadar {
  return {
    radar,
    aircraft: { aircraftMap: new Map() },
  }
}

export type RadarHoveredProperties = Radar & {
  aircraftCount: number
}

export interface RadarHighlightStyle {
  color: import('cesium').Color
  highlight: number
}

/** GeometryInstance.id / pick 身份 */
export type RadarPickId = {
  sourceType: 'radar'
  id: string
}

export interface RadarTableRowOperation {
  operationType: 'detail'
  id: string
}
