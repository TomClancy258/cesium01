import type * as Cesium from 'cesium'
import type {
  ControlZoneLevel,
  ControlZoneRawProperties,
} from '@/network/control-zone/type'
import type { Aircraft } from '@/network/aircraft/types/aircraft'
import type { BBox } from 'geojson'
import type { Graphic } from '@/views/aviation-situation/types/shared'

export interface ControlZoneFilterForm{
  id:string,
  name:string,
  levels:ControlZoneLevel[],
  visible:boolean
}

export type MatchedControlZone = ControlZoneTable & {
  aircraft: { aircraftMap: Map<string, Aircraft> }
}

export type ControlZoneLevelFilterValue= 'warning'|'danger'|'info'|'normal'

export interface ControlZoneLevelFilterOption{
  label: '警戒' | '危险' | '提示' | '正常'
  value: ControlZoneLevelFilterValue
}

export type ControlZoneHoveredProperties = ControlZoneRawProperties
export type ControlZoneSelectedProperties = ControlZoneRawProperties

export interface ControlZoneHighlightConfig {
  polygon: {
    outlineColor: Cesium.Color
  }
}

export interface ControlZoneTable extends ControlZoneRawProperties {
  bbox: BBox
  graphic: Graphic
}

export interface ControlZoneTableRowOperation{
  operationType:'detail',
  id:string
}
