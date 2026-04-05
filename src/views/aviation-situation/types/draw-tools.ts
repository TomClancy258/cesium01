import { LngLatAlt } from '@/views/aviation-situation/types/shared'

export interface SpatialSelectionAircraft{
  icao24Set:Set<string>
}
export interface SpatialSelectionAirport{
  icaoSet:Set<string>
}

export interface SpatialSelectionTableRowBase{
  operationType:'detail'|'delete',
  sourceType:string,
  dataSourceName:string,
  aircraft:SpatialSelectionAircraft,
  airport:SpatialSelectionAirport,
}

export interface SpatialSelectionTableRowDetail extends SpatialSelectionTableRowBase{
  centroidLngLatAlt:LngLatAlt,
}

export type SpatialSelectionTableRowDelete = SpatialSelectionTableRowBase

export type SpatialSelectionTableRowOperation =SpatialSelectionTableRowDelete|SpatialSelectionTableRowDetail

export interface Segment{
  distance:number,
  midLngLatAlt:LngLatAlt,
}

export interface SegmentDistancesState{
  segments: Segment[]
}

