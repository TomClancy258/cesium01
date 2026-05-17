import type {
  AviationGraphicBase,
  AviationPrimitivesBase,
  ClearAviationSpatialSelectionDataBase,
  TooltipState
} from './shared'
import * as Cesium from "cesium"
import type { SpatialSelectionAircraft } from '@/views/aviation-situation/types/draw-tools'

export interface AirportBaseProperties{
  type: 'label' | 'billboard'
  sourceType: 'airport'
  icao: string // icao 代码
  country: string
  name: string
  lngLatAlt:{
    longitude: number // 数字类型，不是字符串
    latitude: number // 数字类型，不是字符串
    elevation: number // 数字类型，不是字符串
  }
}

// Billboard 专用属性
export interface AirportBillboardProperties extends AirportBaseProperties {
  type: 'billboard'
  originalColor: Cesium.Color
  riskLevel: 'high'|'medium'|'normal'
  images: {
    original: string | undefined
    satelliteConeScan: string | null
    spatialSelection: string | null
  }
  sets: {
    dataSourceName: Set<string>
    coneScanSatelliteId: Set<string>
  }
}

// Label 专用属性
export interface AirportLabelProperties extends AirportBaseProperties {
  type: 'label'
  originalFillColor: Cesium.Color
}

export type AirportTooltipState = TooltipState<AirportBaseProperties>

export type AirportRiskLevel = 'high' | 'medium' | 'normal'
export type AirportRiskLevelFilter = AirportRiskLevel | 'all'

export interface AirportFilterForm {
  icao: '',
  // country: '',
  countries: string[],
  name: '',
  riskLevel: AirportRiskLevelFilter
  visible: boolean
  labelVisible: boolean
  alwaysVisible: boolean
}

export interface AirportSelectedData {
  sourceType: 'airport';
  icao: string;
  country: string;
  lngLatAlt:{
    longitude: number;
    latitude: number;
    elevation: number;
  };
  name: string,
  // screenPosition:Cesium.Cartesian2
}


// 机场图元 = 纯基础图元（无扩展）
// export interface AirportPrimitives extends AviationPrimitivesBase {}
export type AirportPrimitives = AviationPrimitivesBase;

// 机场图元容器 = 通用容器 + 机场图元
// export interface AirportGraphic extends AviationGraphicBase<AirportPrimitives> {}
export type AirportGraphic = AviationGraphicBase<AirportPrimitives>;

export type ClearActiveAirportSpatialSelectionData=ClearAviationSpatialSelectionDataBase
export interface ClearFinishedAirportSpatialSelectionData extends ClearAviationSpatialSelectionDataBase{
  airport:SpatialSelectionAircraft,
  dataSourceName:string
}
export type ClearAirportSpatialSelectionData =ClearActiveAirportSpatialSelectionData|ClearFinishedAirportSpatialSelectionData|undefined
