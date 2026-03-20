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

export interface SpatialSelectionData{
  dataSourceName:string,
  type:string,
  graphic?:Graphic,
  isActive: boolean,
  radius?:number,
  centerLngLatAltArray?:number[],
}

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
