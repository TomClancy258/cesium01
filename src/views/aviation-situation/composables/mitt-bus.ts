// src/views/aviation-situation/composables/mitt-bus.ts
import mitt from 'mitt';
import {
  AircraftBaseProperties,
  AircraftSelectedData, ClearAircraftSpatialSelectionData
} from '@/views/aviation-situation/types/aircraft'
import type { AirportBaseProperties, AirportSelectedData,ClearAirportSpatialSelectionData } from "@/views/aviation-situation/types/airport"
import type {  SpatialSelectionData} from '@/views/aviation-situation/types/shared'
import {
  SpatialSelectionTableRowOperation
} from '@/views/aviation-situation/types/draw-tools'
import Cesium from 'cesium'
import type { SatelliteHoveredProperties } from '@/views/aviation-situation/types/satellite'
import type {
  OSMBuildingHoveredProperties,
  OSMBuildingSelectedProperties,
} from '@/views/aviation-situation/types/osm-building'
import type { PhotogrammetryHoveredProperties, PhotogrammetryBuildingHoveredProperties, PhotogrammetryBuildingSelectedProperties, PhotogrammetryTableRowOperation } from '@/views/aviation-situation/types/photogrammetry'
import {
  ControlZoneTableRowOperation,
  type ControlZoneHoveredProperties,
} from '@/views/aviation-situation/types/control-zone'

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

  | 'mouseWheel'
  | 'aircraftSpatialSelect' // 新增你需要的事件类型
  | 'airportSpatialSelect'
  // | 'aircraftsSynced'
  | 'spatialSelectionTableOperationClicked'
  | 'clearAircraftSpatialSelection'
  | 'clearAirportSpatialSelection'

  | 'controlZoneTableOperationClicked'
  | 'photogrammetryTableOperationClicked'

// 2. 相机事件类型
export type CesiumCameraEventName = 'moveEnd' | 'flyEnd' | 'changed';
export type CameraEventCallback = (camera: Cesium.Camera) => void;
interface CameraEvent {
  type: CesiumCameraEventName;
  payload: Cesium.Camera;
}

// 3. 事件回调映射（补充 spatialSelection 的类型）
export interface EventCallbackMap {
  aircraftHover: (properties: AircraftBaseProperties, position: Cesium.Cartesian2, billboard: Cesium.Billboard) => void;
  aircraftLeave: () => void;
  aircraftLeftClick: (data: AircraftSelectedData, billboard: Cesium.Billboard) => void;

  airportHover: (properties: AirportBaseProperties, position: Cesium.Cartesian2, billboard: Cesium.Billboard) => void;
  airportLeave: () => void;
  airportLeftClick: (data: AirportSelectedData, billboard: Cesium.Billboard) => void;

  satelliteHover: (properties: SatelliteHoveredProperties, position: Cesium.Cartesian2, entity: Cesium.Entity) => void;
  satelliteLeave: () => void;
  satelliteLeftClick: (data: SatelliteHoveredProperties, entity: Cesium.Entity) => void;

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
    properties: ControlZoneHoveredProperties,
    position: Cesium.Cartesian2,
    entity: Cesium.Entity,
  ) => void;
  controlZoneLeave: () => void;

  mouseWheel: () => void; // 新增事件的回调类型（无参数）
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
  camera: CameraEvent;
} & { [K in CesiumMouseEventName]: Parameters<EventCallbackMap[K]> };

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

  mittBus.on(eventName, wrappedCallback);
  // 返回解绑函数，方便外部销毁
  return () => mittBus.off(eventName, wrappedCallback);
};

export default mittBus;
