import type {AircraftBillboardProperties,AircraftLabelProperties,AircraftSelectedData} from "./aircraft"
import type {AirportBillboardProperties,AirportLabelProperties,AirportSelectedData} from "./airport"
import type { Aircraft } from '@/network/aircraft/types/aircraft'
import type { Airport } from '@/network/airport/type'
import * as Cesium from 'cesium'
import * as turf from '@turf/turf'
import type { SatelliteSelectedData } from '@/views/aviation-situation/types/satellite'
import type { OSMBuildingSelectedProperties } from '@/views/aviation-situation/types/osm-building'
import type { PhotogrammetryBuildingSelectedProperties } from '@/views/aviation-situation/types/photogrammetry'

export type LngLatAltArray=[number,number,number]

interface TooltipPosition {
  left: number
  top: number
}

export interface TooltipState<T> {
  visible: boolean
  position: TooltipPosition
  properties: T
}

export type MapBillboardLabelProperties =
  | AircraftBillboardProperties
  | AircraftLabelProperties
  | AirportBillboardProperties
  | AirportLabelProperties;

export type AviationSelectedData =
  | AircraftSelectedData
  | AirportSelectedData
  | SatelliteSelectedData
  | OSMBuildingSelectedProperties
  | PhotogrammetryBuildingSelectedProperties
  | null

export type AviationHoveredScreenPosition = {
  left: number
  top: number
}

export interface LngLatAlt {
  longitude: number
  latitude: number
  height: number
}

export interface DrawingToolSelectedData {
  id:string,
  type:string,
  sourceType:string,
  operationType:string,
  dataSourceName:string,
  isDraft:boolean,
}

export interface DynamicPolylineState {
  lngLatAltArray: number[]; // 经纬度+海拔数组（3个一组）
  pointCount: number; // 坐标点数量（一组算一个）
  positions:Cesium.Cartesian3[]
}

export interface DrawingDataSource{
  name:string|null
}

export type Graphic = turf.Feature<turf.Polygon> | turf.Feature<turf.Point>

export interface SegmentResult {
  startLngLatAlt: LngLatAlt
  endLngLatAlt: LngLatAlt
  midLngLatAlt: LngLatAlt
  distance: number
}

// === Spatial selection label sub-types ===
export interface SpatialSelectionPerimeterInfo {
  perimeter: number
  formattedPerimeterStr: string
}

export interface SpatialSelectionAreaInfo {
  area: number
  formattedAreaStr: string
}

export interface SpatialSelectionRadiusInfo {
  radius: number
  formattedRadiusStr: string
}

// === Active (in-progress) spatial selection states ===
export interface ActivePolygonSpatialSelectionData {
  dataSourceName: string
  type: 'polygon'
  sourceType: 'polygonSpatialSelection'
  graphic: Graphic
  isActive: true
}

export interface ActiveCircleSpatialSelectionData {
  dataSourceName: string
  type: 'ellipse'
  sourceType: 'circleSpatialSelection'
  centerLngLatAltArray: number[]
  label: { radiusInfo: { radius: number } }
  isActive: true
}

export interface ActiveHemisphereSpatialSelectionData {
  dataSourceName: string
  type: 'ellipsoid'
  sourceType: 'hemisphereSpatialSelection'
  centerLngLatAltArray: number[]
  label: { radiusInfo: { radius: number } }
  isActive: true
}

// === Finished spatial selection states ===
// 基类：所有已完成选区的公共字段
interface FinishedSpatialSelectionBase {
  dataSourceName: string
  isActive: false
  isDraft: boolean
  centroidLngLatAlt: LngLatAlt
  spatialSelectionTarget: string
  aircraft: { aircraftMap: Map<string, Aircraft> }
  airport: { airportMap: Map<string, Airport> }
}

export interface FinishedPolygonSpatialSelectionData extends FinishedSpatialSelectionBase {
  type: 'polygon'
  sourceType: 'polygonSpatialSelection'
  graphic: Graphic
  label: {
    perimeterInfo: SpatialSelectionPerimeterInfo
    areaInfo: SpatialSelectionAreaInfo
  }
  polygonState: { lngLatAltList: LngLatAlt[] }
  segments: SegmentResult[]
}

export interface FinishedCircleSpatialSelectionData extends FinishedSpatialSelectionBase {
  type: 'ellipse'
  sourceType: 'circleSpatialSelection'
  centerLngLatAltArray: LngLatAltArray
  label: {
    perimeterInfo: SpatialSelectionPerimeterInfo
    areaInfo: SpatialSelectionAreaInfo
    radiusInfo: SpatialSelectionRadiusInfo
  }
}

export interface FinishedHemisphereSpatialSelectionData extends FinishedSpatialSelectionBase {
  type: 'ellipsoid'
  sourceType: 'hemisphereSpatialSelection'
  centerLngLatAltArray: LngLatAltArray
  label: {
    perimeterInfo: SpatialSelectionPerimeterInfo
    areaInfo: SpatialSelectionAreaInfo
    radiusInfo: SpatialSelectionRadiusInfo
  }
}

export type FinishedSpatialSelectionData =
  | FinishedPolygonSpatialSelectionData
  | FinishedCircleSpatialSelectionData
  | FinishedHemisphereSpatialSelectionData

export type SpatialSelectionData =
  | ActivePolygonSpatialSelectionData
  | ActiveCircleSpatialSelectionData
  | ActiveHemisphereSpatialSelectionData
  | FinishedSpatialSelectionData

export interface AviationAssociationSets {
  dataSourceName: Set<string>
  coneScanSatelliteId: Set<string>
  controlZoneId?: Set<string> // aircraft only
  radarId?: Set<string> // aircraft only
}

// 通用 RenderItem（用泛型）
export interface AviationRenderItem<T> {
  data: T
  billboard: Cesium.Billboard
  label?: Cesium.Label
  sets?: AviationAssociationSets
}


export interface AviationPrimitivesBase {
  billboards: Cesium.BillboardCollection | null;
  labels: Cesium.LabelCollection | null;
}

export interface AviationGraphicBase<T extends AviationPrimitivesBase = AviationPrimitivesBase> {
  primitiveContainer: Cesium.PrimitiveCollection | null;
  primitives: T;
}

export interface DrawingToolEntitiesResult {
  measurementEntities: Cesium.Entity[];
  highlightEntity: Cesium.Entity | null;
}


export interface SelectionRegionBase {
  dataSourceName: string
  type: string
  sourceType: string
  graphic?: Graphic
  /** polygon 选区创建时预计算的包围盒，供点-in-选区预筛 */
  bbox?: turf.BBox
  centroidLngLatAlt?: LngLatAlt
  centerLngLatAltArray?: number[]
  aircraft: { aircraftMap: Map<string, Aircraft> }
  airport: { airportMap: Map<string, Airport> }
  spatialSelectionTarget: string
  label: {
    perimeterInfo?: SpatialSelectionPerimeterInfo
    areaInfo?: SpatialSelectionAreaInfo
    radiusInfo?: SpatialSelectionRadiusInfo
  }
  polygonState?: { lngLatAltList?: LngLatAlt[] }
  segments?: SegmentResult[]
}

export interface ClearAviationSpatialSelectionDataBase {
  isActive:boolean
}

export type ClearAviationSpatialSelectionData = ClearAviationSpatialSelectionDataBase
