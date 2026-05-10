//src/views/aviation-situation/composables/cesium-events/useCesiumMouseEvents.ts
import * as Cesium from 'cesium'
import { useThrottleFn,useDebounceFn, } from '@vueuse/core'
import mittBus, { CesiumMouseEventName } from '../mitt-bus'
import type { LngLatAlt, MapBillboardLabelProperties } from '../../types/shared'
import { AircraftBillboardProperties } from '@/views/aviation-situation/types/aircraft'

import {handleAircraftHover,handleAircraftLeftClick} from "./event-handlers/interaction/aircraft"
import {handleAirportHover,handleAirportLeftClick} from "./event-handlers/interaction/airport"
import {
  handleSpatialSelectionHover,
  handleSpatialSelectionLeftClick
} from './event-handlers/interaction/spatial-selection'

import {useAviationSelectionStore} from "@/stores/aviation-selection"
const aviationSelectionStore=useAviationSelectionStore()

import {
  useDistanceMeasurement,
} from "./event-handlers/useDistanceMeasurement"
import {
  usePolygonSpatialSelection,
} from "./event-handlers/spatial-selection/usePolygonSpatialSelection.ts"
import {
  useCircleSpatialSelection,
} from "./event-handlers/spatial-selection/useCircleSpatialSelection.ts"

import { ShallowRef } from 'cesium'
import { EntityProperties } from '@/views/aviation-situation/types/entity'
import {
  clearHoveredEntityHighlight,
  clearSelectedEntityHighlight
} from '@/views/aviation-situation/composables/highlight-manager/drawing-tool-highlight-manager'

import {
  useMouseFollowPointLabel
} from '@/views/aviation-situation/composables/cesium-events/event-handlers/shared/useMouseFollowPointLabel'

import {
  useTempSegmentDistanceLabel
} from '@/views/aviation-situation/composables/cesium-events/event-handlers/shared/useTempSegmentDistanceLabel'

import {
  useTempTotalDistanceLabel
} from '@/views/aviation-situation/composables/cesium-events/event-handlers/shared/useTempTotalDistanceLabel'

import {
  useTempPerimeterAndAreaLabel
} from '@/views/aviation-situation/composables/cesium-events/event-handlers/shared/useTempPerimeterAndAreaLabel'

import { onUnmounted, watch } from 'vue'

import { type DrawingToolForm,useDrawingToolStore } from '@/stores/drawing-tool'
import { emitCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import {
  useHemisphereSpatialSelection
} from '@/views/aviation-situation/composables/cesium-events/event-handlers/spatial-selection/useHemisphereSpatialSelection'

import type {SatelliteProperties} from "@/views/aviation-situation/types/satellite.ts"
import {
  handleSatelliteHover,
  handleSatelliteLeftClick,
} from '@/views/aviation-situation/composables/cesium-events/event-handlers/interaction/satellite'
import {
  clearHoveredBillboardHighlight
} from '@/views/aviation-situation/composables/highlight-manager/billboard-highlight-manager'
import {
  clearHoveredSatelliteHighlight
} from '@/views/aviation-situation/composables/highlight-manager/satellite-highlight-manager'

// 初始化 Cesium 事件监听（核心逻辑不变，仅替换事件发布方式）
export const useCesiumMouseEvents = (viewer: ShallowRef<Cesium.Viewer | null>) => {
  const drawingToolStore=useDrawingToolStore()

  let handler: Cesium.ScreenSpaceEventHandler | null = null
  const mouseFollowPointLabelManager = useMouseFollowPointLabel(viewer);
  const segmentDistanceLabelManager = useTempSegmentDistanceLabel(viewer);
  const totalDistanceLabelManager = useTempTotalDistanceLabel(viewer);
  const perimeterAndAreaLabel = useTempPerimeterAndAreaLabel(viewer);

  const {
    distanceMeasurement,
    confirmSurveyPoint:confirmDistanceSurveySurveyPoint,
    setupDrawingToolWatch:setupDistanceSurveySpatialFormWatch,
    finishDistanceSurvey,
  }=useDistanceMeasurement(viewer,mouseFollowPointLabelManager,segmentDistanceLabelManager,totalDistanceLabelManager)

  const {
    polygonSpatialSelection,
    confirmSurveyPoint:confirmPolygonSpatialSelectionSurveyPoint,
    setupDrawingToolWatch:setupPolygonSpatialSelectionSpatialFormWatch,
    finishPolygonSpatialSelection,
    subscribePolygonSpatialSelectionEvents,
  }=usePolygonSpatialSelection(viewer,mouseFollowPointLabelManager,perimeterAndAreaLabel)

  const {
    circleSpatialSelection,
    confirmSurveyPoint:confirmCircleSpatialSelectionSurveyPoint,
    setupDrawingToolWatch:setupCircleSpatialSelectionSpatialFormWatch,
    finishCircleSpatialSelection,
    subscribeCircleSpatialSelectionEvents,
  }=useCircleSpatialSelection(viewer,mouseFollowPointLabelManager,perimeterAndAreaLabel)

  const {
    hemisphereSpatialSelection,
    confirmSurveyPoint:confirmHemisphereSpatialSelectionSurveyPoint,
    setupDrawingToolWatch:setupHemisphereSpatialSelectionSpatialFormWatch,
    finishHemisphereSpatialSelection,
    subscribeHemisphereSpatialSelectionEvents,
  }=useHemisphereSpatialSelection(viewer,mouseFollowPointLabelManager,perimeterAndAreaLabel)

  const initEvents = () => {
    if (!viewer?.value) return
    mouseFollowPointLabelManager.addTempPointLabelToViewer()
    segmentDistanceLabelManager.addTempSegmentDistanceLabelToViewer()
    totalDistanceLabelManager.addTempTotalDistanceLabelToViewer()
    perimeterAndAreaLabel.addTempPerimeterAndAreaLabelToViewer()

    subscribePolygonSpatialSelectionEvents()
    subscribeCircleSpatialSelectionEvents()
    subscribeHemisphereSpatialSelectionEvents()

    // 销毁已有 handler
    if (handler) handler.destroy()
    handler = new Cesium.ScreenSpaceEventHandler(viewer.value.scene.canvas)

    // 鼠标移动
    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      // console.log("MOUSE_MOVE");
      if(drawingToolStore.drawingToolForm.operationType==='distanceMeasurement'){
        distanceMeasurement(movement.endPosition)
      }else if(drawingToolStore.drawingToolForm.operationType==='spatialSelection'){
        if(drawingToolStore.drawingToolForm.spatialSelectionSubtype==='polygon'){
          polygonSpatialSelection(movement.endPosition)
        }else if(drawingToolStore.drawingToolForm.spatialSelectionSubtype==='circle'){
          circleSpatialSelection(movement.endPosition)
        }else if(drawingToolStore.drawingToolForm.spatialSelectionSubtype==='hemisphere'){
          hemisphereSpatialSelection(movement.endPosition)
        }
      }
      mouseMove(movement)
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    // 左键点击
    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.ClickEvent) => {
      // ✅ 测绘模式下，优先处理点位确认，不需要 pick 任何对象
      if (drawingToolStore.drawingToolForm.operationType === 'distanceMeasurement') {
        confirmDistanceSurveySurveyPoint()
        return  // ✅ 直接 return，不走后续 pick 逻辑
      }
      if (drawingToolStore.drawingToolForm.operationType === 'spatialSelection') {
        if (drawingToolStore.drawingToolForm.spatialSelectionSubtype === 'polygon') {
          confirmPolygonSpatialSelectionSurveyPoint()
          return
        } else if (drawingToolStore.drawingToolForm.spatialSelectionSubtype === 'circle') {
          confirmCircleSpatialSelectionSurveyPoint()
          return
        } else if (drawingToolStore.drawingToolForm.spatialSelectionSubtype === 'hemisphere') {
          confirmHemisphereSpatialSelectionSurveyPoint()
          return
        }
      }

      // ✅ 非测绘模式，用 drillPick 处理交互
      const pickedObjects = viewer.value.scene.drillPick(click.position, 5)

      if (pickedObjects.length === 0) {
        aviationSelectionStore.clearSelected()
        aviationSelectionStore.clearLastSelectedIcao24()
        drawingToolStore.clearSelected()
        clearSelectedEntityHighlight()
        return
      }

      // ✅ 优先处理 Billboard（飞机/机场）
      const billboardPicked = pickedObjects.find(
        obj => obj.primitive instanceof Cesium.Billboard
      )
      if (billboardPicked) {
        const billboard=billboardPicked.primitive
        const properties = billboard.properties as MapBillboardLabelProperties
        console.log("properties", properties);
        if (properties.type !== 'billboard') return
        if (properties.sourceType === 'aircraft') {
          handleAircraftLeftClick(properties, billboard)
        } else if (properties.sourceType === 'airport') {
          handleAirportLeftClick(properties, billboard)
        } else {
          aviationSelectionStore.clearSelected()
          aviationSelectionStore.clearLastSelectedIcao24()
        }
        return
      }

      // ✅ 没有 Billboard，处理 Entity（半球/多边形等）
      const entityPicked = pickedObjects.find(
        obj => obj.id instanceof Cesium.Entity
      )
      if (entityPicked) {
        const entity: Cesium.Entity = entityPicked.id
        if (!entity.properties) return

        const properties = entity.properties.getValue() as EntityProperties
        console.log("properties", properties);
        if (properties.operationType === 'distanceMeasurement') {
          handleSpatialSelectionLeftClick(viewer, entity, properties)
        } else if (properties.operationType === 'spatialSelection') {
          handleSpatialSelectionLeftClick(viewer, entity, properties)
        }  else if (properties.sourceType === 'satellite') {
          const primitive = entityPicked.primitive
          const isSatelliteModel =
            primitive instanceof Cesium.Model ||
            primitive instanceof Cesium.ModelFeature

          if (!isSatelliteModel)return

          const time = viewer.value.clock.currentTime
          const position = entity.position?.getValue(time)
          if (!position) return
          const cartographic = Cesium.Cartographic.fromCartesian(position)
          const longitude=Cesium.Math.toDegrees(cartographic.longitude)
          const latitude=Cesium.Math.toDegrees(cartographic.latitude)
          const lngLatAlt:LngLatAlt={
            longitude,
            latitude,
            height:cartographic.height,
          }
          handleSatelliteLeftClick(properties as SatelliteProperties,lngLatAlt, entity)
        } else {
          drawingToolStore.clearSelected()
          clearSelectedEntityHighlight()
        }
        return
      }

      // ✅ drillPick 有结果但都不是我们关心的类型
      aviationSelectionStore.clearSelected()
      aviationSelectionStore.clearLastSelectedIcao24()
      drawingToolStore.clearSelected()
      clearSelectedEntityHighlight()

    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    // 右键点击
    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.ClickEvent) => {
      if(drawingToolStore.drawingToolForm.operationType==='distanceMeasurement'){
        finishDistanceSurvey()
      }else if(drawingToolStore.drawingToolForm.operationType==='spatialSelection'){
        if(drawingToolStore.drawingToolForm.spatialSelectionSubtype==='polygon'){
          finishPolygonSpatialSelection()
        }else if(drawingToolStore.drawingToolForm.spatialSelectionSubtype==='circle'){
          finishCircleSpatialSelection()
        }else if(drawingToolStore.drawingToolForm.spatialSelectionSubtype==='hemisphere'){
          finishHemisphereSpatialSelection()
        }
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

    // 鼠标滚轮
    handler.setInputAction((event: Cesium.ScreenSpaceEventHandler.InputEvent) => {
      mouseWheel(event)
    }, Cesium.ScreenSpaceEventType.WHEEL)

    handler.setInputAction((event: Cesium.ScreenSpaceEventHandler.InputEvent) => {
      console.log("LEFT_DOWN");
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN)

    setupDrawingToolWatch()
    setupDistanceSurveySpatialFormWatch()
    setupPolygonSpatialSelectionSpatialFormWatch()
    setupCircleSpatialSelectionSpatialFormWatch()
    setupHemisphereSpatialSelectionSpatialFormWatch()
  }

  // 鼠标滚轮（节流）
  const mouseWheel = useThrottleFn(() => {
    emitCesiumEvent('mouseWheel')
  }, 500)

  // 鼠标移动（节流）
  const mouseMove = useThrottleFn((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent): void => {
    // const pickedObjects = viewer.value.scene.drillPick(movement.endPosition)
    const pickedObjects = viewer.value.scene.drillPick(movement.endPosition, 5)

    if (pickedObjects.length === 0) {
      aviationBillboardLeave()
      clearHoveredBillboardHighlight()
      clearHoveredEntityHighlight()
      clearHoveredSatelliteHighlight()
      emitCesiumEvent('satelliteLeave');
      return
    }

    // ✅ 优先找 Billboard（飞机/机场图标）
    const billboardPicked = pickedObjects.find(
      obj => obj.primitive instanceof Cesium.Billboard
    )
    if (billboardPicked) {
      const billboard=billboardPicked.primitive
      const properties: MapBillboardLabelProperties = billboard.properties
      const position: Cesium.Cartesian3 = billboard.position
      const screenPosition: Cesium.Cartesian2 =
        Cesium.SceneTransforms.worldToWindowCoordinates(viewer.value.scene, position)

      if (properties.type !== 'billboard') return
      if (properties.sourceType === 'aircraft') {
        handleAircraftHover(properties as AircraftBillboardProperties, screenPosition, billboard)
      } else if (properties.sourceType === 'airport') {
        handleAirportHover(properties as AirportBillboardProperties, screenPosition, billboard)
      }
      clearHoveredEntityHighlight() // 有 billboard hover 时清除 entity 高亮
      clearHoveredSatelliteHighlight()
      emitCesiumEvent('satelliteLeave');
      return
    }

    // ✅ 没有 Billboard，再处理 Entity（半球/多边形等）
    const entityPicked = pickedObjects.find(
      obj => obj.id instanceof Cesium.Entity
    )
    if (entityPicked) {
      aviationBillboardLeave()
      clearHoveredBillboardHighlight()
      const entity: Cesium.Entity = entityPicked.id
      if (!entity.properties) return

      const properties = entity.properties.getValue() as EntityProperties|SatelliteProperties
      if (properties.operationType === 'distanceMeasurement') {
        handleSpatialSelectionHover(viewer, entity, properties as EntityProperties)
      } else if (properties.operationType === 'spatialSelection') {
        handleSpatialSelectionHover(viewer, entity, properties as EntityProperties)
      } else if(properties.sourceType === 'satellite'){
        // console.log("entityPicked", entityPicked);
        const primitive = entityPicked.primitive
        const isSatelliteModel =
          primitive instanceof Cesium.Model ||
          primitive instanceof Cesium.ModelFeature

        if (!isSatelliteModel)return

        const time = viewer.value.clock.currentTime
        const pos = entity.position?.getValue(time)
        if (!pos) return
        const screenPosition = Cesium.SceneTransforms.worldToWindowCoordinates(
          viewer.value.scene,
          pos,
        )
        const cartographic = Cesium.Cartographic.fromCartesian(pos)
        const longitude=Cesium.Math.toDegrees(cartographic.longitude)
        const latitude=Cesium.Math.toDegrees(cartographic.latitude)
        const lngLatAlt:LngLatAlt={
          longitude,
          latitude,
          height:cartographic.height,
        }
        handleSatelliteHover(properties as SatelliteProperties, screenPosition,lngLatAlt, entity)
        clearHoveredEntityHighlight() // 有 satellite model hover 时清除 entity 高亮
      }
      return
    }

    // ✅ 什么都没拾取到
    // aviationBillboardLeave()
    // clearHoveredEntityHighlight()
    // emitCesiumEvent('satelliteLeave');
  }, 100,true,true)
  // }, 500,true,true)

  const aviationBillboardLeave=()=>{
    emitCesiumEvent('aircraftLeave');
    emitCesiumEvent('airportLeave');
  }

  // 销毁事件监听
  const destroyEvents = () => {
    if (handler) handler.destroy()
    handler = null
    // 清空所有 Cesium 交互事件订阅
    const eventNames: CesiumMouseEventName[] = [
      'aircraftHover', 'aircraftLeave', 'aircraftLeftClick',
      'airportHover', 'airportLeave', 'airportLeftClick',
      'satelliteHover', 'satelliteLeave', 'satelliteLeftClick',
      'mouseWheel'
    ]
    eventNames.forEach(name => mittBus.off(name))
  }

  let unwatchDrawingToolForm: () => void
  const setupDrawingToolWatch = (): void => {
    unwatchDrawingToolForm = watch(
      () => drawingToolStore.drawingToolForm,
      (newForm: DrawingToolForm, oldForm: DrawingToolForm) => {
        if (newForm.operationType != 'none'||(newForm.operationType==='spatialSelection'&&newForm.spatialSelectionSubtype!='none')) {
          mouseFollowPointLabelManager.setTempPointLabelVisibility(true)
        }else{
          mouseFollowPointLabelManager.setTempPointLabelVisibility(false)
          drawingToolStore.clearDrawingDataSource()
        }

        if (newForm.operationType === 'distanceMeasurement') {
          segmentDistanceLabelManager.setTempSegmentDistanceLabelVisibility(true)
          totalDistanceLabelManager.setTempTotalDistanceLabelVisibility(true)
        } else {
          segmentDistanceLabelManager.setTempSegmentDistanceLabelVisibility(false)
          totalDistanceLabelManager.setTempTotalDistanceLabelVisibility(false)
        }

        if (newForm.operationType === 'spatialSelection'&&newForm.spatialSelectionSubtype==='polygon') {
          perimeterAndAreaLabel.setTempPerimeterAndAreaLabelVisibility(true)
        }else{
          perimeterAndAreaLabel.setTempPerimeterAndAreaLabelVisibility(false)
        }
      },
      {
        deep: true,
      },
    )
  }

  onUnmounted(()=>{
    unwatchDrawingToolForm()
  })

  return { initEvents, destroyEvents }
}
