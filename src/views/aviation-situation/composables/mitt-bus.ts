// src/views/aviation-situation/composables/mitt-bus.ts
import mitt from 'mitt';
import type {
  AircraftBillboardProperties,
  ClearAircraftSpatialSelectionData
} from '@/views/aviation-situation/types/aircraft'
import type { AirportBillboardProperties, ClearAirportSpatialSelectionData } from "@/views/aviation-situation/types/airport"
import type {  SpatialSelectionData, LngLatAlt } from '@/views/aviation-situation/types/shared'
import type {
  SpatialSelectionTableRowOperation
} from '@/views/aviation-situation/types/draw-tools'
import Cesium from 'cesium'
import type { SatelliteProperties } from '@/views/aviation-situation/types/satellite'
import type {
  OSMBuildingHoveredProperties,
  OSMBuildingSelectedProperties,
} from '@/views/aviation-situation/types/osm-building'
import type { PhotogrammetryHoveredProperties, PhotogrammetryBuildingHoveredProperties, PhotogrammetryBuildingSelectedProperties, PhotogrammetryTableRowOperation } from '@/views/aviation-situation/types/photogrammetry'
import type {
  ControlZoneTableRowOperation,
} from '@/views/aviation-situation/types/control-zone'
import type { ControlZoneProperties } from '@/network/control-zone/type'

export type CesiumMouseEventName =
  | 'aircraftHover'
  | 'aircraftLeave'
  | 'aircraftLeftClick'

  | 'airportHover'
  | 'airportLeave'
  | 'airportLeftClick'

  | 'satelliteHover'
  | 'satelliteLeave'
  | 'satelliteLeftClick'

  | 'osmBuildingHover'
  | 'osmBuildingLeave'
  | 'osmBuildingLeftClick'

  | 'photogrammetryHover'
  | 'photogrammetryLeave'

  | 'photogrammetryBuildingHover'
  | 'photogrammetryBuildingLeave'
  | 'photogrammetryBuildingLeftClick'

  | 'controlZoneHover'
  | 'controlZoneLeave'
  | 'controlZoneLeftClick'

  | 'mouseWheel'
  | 'aircraftSpatialSelect' // 新增你需要的事件类型
  | 'airportSpatialSelect'
  // | 'aircraftsSynced'
  | 'spatialSelectionTableOperationClicked'
  | 'clearAircraftSpatialSelection'
  | 'clearAirportSpatialSelection'

  | 'controlZoneTableOperationClicked'
  | 'photogrammetryTableOperationClicked'

// 2. 相机事件（与鼠标事件一致：一事一名，payload 为 Camera）
export type CesiumCameraEventName = 'cameraMoveEnd' | 'cameraFlyEnd' | 'cameraChanged'
export type CameraEventCallback = (camera: Cesium.Camera) => void

// 3. 事件回调映射（补充 spatialSelection 的类型）
export interface EventCallbackMap {
  aircraftHover: (properties: AircraftBillboardProperties, position: Cesium.Cartesian2, billboard: Cesium.Billboard) => void;
  aircraftLeave: () => void;
  aircraftLeftClick: (properties: AircraftBillboardProperties, billboard: Cesium.Billboard) => void;

  airportHover: (properties: AirportBillboardProperties, position: Cesium.Cartesian2, billboard: Cesium.Billboard) => void;
  airportLeave: () => void;
  airportLeftClick: (properties: AirportBillboardProperties, billboard: Cesium.Billboard) => void;

  satelliteHover: (properties: SatelliteProperties, position: Cesium.Cartesian2) => void;
  satelliteLeave: () => void;
  satelliteLeftClick: (properties: SatelliteProperties, entity: Cesium.Entity) => void;

  osmBuildingHover: (properties: OSMBuildingHoveredProperties, position: Cesium.Cartesian2) => void;
  osmBuildingLeave: () => void;
  osmBuildingLeftClick: (data: OSMBuildingSelectedProperties, feature: Cesium.Cesium3DTileFeature) => void;

  photogrammetryHover: (properties: PhotogrammetryHoveredProperties, position: Cesium.Cartesian2) => void;
  photogrammetryLeave: () => void;

  photogrammetryBuildingHover: (
    properties: PhotogrammetryBuildingHoveredProperties,
    position: Cesium.Cartesian2,
  ) => void;
  photogrammetryBuildingLeave: () => void;
  photogrammetryBuildingLeftClick: (data: PhotogrammetryBuildingSelectedProperties) => void;

  controlZoneHover: (
    properties: ControlZoneProperties,
    position: Cesium.Cartesian2,
    entity: Cesium.Entity,
  ) => void;
  controlZoneLeave: () => void;
  controlZoneLeftClick: (properties: ControlZoneProperties, entity: Cesium.Entity) => void;

  mouseWheel: (camera: Cesium.Camera) => void;
  aircraftSpatialSelect: (spatialSelectionData:SpatialSelectionData) => void;
  airportSpatialSelect: (spatialSelectionData:SpatialSelectionData) => void;
  // aircraftsSynced: (aircraftsSyncData:AircraftsSyncData) => void;
  spatialSelectionTableOperationClicked: (spatialSelectionTableRowOperation:SpatialSelectionTableRowOperation) => void;
  clearAircraftSpatialSelection: (clearAircraftSpatialSelectionData:ClearAircraftSpatialSelectionData|undefined) => void;
  clearAirportSpatialSelection: (clearAirportSpatialSelectionData:ClearAirportSpatialSelectionData|undefined) => void;

  controlZoneTableOperationClicked: (controlZoneTableRowOperation:ControlZoneTableRowOperation) => void;
  photogrammetryTableOperationClicked: (photogrammetryTableRowOperation: PhotogrammetryTableRowOperation) => void;
}

// 4. 合并所有事件类型
type AllCesiumEvents = {
  [K in CesiumCameraEventName]: Cesium.Camera
} & { [K in CesiumMouseEventName]: Parameters<EventCallbackMap[K]> }

// 5. 创建 mitt 实例
const mittBus = mitt<AllCesiumEvents>();

// 6. 抽离公共的事件发布方法
export const emitCesiumEvent = <T extends CesiumMouseEventName>(
  eventName: T,
  ...args: Parameters<EventCallbackMap[T]>
) => {
  mittBus.emit(eventName, args); // 适配 mitt 单参数规则：多参数打包为数组
};

// 7. 抽离公共的事件订阅方法
export const onCesiumEvent = <T extends CesiumMouseEventName>(
  eventName: T,
  callback: (...args: Parameters<EventCallbackMap[T]>) => void
) => {
  const wrappedCallback = (args: Parameters<EventCallbackMap[T]>) => {
    // if (Array.isArray(args)) {
      callback(...args); // 多参数解构
    // } else {
    //   callback(args);    // 单参数直接传递
    // }
  };

  //一个事件名（如 'airportLeftClick'）上可以挂 多个回调，像一个列表：
  //airportLeftClick → [ wrappedCallback_A, wrappedCallback_B, wrappedCallback_C ]
  //每次 emit('airportLeftClick', …)，列表里的函数都会执行。

  // off('airportLeftClick', wrappedCallback_A)
  // 只删 A，B、C 还在

  // off('airportLeftClick')（不传函数）
  // 全删，A/B/C 都没了

  // 所以 onCesiumEvent 返回的 unsub 里带上 当时那个 wrappedCallback，只会取消自己那一次订阅。
  mittBus.on(eventName, wrappedCallback);
  // 返回解绑函数，方便外部销毁
  return () => mittBus.off(eventName, wrappedCallback);
};

export default mittBus;
