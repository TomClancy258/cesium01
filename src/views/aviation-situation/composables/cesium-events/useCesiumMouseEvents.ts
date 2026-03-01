// src/views/aviation-situation/composables/useCesiumEvents.ts
import type { Viewer } from 'cesium'
import * as Cesium from 'cesium'
import { useThrottleFn } from '@vueuse/core'
import mittBus, { CesiumMouseEventName,EventCallbackMap } from '../mittBus'
import type { MapBillboardLabelProperties } from "../../types/shared"
import {
  AircraftBaseProperties,
  AircraftBillboardProperties, AircraftSelectedData
} from '@/views/aviation-situation/types/aircraft'

// 发布 Cesium 交互事件（替换原 emitCesiumEvent）
export const emitCesiumEvent = <T extends CesiumMouseEventName>(
  eventName: T,
  ...args:  EventCallbackMap[T]
) => {
  // 关键修改：把多参数作为「单个数组参数」emit（适配mitt的单参数规则）
  mittBus.emit(eventName, args);
};

// 订阅 Cesium 交互事件（替换原 onCesiumEvent）
export const onCesiumEvent = <T extends CesiumMouseEventName>(
  eventName: T,
  callback: (...args: EventCallbackMap[T]) => void
) => {
  // 关键修改：mitt的回调接收单个参数（多参数时是数组），手动解构后传给callback
  const wrappedCallback = (args: Parameters<EventCallbackMap[T]>) => {
    if (Array.isArray(args)) {
      callback(...args); // 多参数时解构数组
    } else {
      callback(args);    // 单参数时直接传递
    }
  };

  mittBus.on(eventName, wrappedCallback);
  return () => {
    mittBus.off(eventName, wrappedCallback); // 解绑包装后的回调
  };
};

// 初始化 Cesium 事件监听（核心逻辑不变，仅替换事件发布方式）
export const useCesiumMouseEvents = (viewer: Viewer | null) => {
  let handler: Cesium.ScreenSpaceEventHandler | null = null

  const initEvents = () => {
    if (!viewer?.value) return

    // 销毁已有 handler
    if (handler) handler.destroy()
    handler = new Cesium.ScreenSpaceEventHandler(viewer.value.scene.canvas)

    // 鼠标移动
    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      mouseMove(movement)
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    // 左键点击
    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.ClickEvent) => {
      const pickedObject = viewer.value.scene.pick(click.position)
      if (Cesium.defined(pickedObject) && pickedObject.id) {
        if (pickedObject.primitive instanceof Cesium.Billboard) {
          const properties = pickedObject.primitive.properties as MapBillboardLabelProperties
          if (properties.type !== 'billboard') return
          if (properties.sourceType === 'aircraft') {
            handleAircraftLeftClick(properties, pickedObject)
          } else if (properties.sourceType === 'airport') {
            handleAirportLeftClick(properties, pickedObject)
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    // 鼠标滚轮
    handler.setInputAction((event: Cesium.ScreenSpaceEventHandler.InputEvent) => {
      mouseWheel(event)
    }, Cesium.ScreenSpaceEventType.WHEEL)
  }

  // 鼠标滚轮（节流）
  const mouseWheel = useThrottleFn(() => {
    emitCesiumEvent('mouseWheel')
  }, 500)

  // 鼠标移动（节流）
  const mouseMove = useThrottleFn((movement:Cesium.ScreenSpaceEventHandler.PositionedEvent): void => {
    const pickedObject:Cesium.PickedObject | undefined = viewer.value.scene.pick(movement.endPosition);
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
          handleAircraftHover(properties as AircraftBillboardProperties,screenPosition,pickedObject)
        } else if (properties.sourceType === 'airport') {
          handleAirportHover(properties as AirportBillboardProperties,screenPosition,pickedObject)
        }
      }
    }else {
      // clearHoveredHighlight()
      emitCesiumEvent('aircraftLeave');
      emitCesiumEvent('airportLeave');
    }
  }, 100)

  // 处理飞机 hover
  const handleAircraftHover = (properties: AircraftBillboardProperties, screenPosition: Cesium.Cartesian2, pickedObject: Cesium.PickedObject) => {
    const baseProperties:AircraftBaseProperties = {
      type: properties.type,
      sourceType: properties.sourceType,
      icao24: properties.icao24,
      originCountry: properties.originCountry,
      callsign: properties.callsign,
      longitude: properties.longitude,
      latitude: properties.latitude,
      baroAltitude: properties.baroAltitude,
      heading: properties.heading,
    }
    emitCesiumEvent('aircraftHover', baseProperties, screenPosition, pickedObject.primitive)
  }

  // 处理机场 hover
  const handleAirportHover = (properties: AirportBillboardProperties, screenPosition: Cesium.Cartesian2, pickedObject: Cesium.PickedObject) => {
    const baseProperties:AirportBaseProperties = {
      type: properties.type,
      sourceType: properties.sourceType,
      icao: properties.icao,
      country: properties.country,
      name: properties.name,
      longitude: properties.longitude,
      latitude: properties.latitude,
    }
    emitCesiumEvent('airportHover', baseProperties, screenPosition, pickedObject.primitive)
  }

  // 处理飞机左键点击
  const handleAircraftLeftClick = (properties: AircraftBillboardProperties, pickedObject: Cesium.PickedObject):void => {
    const aircraftSelectedData:AircraftSelectedData = {
      sourceType: properties.sourceType,
      icao24: properties.icao24,
      position: {
        latitude: properties.latitude,
        longitude: properties.longitude,
        baroAltitude: properties.baroAltitude
      }
    }
    emitCesiumEvent('aircraftLeftClick', aircraftSelectedData, pickedObject.primitive)
  }

  // 处理机场左键点击
  const handleAirportLeftClick = (properties: AirportBillboardProperties, pickedObject: Cesium.PickedObject):void => {
    const airportSelectedData:AirportSelectedData = {
      sourceType: properties.sourceType,
      icao: properties.icao
    }
    emitCesiumEvent('airportLeftClick', airportSelectedData, pickedObject.primitive)
  }

  // 销毁事件监听
  const destroyEvents = () => {
    if (handler) handler.destroy()
    handler = null
    // 清空所有 Cesium 交互事件订阅
    const eventNames: CesiumMouseEventName[] = [
      'aircraftHover', 'aircraftLeave', 'aircraftLeftClick',
      'airportHover', 'airportLeave', 'airportLeftClick', 'mouseWheel'
    ]
    eventNames.forEach(name => mittBus.off(name))
  }

  return { initEvents, destroyEvents }
}
