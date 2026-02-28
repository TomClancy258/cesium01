import mitt from 'mitt';

// 1. 相机事件类型（对齐原 useCesiumCameraEvents.ts）
export type CameraEventType = 'moveEnd' | 'flyEnd' | 'changed';
export type CameraEventCallback = (camera: Cesium.Camera) => void;
interface CameraEvent {
  type: CameraEventType;
  payload: Cesium.Camera;
}

// 2. Cesium 交互事件类型（对齐原 useCesiumEvents.ts）
export type CesiumEventName =
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
} & { [K in CesiumEventName]: Parameters<EventCallbackMap[K]> };

// 4. 创建 mitt 实例（泛型约束类型）
const mittBus = mitt<AllCesiumEvents>();

export default mittBus;

// 补充必要的类型引用（需和项目中已有类型对齐）
declare global {
  namespace Cesium {
    type Camera = any;
    type Billboard = any;
    type Cartesian2 = any;
    type Cartesian3 = any;
    type PickedObject = any;
  }
  interface AircraftBaseProperties {
    type: string;
    sourceType: string;
    icao24: string;
    originCountry: string;
    callsign: string;
    longitude: number;
    latitude: number;
    baroAltitude: number;
    heading: number;
  }
  interface AircraftSelectedData {
    sourceType: string;
    icao24: string;
    position: {
      latitude: number;
      longitude: number;
      baroAltitude: number;
    };
  }
  interface AirportBaseProperties {
    type: string;
    sourceType: string;
    icao: string;
    country: string;
    name: string;
    longitude: number;
    latitude: number;
  }
  interface AirportSelectedData {
    sourceType: string;
    icao: string;
  }
}
