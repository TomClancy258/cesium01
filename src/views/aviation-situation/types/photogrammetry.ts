import type { LngLatAlt } from '@/views/aviation-situation/types/shared'

/** 倾斜摄影 tileset 拾取（仅坐标）——保留兼容 */
export interface PhotogrammetryHoveredProperties {
  sourceType: 'photogrammetry'
  lngLatAlt: LngLatAlt
}

export type PhotogrammetrySelectedProperties = PhotogrammetryHoveredProperties

/** ClassificationPrimitive 旁路 Map 存的业务属性（registry 真相） */
export interface PhotogrammetryBuildingInstanceProperties {
  sourceType: 'photogrammetryBuilding'
  id: string
  name: string
  /** Classification 挤出底（米） */
  minHeight: number
  /** Classification 挤出顶（米） */
  height: number
  /** 业务楼高（米），tooltip 优先展示 */
  buildingHeight?: number
  city?: 'Boston' | 'Melbourne' | 'SanFrancisco'
  landUse?: string
  roofType?: string
}

/** selection / hovered：只存身份，业务数据查 registry */
export interface PhotogrammetryBuildingSelectedProperties {
  sourceType: 'photogrammetryBuilding'
  id: string
}

/** tooltip 展示用：与 registry 条目同形 */
export type PhotogrammetryBuildingHoveredProperties = PhotogrammetryBuildingInstanceProperties

export type PhotogrammetryTypeFilterValue =
  | 'retail'
  | 'commercial'
  | 'yes'
  | 'industrial'
  | 'apartments'
  | 'residential'
  | 'office'
  | 'parking'
  | 'others'

export interface PhotogrammetryFilterForm {
  id: number
  name: string
  visible: boolean
}

export interface MatchedPhotogrammetry {
  id: number
  name: string
}

export interface PhotogrammetryTableRowOperation {
  operationType: 'detail'
  id: number
}
