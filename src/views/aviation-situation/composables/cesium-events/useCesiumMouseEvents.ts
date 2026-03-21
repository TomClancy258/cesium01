//src/views/aviation-situation/composables/cesium-events/useCesiumMouseEvents.ts
import * as Cesium from 'cesium'
import { useThrottleFn } from '@vueuse/core'
import mittBus, { CesiumMouseEventName } from '../mittBus'
import type { MapBillboardLabelProperties } from "../../types/shared"
import { AircraftBillboardProperties } from '@/views/aviation-situation/types/aircraft'

import {handleAircraftHover,handleAircraftLeftClick} from "./event-handlers/interaction/aircraft"
import {handleAirportHover,handleAirportLeftClick} from "./event-handlers/interaction/airport"
import {
  handleSpatialSelectionHover,
  handleSpatialSelectionLeftClick
} from './event-handlers/interaction/spatial-selection'

import { SpatialSelectForm, useSpatialSelectStore } from '@/stores/spatialSelect'
const spatialSelectStore=useSpatialSelectStore()

import {useAviationSelectionStore} from "@/stores/aviationSelection"
const aviationSelectionStore=useAviationSelectionStore()

import {
  useDistanceMeasurement,
} from "./event-handlers/useDistanceMeasurement"
import {
  usePolygonSpatialSelection,
} from "./event-handlers/spatial-selection/usePolygonSpatialSelection.ts"
import {
  useCircleSpatialSelection,
} from "./event-handlers/spatial-selection/circle/useCircleSpatialSelection.ts"

import { ShallowRef } from 'cesium'
import { EntityProperties } from '@/views/aviation-situation/types/entity'
import {
  clearHoveredEntityHighlight,
  clearSelectedEntityHighlight
} from '@/views/aviation-situation/composables/useEntityHighlightManager'

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

import { useMeasurementSelectionStore } from '@/stores/measurementSelection'
import { emitCesiumEvent } from '@/views/aviation-situation/composables/mittBus'

// 初始化 Cesium 事件监听（核心逻辑不变，仅替换事件发布方式）
export const useCesiumMouseEvents = (viewer: ShallowRef<Cesium.Viewer | null>) => {
  const measurementSelectionStore=useMeasurementSelectionStore()

  let handler: Cesium.ScreenSpaceEventHandler | null = null
  const mouseFollowPointLabelManager = useMouseFollowPointLabel(viewer);
  const segmentDistanceLabelManager = useTempSegmentDistanceLabel(viewer);
  const totalDistanceLabelManager = useTempTotalDistanceLabel(viewer);
  const perimeterAndAreaLabel = useTempPerimeterAndAreaLabel(viewer);

  const {
    distanceMeasurement,
    confirmSurveyPoint:confirmDistanceSurveySurveyPoint,
    setupSpatialSelectFormWatch:setupDistanceSurveySpatialFormWatch,
    finishDistanceSurvey,
  }=useDistanceMeasurement(viewer,mouseFollowPointLabelManager,segmentDistanceLabelManager,totalDistanceLabelManager)

  const {
    polygonSpatialSelection,
    confirmSurveyPoint:confirmPolygonSpatialSelectionSurveyPoint,
    setupSpatialSelectFormWatch:setupPolygonSpatialSelectionSpatialFormWatch,
    finishPolygonSpatialSelection,
    subscribePolygonSpatialSelectionEvents,
  }=usePolygonSpatialSelection(viewer,mouseFollowPointLabelManager,perimeterAndAreaLabel)

  const {
    circleSpatialSelection,
    confirmSurveyPoint:confirmCircleSpatialSelectionSurveyPoint,
    setupSpatialSelectFormWatch:setupCircleSpatialSelectionSpatialFormWatch,
    finishCircleSpatialSelection,
    subscribeCircleSpatialSelectionEvents,
  }=useCircleSpatialSelection(viewer,mouseFollowPointLabelManager,perimeterAndAreaLabel)

  const initEvents = () => {
    if (!viewer?.value) return
    mouseFollowPointLabelManager.addTempPointLabelToViewer()
    segmentDistanceLabelManager.addTempSegmentDistanceLabelToViewer()
    totalDistanceLabelManager.addTempTotalDistanceLabelToViewer()
    perimeterAndAreaLabel.addTempPerimeterAndAreaLabelToViewer()

    subscribePolygonSpatialSelectionEvents()

    // 销毁已有 handler
    if (handler) handler.destroy()
    handler = new Cesium.ScreenSpaceEventHandler(viewer.value.scene.canvas)

    // 鼠标移动
    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      // console.log("MOUSE_MOVE");
      if(spatialSelectStore.spatialSelectForm.operationType==='distanceMeasurement'){
        distanceMeasurement(movement.endPosition)
      }else if(spatialSelectStore.spatialSelectForm.operationType==='spatialSelection'&&spatialSelectStore.spatialSelectForm.spatialSelectionSubtype==='polygon'){
        polygonSpatialSelection(movement.endPosition)
      }else if(spatialSelectStore.spatialSelectForm.operationType==='spatialSelection'&&spatialSelectStore.spatialSelectForm.spatialSelectionSubtype==='circle'){
        circleSpatialSelection(movement.endPosition)
      }
      mouseMove(movement)
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    // 左键点击
    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.ClickEvent) => {
      const pickedObject = viewer.value.scene.pick(click.position)
      if (Cesium.defined(pickedObject) && pickedObject.id) {
        if(pickedObject.id instanceof Cesium.Entity){
          if(spatialSelectStore.spatialSelectForm.operationType==='distanceMeasurement'){
            confirmDistanceSurveySurveyPoint()
          }
          if(spatialSelectStore.spatialSelectForm.operationType==='spatialSelection'){
            if(spatialSelectStore.spatialSelectForm.spatialSelectionSubtype==='polygon'){
              confirmPolygonSpatialSelectionSurveyPoint()
            }else if(spatialSelectStore.spatialSelectForm.spatialSelectionSubtype==='circle'){
              confirmCircleSpatialSelectionSurveyPoint()
            }
          }
          const entity: Cesium.Entity = pickedObject.id
          if (!entity.properties) {
            return
          }

          const properties = entity.properties.getValue() as EntityProperties
          if(properties.operationType==='distanceMeasurement') {
            handleSpatialSelectionLeftClick(viewer,entity,properties)
          }else if(properties.operationType==='spatialSelection'){
            // if(properties.sourceType==='polygonSpatialSelection'){
              handleSpatialSelectionLeftClick(viewer,entity,properties)
            // }
          }else{
            measurementSelectionStore.clearSelected()
            clearSelectedEntityHighlight()
          }

        }else if (pickedObject.primitive instanceof Cesium.Billboard) {
          const properties = pickedObject.primitive.properties as MapBillboardLabelProperties
          if (properties.type !== 'billboard') return
          if (properties.sourceType === 'aircraft') {
            handleAircraftLeftClick(properties, pickedObject)
          } else if (properties.sourceType === 'airport') {
            handleAirportLeftClick(properties, pickedObject)
          }else{
            aviationSelectionStore.clearSelected()
            aviationSelectionStore.clearLastSelectedIcao24()
          }
        }
      }else{
        aviationSelectionStore.clearSelected()
        aviationSelectionStore.clearLastSelectedIcao24()

        measurementSelectionStore.clearSelected()
        clearSelectedEntityHighlight()
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    // 右键点击
    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.ClickEvent) => {
      if(spatialSelectStore.spatialSelectForm.operationType==='distanceMeasurement'){
        finishDistanceSurvey()
      }else if(spatialSelectStore.spatialSelectForm.operationType==='spatialSelection'){
        if(spatialSelectStore.spatialSelectForm.spatialSelectionSubtype==='polygon'){
          finishPolygonSpatialSelection()
        }else if(spatialSelectStore.spatialSelectForm.spatialSelectionSubtype==='circle'){
          finishCircleSpatialSelection()
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

    setupSpatialSelectFormWatch()
    setupDistanceSurveySpatialFormWatch()
    setupPolygonSpatialSelectionSpatialFormWatch()
    setupCircleSpatialSelectionSpatialFormWatch()
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
        if (!entity.properties) {
          return
        }
        const properties = entity.properties.getValue() as EntityProperties
        if(properties.operationType==='distanceMeasurement') {
          handleSpatialSelectionHover(viewer,entity,properties)
        }else if(properties.operationType==='spatialSelection'){
          // if(properties.sourceType==='polygonSpatialSelection') {
            handleSpatialSelectionHover(viewer,entity,properties)
          // }
        }
        aviationBillboardLeave()
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
      aviationBillboardLeave()

      clearHoveredEntityHighlight()
    }
  }, 100)

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
      'airportHover', 'airportLeave', 'airportLeftClick', 'mouseWheel'
    ]
    eventNames.forEach(name => mittBus.off(name))
  }

  let unwatchSpatialSelectForm: () => void
  const setupSpatialSelectFormWatch = (): void => {
    unwatchSpatialSelectForm = watch(
      () => spatialSelectStore.spatialSelectForm,
      (newForm: SpatialSelectForm, oldForm: SpatialSelectForm) => {
        if (newForm.operationType != 'none'||(newForm.operationType==='spatialSelection'&&newForm.spatialSelectionSubtype!='none')) {
          mouseFollowPointLabelManager.setTempPointLabelVisibility(true)
        }else{
          mouseFollowPointLabelManager.setTempPointLabelVisibility(false)
          measurementSelectionStore.clearDrawingDataSource()
        }

        if (newForm.operationType === 'distanceMeasurement') {
          segmentDistanceLabelManager.setTempSegmentDistanceLabelVisibility(true)
          totalDistanceLabelManager.setTempTotalDistanceLabelVisibility(true)
        } else {
          segmentDistanceLabelManager.setTempSegmentDistanceLabelVisibility(false)
          totalDistanceLabelManager.setTempTotalDistanceLabelVisibility(false)
        }

        if (newForm.operationType === 'spatialSelection'&&newForm.spatialSelectionSubtype!='none'&&newForm.spatialSelectionSubtype!='circle') {
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
    unwatchSpatialSelectForm()
  })

  return { initEvents, destroyEvents }
}
