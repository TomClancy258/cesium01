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
  types: PhotogrammetryTypeFilterValue[]
  colorByType: boolean
  colorByDistance: boolean
}
