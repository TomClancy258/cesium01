import type {
  AviationGraphicBase,
  AviationPrimitivesBase,
  ClearAviationSpatialSelectionDataBase,
  TooltipState
} from './shared'
import * as Cesium from "cesium"
import type { SpatialSelectionAircraft } from '@/views/aviation-situation/types/draw-tools'

/** tooltip / UI 用业务快照（不挂在 billboard.properties 上） */
export interface AirportBaseProperties{
  type: 'label' | 'billboard'
  sourceType: 'airport'
  icao: string
  country: string
  name: string
  lngLatAlt:{
    longitude: number
    latitude: number
    elevation: number
  }
}

/** Billboard 图元属性：拾取身份 + 纯渲染态 */
export interface AirportBillboardProperties {
  type: 'billboard'
  sourceType: 'airport'
  icao: string
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

/** Label 图元属性：拾取身份 + 渲染态 */
export interface AirportLabelProperties {
  type: 'label'
  sourceType: 'airport'
  icao: string
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
}


// 机场图元 = 纯基础图元（无扩展）
export type AirportPrimitives = AviationPrimitivesBase;

export type AirportGraphic = AviationGraphicBase<AirportPrimitives>;

export type ClearActiveAirportSpatialSelectionData=ClearAviationSpatialSelectionDataBase
export interface ClearFinishedAirportSpatialSelectionData extends ClearAviationSpatialSelectionDataBase{
  airport:SpatialSelectionAircraft,
  dataSourceName:string
}
export type ClearAirportSpatialSelectionData =ClearActiveAirportSpatialSelectionData|ClearFinishedAirportSpatialSelectionData|undefined
