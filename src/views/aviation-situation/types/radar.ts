import type { Radar } from '@/network/radar/type'
import type { Aircraft } from '@/network/aircraft/types/aircraft'

export interface RadarFilterForm {
  id: string
  countries: string[]
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
  fillColor: import('cesium').Color
  outlineColor: import('cesium').Color
}

export interface RadarTableRowOperation {
  operationType: 'detail'
  id: string
}
