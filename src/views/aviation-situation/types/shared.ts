import type {AircraftBillboardProperties,AircraftLabelProperties,AircraftSelectedData} from "./aircraft"
import type {AirportBillboardProperties,AirportLabelProperties,AirportSelectedData} from "./airport"
import Cesium from 'cesium'

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
