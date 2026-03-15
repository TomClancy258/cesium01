import type {TooltipState} from './shared'
import * as Cesium from "cesium"

export interface AircraftBaseProperties {
  type: 'label' | 'billboard'
  sourceType: 'aircraft'
  icao24: string
  originCountry: string
  callsign: string
  longitude: number
  latitude: number
  baroAltitude: number
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
  position:{
    latitude: number,
    longitude: number,
    baroAltitude: number
  }
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

// 2. 抽离所有飞机的图元集合（核心：独立Interface）
export interface AircraftPrimitives {
  billboards: Cesium.BillboardCollection | null; // 全部飞机的图标（广告牌）
  billboardMap: Map<string, Cesium.Billboard>; // 飞机ID → 对应图标（快速查找）
  labelMap: Map<string, Cesium.Label>; // 飞机ID → 对应标签（快速查找）
  labels: Cesium.LabelCollection | null; // 全部飞机的标签
  selectedAircraft: SelectedAircraft; // 选中飞机的专属航线/航路点
}

// 3. 顶层飞机图元容器
export interface AircraftGraphic {
  primitiveContainer: Cesium.PrimitiveCollection | null; // 所有飞机图元的根容器
  primitives: AircraftPrimitives; // 关联抽离后的图元接口
}
