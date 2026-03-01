import mitt from 'mitt';
import type {AircraftBaseProperties,AircraftSelectedData} from "@/views/aviation-situation/types/aircraft"
import type {AirportBaseProperties,AirportSelectedData} from "@/views/aviation-situation/types/airport"

// 1. 相机事件类型（对齐原 useCesiumCameraEvents.ts）
export type CesiumCameraEventName = 'moveEnd' | 'flyEnd' | 'changed';
export type CameraEventCallback = (camera: Cesium.Camera) => void;
interface CameraEvent {
  type: CesiumCameraEventName;
  payload: Cesium.Camera;
}

// 2. Cesium 交互事件类型（对齐原 useCesiumEvents.ts）
export type CesiumMouseEventName =
  | 'aircraftHover'
  | 'aircraftLeave'
  | 'aircraftLeftClick'
  | 'airportHover'
  | 'airportLeave'
  | 'airportLeftClick'
  | 'mouseWheel';

export interface EventCallbackMap {
  aircraftHover: (properties: AircraftBaseProperties, position: Cesium.Cartesian2, billboard: Cesium.Billboard) => void;
  aircraftLeave: () => void;
  aircraftLeftClick: (data: AircraftSelectedData, billboard: Cesium.Billboard) => void;
  airportHover: (properties: AirportBaseProperties, position: Cesium.Cartesian2, billboard: Cesium.Billboard) => void;
  airportLeave: () => void;
  airportLeftClick: (data: AirportSelectedData, billboard: Cesium.Billboard) => void;
  mouseWheel: () => void;
}

// 3. 合并所有事件类型
type AllCesiumEvents = {
  camera: CameraEvent; // 相机事件
} & { [K in CesiumMouseEventName]: Parameters<EventCallbackMap[K]> };

// 4. 创建 mitt 实例（泛型约束类型）
const mittBus = mitt<AllCesiumEvents>();

export default mittBus;
