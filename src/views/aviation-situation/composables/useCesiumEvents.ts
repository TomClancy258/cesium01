// src/views/aviation-situation/composables/useCesiumEvents.ts
import type { Viewer } from 'cesium'
import type {
  AircraftBaseProperties,
  AircraftBillboardProperties,
  AircraftSelectedData
} from '@/views/aviation-situation/types/aircraft'
import {
  AirportBaseProperties,
  AirportBillboardProperties,
  AirportSelectedData
} from '@/views/aviation-situation/types/airport'
import * as Cesium from 'cesium'
import { useThrottleFn } from '@vueuse/core'

import type {MapBillboardLabelProperties} from "../types/shared"

// 定义事件类型
type CesiumEventName =
  | 'aircraftHover'
  | 'aircraftLeave'
  | 'aircraftLeftClick'
  | 'airportHover'
  | 'airportLeave'
  | 'airportLeftClick'
  | 'mouseWheel';

// 定义事件回调类型
type EventCallbackMap = {
  aircraftHover: (properties: AircraftBaseProperties, position: Cesium.Cartesian2, billboard: Cesium.Billboard) => void;
  aircraftLeave: () => void;
  aircraftLeftClick: (data: AircraftSelectedData, billboard: Cesium.Billboard) => void;
  airportHover: (properties: AirportBaseProperties, position: Cesium.Cartesian2, billboard: Cesium.Billboard) => void;
  airportLeave: () => void;
  airportLeftClick: (data: AirportSelectedData, billboard: Cesium.Billboard) => void;
  mouseWheel: () => void;
};

// 订阅者存储
const eventSubscribers: Record<CesiumEventName, Array<EventCallbackMap[CesiumEventName]>> = {
  aircraftHover: [],
  aircraftLeave: [],
  aircraftLeftClick: [],
  airportHover: [],
  airportLeave: [],
  airportLeftClick: [],
  mouseWheel: [],
};

// 发布事件
export const emitCesiumEvent = <T extends CesiumEventName>(
  eventName: T,
  ...args: Parameters<EventCallbackMap[T]>
) => {
  eventSubscribers[eventName].forEach(callback => {
    (callback as Function)(...args);
  });
};

// 订阅事件（返回取消订阅函数）
export const onCesiumEvent = <T extends CesiumEventName>(
  eventName: T,
  callback: EventCallbackMap[T]
) => {
  // 关键：如果事件名对应的数组不存在，先初始化空数组
  if (!eventSubscribers[eventName]) {
    eventSubscribers[eventName] = [];
    console.warn(`事件 ${eventName} 未提前初始化，已自动创建空数组`);
  }

  // console.log(`订阅 ${eventName} 事件，当前订阅数：`, eventSubscribers[eventName].length);
  eventSubscribers[eventName].push(callback);

  return () => {
    const index = eventSubscribers[eventName].findIndex(cb => cb === callback);
    if (index > -1) eventSubscribers[eventName].splice(index, 1);
  };
};

// 初始化Cesium事件监听（仅负责拾取和发布事件，不处理业务）
export const useCesiumEvents = (viewer: Viewer | null) => {
  let handler: Cesium.ScreenSpaceEventHandler | null = null;

  const initEvents = () => {
    if (!viewer.value) return;

    // 销毁已有handler
    if (handler) handler.destroy();
    handler = new Cesium.ScreenSpaceEventHandler(viewer.value.scene.canvas);

    // 鼠标移动：拾取Billboard并发布对应事件
    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      mouseMove(movement)
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 鼠标左键点击：拾取Billboard并发布对应事件
    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.ClickEvent) => {
      const pickedObject:Cesium.PickedObject | undefined = viewer.value.scene.pick(click.position);

      if (Cesium.defined(pickedObject) && pickedObject.id) {
        if (pickedObject.id instanceof Cesium.Entity) {
          const entity: Cesium.Entity = pickedObject.id
        } else if (pickedObject.primitive instanceof Cesium.Billboard) {
          const properties: MapBillboardLabelProperties = pickedObject.primitive.properties
          if (properties.type !== 'billboard') return;
          if(properties.sourceType === 'aircraft'){
            handleAircraftLeftClick(properties as AircraftBillboardProperties,pickedObject)
          } else if (properties.sourceType === 'airport') {
            handleAirportLeftClick(properties as AirportBillboardProperties,pickedObject)
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction((event: Cesium.ScreenSpaceEventHandler.InputEvent) => {
      mouseWheel(event)
    }, Cesium.ScreenSpaceEventType.WHEEL);
  };

  const mouseWheel = useThrottleFn((event: Cesium.ScreenSpaceEventHandler.InputEvent): void => {
    emitCesiumEvent(
      'mouseWheel',
    )
  }, 500)


  const mouseMove = useThrottleFn((movement:Cesium.ScreenSpaceEventHandler.PositionedEvent): void => {
    const pickedObject:Cesium.PickedObject | undefined = viewer.value.scene.pick(movement.endPosition);
    // console.log('鼠标移动拾取结果：', pickedObject);
    if (Cesium.defined(pickedObject) && pickedObject.id) {
      if (pickedObject.id instanceof Cesium.Entity) {
        const entity: Cesium.Entity = pickedObject.id
      } else if (pickedObject.primitive instanceof Cesium.Billboard) {
        const properties: MapBillboardLabelProperties = pickedObject.primitive.properties

        const position:Cesium.Cartesian3 = pickedObject.primitive.position
        const screenPosition: Cesium.Cartesian2 =
          Cesium.SceneTransforms.worldToWindowCoordinates(
            viewer.value.scene,
            position
          )
        if (properties.type !== 'billboard') return;
        if(properties.sourceType === 'aircraft'){
          // emitCesiumEvent('airportLeave');
          handleAircraftHover(properties as AircraftBillboardProperties,screenPosition,pickedObject)
          // console.log("highlightStore.hoveredBillboard", highlightStore.hoveredBillboard);
        } else if (properties.sourceType === 'airport') {
          // emitCesiumEvent('aircraftLeave');
          handleAirportHover(properties as AirportBillboardProperties,screenPosition,pickedObject)
        }
      }
    }else {
      // clearHoveredHighlight()
      emitCesiumEvent('aircraftLeave');
      emitCesiumEvent('airportLeave');
    }
  }, 100)

  const handleAircraftHover=(properties:AircraftBillboardProperties,screenPosition:Cesium.Cartesian2,pickedObject)=>{
    const baseProperties: AircraftBaseProperties = {
      type: properties.type, // 'billboard' —— 注意：这里保留原值，或可设为 'aircraft'
      sourceType: properties.sourceType,
      icao24: properties.icao24,
      originCountry: properties.originCountry,
      callsign: properties.callsign,
      longitude: properties.longitude,
      latitude: properties.latitude,
      baroAltitude: properties.baroAltitude,
      heading: properties.heading,
    }
    emitCesiumEvent(
      'aircraftHover',
      baseProperties, screenPosition,pickedObject.primitive
    )
  }
  const handleAirportHover=(properties:AirportBillboardProperties,screenPosition:Cesium.Cartesian2,pickedObject)=>{
    const baseProperties: AirportBaseProperties = {
      type: properties.type, // 'billboard' —— 注意：这里保留原值，或可设为 'aircraft'
      sourceType: properties.sourceType,
      icao: properties.icao,
      country: properties.country,
      name: properties.name,
      longitude: properties.longitude,
      latitude: properties.latitude,
    }
    emitCesiumEvent(
      'airportHover',
      baseProperties, screenPosition,pickedObject.primitive
    )
  }


  const handleAircraftLeftClick=(properties:AircraftBillboardProperties,pickedObject:Cesium.PickedObject)=>{
    const aircraftSelectedData: AircraftSelectedData = {
      sourceType: properties.sourceType,
      icao24: properties.icao24,
      position:{
        latitude: properties.latitude,
        longitude: properties.longitude,
        baroAltitude: properties.baroAltitude
      }
    };
    emitCesiumEvent(
      'aircraftLeftClick',
      aircraftSelectedData,
      pickedObject.primitive
    )
  }

  const handleAirportLeftClick=(properties:AirportBillboardProperties,pickedObject:Cesium.PickedObject)=>{
    const airportSelectedData: AirportSelectedData = {
      sourceType: properties.sourceType,
      icao: properties.icao
    };
    emitCesiumEvent(
      'airportLeftClick',
      airportSelectedData,
      pickedObject.primitive
    )
  }

  // 销毁事件监听
  const destroyEvents = () => {
    if (handler) handler.destroy();
    handler = null;
    // 清空所有订阅者
    Object.keys(eventSubscribers).forEach(key => {
      eventSubscribers[key as CesiumEventName] = [];
    });
  };

  return { initEvents, destroyEvents };
};
