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

export type CesiumMouseEventName =
  | 'aircraftHover'
  | 'aircraftLeave'
  | 'aircraftLeftClick'
  | 'airportHover'
  | 'airportLeave'
  | 'airportLeftClick'
  | 'mouseWheel'
  | 'aircraftSpatialSelect' // 新增你需要的事件类型
  | 'airportSpatialSelect'
  // | 'aircraftsSynced'
  | 'aircraftFilterTableDetailClicked'
  | 'spatialSelectionTableOperationClicked'
  | 'clearAircraftSpatialSelection'
  | 'clearAirportSpatialSelection';

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
  mouseWheel: () => void; // 新增事件的回调类型（无参数）
  aircraftSpatialSelect: (spatialSelectionData:SpatialSelectionData) => void;
  airportSpatialSelect: (spatialSelectionData:SpatialSelectionData) => void;
  // aircraftsSynced: (aircraftsSyncData:AircraftsSyncData) => void;
  aircraftFilterTableDetailClicked: (icao24:string) => void;
  spatialSelectionTableOperationClicked: (spatialSelectionTableRowOperation:SpatialSelectionTableRowOperation) => void;
  clearAircraftSpatialSelection: (clearAircraftSpatialSelectionData:ClearAircraftSpatialSelectionData|undefined) => void;
  clearAirportSpatialSelection: (clearAirportSpatialSelectionData:ClearAirportSpatialSelectionData|undefined) => void;
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
  ...args: EventCallbackMap[T]
) => {
  mittBus.emit(eventName, args); // 适配 mitt 单参数规则：多参数打包为数组
};

// 7. 抽离公共的事件订阅方法
export const onCesiumEvent = <T extends CesiumMouseEventName>(
  eventName: T,
  callback: (...args: EventCallbackMap[T]) => void
) => {
  const wrappedCallback = (args: Parameters<EventCallbackMap[T]>) => {
    if (Array.isArray(args)) {
      callback(...args); // 多参数解构
    } else {
      callback(args);    // 单参数直接传递
    }
  };

  mittBus.on(eventName, wrappedCallback);
  // 返回解绑函数，方便外部销毁
  return () => mittBus.off(eventName, wrappedCallback);
};

export default mittBus;
