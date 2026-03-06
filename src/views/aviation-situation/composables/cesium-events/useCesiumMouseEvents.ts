//useCesiumMouseEvents.ts
import * as Cesium from 'cesium'
import { useThrottleFn } from '@vueuse/core'
import mittBus, { CesiumMouseEventName,EventCallbackMap } from '../mittBus'
import type { MapBillboardLabelProperties } from "../../types/shared"
import { AircraftBillboardProperties } from '@/views/aviation-situation/types/aircraft'

import {handleAircraftHover,handleAircraftLeftClick} from "./event-handlers/aircraft-interaction"
import {handleAirportHover,handleAirportLeftClick} from "./event-handlers/airport-interaction"

import {useSpatialSelectStore} from "@/stores/spatialSelect"
const spatialSelectStore=useSpatialSelectStore()

import {useHighlightStore} from "@/stores/highlight"
const highlightStore=useHighlightStore()

import {
  useDistanceSurvey,
} from "./event-handlers/useDistanceSurvey"
import { ShallowRef } from 'cesium'

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
export const useCesiumMouseEvents = (viewer: ShallowRef<Cesium.Viewer | null>) => {
  let handler: Cesium.ScreenSpaceEventHandler | null = null

  const {
    distanceSurvey,
    confirmSurveyPoint,
    setupSpatialSelectFormWatch,
    finishDistanceSurvey,
  }=useDistanceSurvey(viewer)

  const initEvents = () => {
    if (!viewer?.value) return

    // 销毁已有 handler
    if (handler) handler.destroy()
    handler = new Cesium.ScreenSpaceEventHandler(viewer.value.scene.canvas)

    // 鼠标移动
    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      // console.log("MOUSE_MOVE");
      if(spatialSelectStore.spatialSelectForm.operationType==='distanceSurvey'){
        distanceSurvey(movement.endPosition)
      }
      mouseMove(movement)
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    // 左键点击
    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.ClickEvent) => {
      const pickedObject = viewer.value.scene.pick(click.position)
      console.log("pickedObject", pickedObject);
      if (Cesium.defined(pickedObject) && pickedObject.id) {
        if(pickedObject.id instanceof Cesium.Entity){
          if(spatialSelectStore.spatialSelectForm.operationType==='distanceSurvey'){
            confirmSurveyPoint()
          }
        }else if (pickedObject.primitive instanceof Cesium.Billboard) {
          const properties = pickedObject.primitive.properties as MapBillboardLabelProperties
          if (properties.type !== 'billboard') return
          if (properties.sourceType === 'aircraft') {
            handleAircraftLeftClick(properties, pickedObject)
          } else if (properties.sourceType === 'airport') {
            handleAirportLeftClick(properties, pickedObject)
          }else{
            highlightStore.clearSelected()
            highlightStore.clearLastSelectedIcao24()
          }
        }
      }else{
        highlightStore.clearSelected()
        highlightStore.clearLastSelectedIcao24()
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    // 右键点击
    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.ClickEvent) => {
      if(spatialSelectStore.spatialSelectForm.operationType==='distanceSurvey'){
        finishDistanceSurvey()
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

    // 鼠标滚轮
    handler.setInputAction((event: Cesium.ScreenSpaceEventHandler.InputEvent) => {
      mouseWheel(event)
    }, Cesium.ScreenSpaceEventType.WHEEL)

    handler.setInputAction((event: Cesium.ScreenSpaceEventHandler.InputEvent) => {
      console.log("LEFT_DOWN");
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN)

    setupSpatialSelectFormWatch()
  }

  // 鼠标滚轮（节流）
  const mouseWheel = useThrottleFn(() => {
    emitCesiumEvent('mouseWheel')
  }, 500)

  const hovered={
    sourceType:'',
    type:'',
    showEntities:[],
    entity:null
  }
  // 鼠标移动（节流）
  const mouseMove = useThrottleFn((movement:Cesium.ScreenSpaceEventHandler.PositionedEvent): void => {
    const pickedObject:Cesium.PickedObject | undefined = viewer.value.scene.pick(movement.endPosition);
    if (Cesium.defined(pickedObject) && pickedObject.id) {
      if (pickedObject.id instanceof Cesium.Entity) {
        const entity: Cesium.Entity = pickedObject.id
        if (!entity.properties) {
          return
        }
        const properties = entity.properties.getValue()

        if(properties.sourceType==='distanceSurvey'&&properties.type==='polyline') {
          const dataSourceName:string=properties.dataSourceName
          const dataSources:Cesium.CustomDataSource[]=viewer.value.dataSources.getByName(dataSourceName)
          if (dataSources.length === 0) {
            return
          }
          const dataSource:Cesium.CustomDataSource=dataSources[0]
          const values:Cesium.Entity[]=dataSource.entities.values
          for (let i:number = 2; i < values.length; i++) {
            values[i].show=true
            hovered.showEntities[i-2]=values[i]
          }
          hovered.sourceType='distanceSurvey'
          hovered.type='polyline'
          // hovered.entity=entity
          // hovered.entity.polyline.material=Cesium.Color.fromCssColorString('#A5F3FC')

          highlightEntityOnHover(entity, {
            components: [
              { type: 'polyline', prop: 'material', value: Cesium.Color.fromCssColorString('#A5F3FC') }
            ]
          })
        }
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
