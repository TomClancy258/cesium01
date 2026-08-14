import type {TooltipState,AviationPrimitivesBase,AviationGraphicBase,ClearAviationSpatialSelectionDataBase} from './shared'
import type {Aircraft} from "@/network/aircraft/types/aircraft"
import * as Cesium from "cesium"
import type {SpatialSelectionAircraft} from "./draw-tools"

/** tooltip / UI 用业务快照（不挂在 billboard.properties 上） */
export interface AircraftBaseProperties {
  type: 'label' | 'billboard'
  sourceType: 'aircraft'
  icao24: string
  originCountry: string
  callsign: string
  lngLatAlt:{
    longitude: number
    latitude: number
    baroAltitude: number
  },
  heading: number,
}

/** Billboard 图元属性：拾取身份 + 纯渲染态 */
export interface AircraftBillboardProperties {
  type: 'billboard'
  sourceType: 'aircraft'
  icao24: string
  images: {
    original: string | undefined
    satelliteConeScan: string | null
    spatialSelection: string | null
    controlZone: string | null
  }
}

/** Label 图元属性：拾取身份 + 渲染态 */
export interface AircraftLabelProperties {
  type: 'label'
  sourceType: 'aircraft'
  icao24: string
  originalFillColor: Cesium.Color
}

export type AircraftTooltipState = TooltipState<AircraftBaseProperties>

export type AircraftRiskLevel = 'high' | 'medium' | 'normal'
export type AircraftRiskLevelFilter = AircraftRiskLevel | 'all'

// 定义筛选表单类型（包含visible）
export interface AircraftFilterForm {
  icao24: string
  originCountry: string
  originCountries: string[]
  callsign: string
  startAirport: string
  endAirport: string
  riskLevel: AircraftRiskLevelFilter
  visible: boolean
  labelVisible: boolean
}

export interface TrajectoryGroup {
  trajectoryVisible: boolean   // 轨迹线
  waypointsVisible: boolean    // 航路点
}

export interface AircraftTrajectoryOptions {
  planned: TrajectoryGroup     // 计划类
}

/** selection / hovered：只存身份，业务数据查 matchedAircraftMap */
export interface AircraftSelectedData {
  sourceType: 'aircraft'
  icao24: string
}


//0
export interface SelectedAircraftPlanned {
  trajectoryPolylineEntity: Cesium.Entity | null; // 计划航线（若用Entity实现）
  waypoints: Cesium.PointPrimitiveCollection | null; // 计划航路点
}


// 1. 选中飞机的专属资源（航线/航路点）
export interface SelectedAircraft {
  routePolylines: Cesium.PolylinePrimitive | null; // 选中飞机的实时航线（折线）
  planned:SelectedAircraftPlanned
}


// 飞机图元 = 基础图元 + 选中飞机的专属属性
export interface AircraftPrimitives extends AviationPrimitivesBase {
  selectedAircraft: SelectedAircraft; // 飞机独有的扩展属性
}

// 飞机图元容器 = 通用容器 + 飞机图元
// export interface AircraftGraphic extends AviationGraphicBase<AircraftPrimitives> {}
export type AircraftGraphic = AviationGraphicBase<AircraftPrimitives>;

export interface AircraftsSyncData {
  data: Aircraft[],
  status: 'ok' | 'empty' | 'error'
}

export type ClearActiveAircraftSpatialSelectionData=ClearAviationSpatialSelectionDataBase
export interface ClearFinishedAircraftSpatialSelectionData extends ClearAviationSpatialSelectionDataBase{
  aircraft:SpatialSelectionAircraft,
  dataSourceName:string
}
export type ClearAircraftSpatialSelectionData =ClearActiveAircraftSpatialSelectionData|ClearFinishedAircraftSpatialSelectionData|undefined
