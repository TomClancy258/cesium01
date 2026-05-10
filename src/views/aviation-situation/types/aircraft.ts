import type {TooltipState,AviationPrimitivesBase,AviationGraphicBase,ClearAviationSpatialSelectionDataBase} from './shared'
import type {Aircraft} from "@/network/aircraft/types/aircraft"
import * as Cesium from "cesium"
import type {SpatialSelectionAircraft} from "./draw-tools"

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
  dataSourceNameSet:Set<string>
}

// Billboard 专用属性
export interface AircraftBillboardProperties extends AircraftBaseProperties {
  type: 'billboard'
  originalColor: Cesium.Color
  originalImage: string | undefined
}

// Label 专用属性
export interface AircraftLabelProperties extends AircraftBaseProperties {
  type: 'label'
  originalFillColor: Cesium.Color
}

export type AircraftTooltipState = TooltipState<AircraftBaseProperties>

// 定义筛选表单类型（包含visible）
export interface AircraftFilterForm {
  icao24: string
  originCountry: string
  originCountries: string[]
  callsign: string
  startAirport: string
  endAirport: string
  visible: boolean // 飞机显示状态
}

export interface TrajectoryGroup {
  trajectoryVisible: boolean   // 轨迹线
  waypointsVisible: boolean    // 航路点
}

export interface AircraftTrajectoryOptions {
  planned: TrajectoryGroup     // 计划类
}

export interface AircraftSelectedData {
  sourceType: 'aircraft';
  icao24: string;
  originCountry: string;
  callsign: string;
  heading: number;
  lngLatAlt:{
    latitude: number,
    longitude: number,
    baroAltitude: number
  },
  // screenPosition:Cesium.Cartesian2
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
