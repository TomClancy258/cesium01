import type {AircraftBillboardProperties,AircraftLabelProperties,AircraftSelectedData} from "./aircraft"
import type {AirportBillboardProperties,AirportLabelProperties,AirportSelectedData} from "./airport"
import * as Cesium from 'cesium'
import * as turf from '@turf/turf'

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

export type AviationSelectedData = AircraftSelectedData | AirportSelectedData | null

export interface LngLatAlt {
  longitude: number
  latitude: number
  height: number
}

export interface MeasurementSelectedData {
  id:string,
  type:string,
  sourceType:string,
  operationType:string,
  dataSourceName:string
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

// 定义公共字段
interface BaseSpatialSelectionData {
  dataSourceName: string;
  isActive: boolean;
  sourceType: 'polygonSpatialSelection'|'circleSpatialSelection';
}

// Circle 类型
export interface CircleSpatialSelectionData extends BaseSpatialSelectionData {
  type: 'circle';
  radius: number;
  centerLngLatAltArray: number[];
}

// Polygon 类型
export interface PolygonSpatialSelectionData extends BaseSpatialSelectionData {
  type: 'polygon';
  graphic: Graphic; // 假设 Graphic 已定义
}

// 联合类型
export type SpatialSelectionData =
  | CircleSpatialSelectionData
  | PolygonSpatialSelectionData;

// 通用 RenderItem（用泛型）
export interface AviationRenderItem<T> {
  data: T
  billboard: Cesium.Billboard
  label: Cesium.Label
}

// 统一 SelectionRegion（使用 genericIdSet）
export interface SelectionRegion {
  type: string
  graphic?: Graphic
  radius: number
  sourceType: 'polygonSpatialSelection'|'circleSpatialSelection';
  centerLngLatAltArray: number[]
  idSet: Set<string> // ✅ 统一叫 idSet，不再区分 icao / icao24
}

export interface SpatialSelectionActive {
  type: string
  dataSourceName: string
  graphic: Graphic
  idSet: Set<string> // ✅ 同上
}

export interface SpatialSelection {
  finishedGraphicMap: Map<string, SelectionRegion>
  active: SpatialSelectionActive
}


export interface AviationPrimitivesBase {
  billboards: Cesium.BillboardCollection | null;
  labels: Cesium.LabelCollection | null;
}

export interface AviationGraphicBase<T extends AviationPrimitivesBase = AviationPrimitivesBase> {
  primitiveContainer: Cesium.PrimitiveCollection | null;
  primitives: T;
}

export interface MeasurementEntitiesResult {
  measurementEntities: Cesium.Entity[];
  highlightEntity: Cesium.Entity | null;
}
