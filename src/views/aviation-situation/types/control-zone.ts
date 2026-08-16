import type * as Cesium from 'cesium'
import type {
  ControlZoneLevel,
  ControlZoneRawProperties,
} from '@/network/control-zone/type'
import type { Aircraft } from '@/network/aircraft/types/aircraft'
import type { BBox } from 'geojson'
import type { Graphic } from '@/views/aviation-situation/types/shared'

export interface ControlZoneFilterForm {
  id: string
  name: string
  levels: ControlZoneLevel[]
  visible: boolean
}

/** 档案：原始属性 + 空间几何（RenderMap.data；不含扫描命中等业务态） */
export interface ControlZoneTable extends ControlZoneRawProperties {
  bbox: BBox
  graphic: Graphic
}

/** 列表/业务行：档案 + 进入该区的飞机（与 RenderMap 纯档案分离） */
export type MatchedControlZone = {
  controlZone: ControlZoneTable
  aircraft: { aircraftMap: Map<string, Aircraft> }
}

export function createMatchedControlZone(controlZone: ControlZoneTable): MatchedControlZone {
  return {
    controlZone,
    aircraft: { aircraftMap: new Map() },
  }
}

export type ControlZoneLevelFilterValue = 'warning' | 'danger' | 'info' | 'normal'

export interface ControlZoneLevelFilterOption {
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

export interface ControlZoneTableRowOperation {
  operationType: 'detail'
  id: string
}
