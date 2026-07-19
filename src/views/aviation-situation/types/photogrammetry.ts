import type { LngLatAlt } from '@/views/aviation-situation/types/shared'

export interface PhotogrammetryHoveredProperties {
  sourceType: 'photogrammetry'
  lngLatAlt: LngLatAlt
}

export type PhotogrammetrySelectedProperties = PhotogrammetryHoveredProperties

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
