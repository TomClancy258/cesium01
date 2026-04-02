import { LngLatAlt } from '@/views/aviation-situation/types/shared'

export interface SpatialSelectionTableRowBase{
  type:'detail'|'delete',
  sourceType:string,
  dataSourceName:string,
}

export interface SpatialSelectionTableRowDetail extends SpatialSelectionTableRowBase{
  centroidLngLatAlt:LngLatAlt,
}

export type SpatialSelectionTableRowDelete = SpatialSelectionTableRowBase

export type SpatialSelectionTableRowOperation =SpatialSelectionTableRowDelete|SpatialSelectionTableRowDetail

export interface SegmentDistancesState{
  distances: number[]
}

