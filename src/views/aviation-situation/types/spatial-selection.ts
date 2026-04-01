import { LngLatAlt } from '@/views/aviation-situation/types/shared'

export interface SpatialSelectionTableRowBase{
  type:string,
}

export interface SpatialSelectionTableRowDetail extends SpatialSelectionTableRowBase{
  centroidLngLatAlt:LngLatAlt,
}

export interface SpatialSelectionTableRowDelete extends SpatialSelectionTableRowBase{
  sourceType:string,
  dataSourceName:string,
}

export type SpatialSelectionTableRowOperation =SpatialSelectionTableRowDelete|SpatialSelectionTableRowDetail
