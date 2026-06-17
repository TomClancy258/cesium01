//src/views/aviation-situation/composables/cesium-events/useCesiumMouseEvents.ts
import * as Cesium from 'cesium'
import { useThrottleFn,useDebounceFn, } from '@vueuse/core'
import mittBus, { CesiumMouseEventName } from '../mitt-bus'
import type { LngLatAlt, MapBillboardLabelProperties } from '../../types/shared'
import { AircraftBillboardProperties } from '@/views/aviation-situation/types/aircraft'

import {handleAircraftHover,handleAircraftLeftClick} from "./event-handlers/interaction/aircraft"
import {handleAirportHover,handleAirportLeftClick} from "./event-handlers/interaction/airport"
import {
  handleDrawingToolHover,
  handleSpatialSelectionLeftClick
} from './event-handlers/interaction/spatial-selection'

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
  clearHoveredDrawingToolHighlight,
  clearSelectedDrawingToolHighlight
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
  clearHoveredBillboardHighlight, clearSelectedBillboardHighlight
} from '@/views/aviation-situation/composables/highlight-manager/billboard-highlight-manager'
import {
  clearHoveredSatelliteHighlight, clearSelectedSatelliteHighlight
} from '@/views/aviation-situation/composables/highlight-manager/satellite-highlight-manager'
import { clearSelectedAviation } from '@/views/aviation-situation/composables/selection/useAviationSelectionActions'
import { AirportBillboardProperties } from '@/views/aviation-situation/types/airport'

type PickedObjectLike = {
  id?: unknown
  primitive?: unknown
}

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
    onAviationDataUpdated:onPolygonAviationDataUpdated,
  }=usePolygonSpatialSelection(viewer,mouseFollowPointLabelManager,perimeterAndAreaLabel)

  const {
    circleSpatialSelection,
    confirmSurveyPoint:confirmCircleSpatialSelectionSurveyPoint,
    setupDrawingToolWatch:setupCircleSpatialSelectionSpatialFormWatch,
    finishCircleSpatialSelection,
    onAviationDataUpdated:onCircleAviationDataUpdated,
  }=useCircleSpatialSelection(viewer,mouseFollowPointLabelManager,perimeterAndAreaLabel)

  const {
    hemisphereSpatialSelection,
    confirmSurveyPoint:confirmHemisphereSpatialSelectionSurveyPoint,
    setupDrawingToolWatch:setupHemisphereSpatialSelectionSpatialFormWatch,
    finishHemisphereSpatialSelection,
    onAviationDataUpdated:onHemisphereAviationDataUpdated,
  }=useHemisphereSpatialSelection(viewer,mouseFollowPointLabelManager,perimeterAndAreaLabel)

  const refreshActiveSpatialSelections = () => {
    onPolygonAviationDataUpdated()
    onCircleAviationDataUpdated()
    onHemisphereAviationDataUpdated()
  }

  const initEvents = () => {
    if (!viewer?.value) return
    mouseFollowPointLabelManager.addTempPointLabelToViewer()
    segmentDistanceLabelManager.addTempSegmentDistanceLabelToViewer()
    totalDistanceLabelManager.addTempTotalDistanceLabelToViewer()
    perimeterAndAreaLabel.addTempPerimeterAndAreaLabelToViewer()

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
      const pickedObjects = viewer.value.scene.drillPick(click.position, 5) as PickedObjectLike[]

      if (pickedObjects.length === 0) {
        //清空上一次点击选中高亮的飞机、机场或者卫星实体
        clearSelectedAviation()
        //清空上一次点击选中高亮的测绘框选图形（距离测绘，多边形、圆形、半球测绘框选）
        clearSelectedDrawingTool()
        return
      }

      // ✅ 优先处理卫星 model（Entity + Model/ModelFeature）
      const satelliteModelPicked = pickedObjects.find((obj) => {
        if (!(obj.id instanceof Cesium.Entity)) return false
        const primitive = obj.primitive
        const isSatelliteModel =
          primitive instanceof Cesium.Model ||
          primitive instanceof Cesium.ModelFeature
        if (!isSatelliteModel) return false
        const properties = obj.id.properties?.getValue() as EntityProperties | undefined
        return properties?.sourceType === 'satellite'
      })
      if (satelliteModelPicked) {
        const entity = satelliteModelPicked.id
        if (!(entity instanceof Cesium.Entity)) return
        const properties = entity.properties?.getValue() as EntityProperties | undefined
        if (properties?.sourceType === 'satellite') {
          const time = viewer.value.clock.currentTime
          const position = entity.position?.getValue(time)
          if (position) {
            const cartographic = Cesium.Cartographic.fromCartesian(position)
            const longitude = Cesium.Math.toDegrees(cartographic.longitude)
            const latitude = Cesium.Math.toDegrees(cartographic.latitude)
            const lngLatAlt: LngLatAlt = {
              longitude,
              latitude,
              height: cartographic.height,
            }
            //aviationSelectionStore.setSelected(satelliteProperties)+
            //satellite-highlight-manager.ts里设置高亮hoveredSatellite
            handleSatelliteLeftClick(properties as unknown as SatelliteProperties, lngLatAlt, entity)
            //只清空billboard-highlight-manager.ts里的上次select（若有选中）的飞机、机场billboard
            clearSelectedBillboardHighlight()
            return
          }
        }
      }

      // ✅ 优先处理 Billboard（飞机/机场）
      const billboardPicked = pickedObjects.find((obj) => {
        if (!(obj.primitive instanceof Cesium.Billboard)) return false
        const properties = (obj.primitive as any).properties as MapBillboardLabelProperties | undefined
        return (
          !!properties &&
          properties.type === 'billboard' &&
          (properties.sourceType === 'aircraft' || properties.sourceType === 'airport')
        )
      })
      if (billboardPicked) {
        const billboard = billboardPicked.primitive
        if (!(billboard instanceof Cesium.Billboard)) return
        const properties = (billboard as any).properties as MapBillboardLabelProperties
        console.log("properties", properties);
        if (properties.sourceType === 'aircraft') {
          handleAircraftLeftClick(properties, billboard)
          clearSelectedSatelliteHighlight()
        } else if (properties.sourceType === 'airport') {
          handleAirportLeftClick(properties, billboard)
          clearSelectedSatelliteHighlight()
        } else {
          //清空上一次点击选中高亮的飞机、机场或者卫星实体
          clearSelectedAviation()
        }
        return
      }

      // ✅ 没有 Billboard，处理 Entity（半球/多边形等）
      const entityPicked = pickedObjects.find(
        obj => obj.id instanceof Cesium.Entity
      )
      if (entityPicked) {
        const entity = entityPicked.id
        if (!(entity instanceof Cesium.Entity)) return
        if (!entity.properties) return

        const properties = entity.properties.getValue() as EntityProperties
        console.log("properties", properties);
        if (properties.operationType === 'distanceMeasurement') {
          handleSpatialSelectionLeftClick(viewer, entity, properties)
        } else if (properties.operationType === 'spatialSelection') {
          handleSpatialSelectionLeftClick(viewer, entity, properties)
        } else {
          clearSelectedDrawingTool()
        }
        return
      }

      // ✅ drillPick 有结果但都不是我们关心的类型
      clearSelectedAviation()
      clearSelectedDrawingTool()

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
    const pickedObjects = viewer.value.scene.drillPick(movement.endPosition, 5) as PickedObjectLike[]
    if (pickedObjects.length === 0) {
      //恢复并清空billboard-highlight-manager.ts里上一次hover高亮的飞机或机场billboard
      //清空aviation-selection.ts里useAviationSelectionStore.clearHovered()
      aviationBillboardLeave()

      //只清空drawing-tool-highlight-manager.ts里的上次高亮的测绘框选图形
      //因为我没有像飞机、机场、卫星那样在ts里useAviationSelectionStore.ts里保存当前hover的测绘框选图形信息
      clearHoveredDrawingToolHighlight()

      //同理aviationBillboardLeave
      satelliteLeave()
      return
    }

    // ✅ 优先处理卫星 model（Entity + Model/ModelFeature）
    const satelliteModelPicked = pickedObjects.find((obj) => {
      if (!(obj.id instanceof Cesium.Entity)) return false
      const primitive = obj.primitive
      const isSatelliteModel =
        primitive instanceof Cesium.Model ||
        primitive instanceof Cesium.ModelFeature
      if (!isSatelliteModel) return false
      const properties = obj.id.properties?.getValue() as EntityProperties | SatelliteProperties | undefined
      return properties?.sourceType === 'satellite'
    })
    if (satelliteModelPicked) {
      // hover 互斥：清其它域的 hover（manager + store 由 leave 处理）
      aviationBillboardLeave()
      clearHoveredDrawingToolHighlight()

      const entity = satelliteModelPicked.id
      if (!(entity instanceof Cesium.Entity)) return

      const properties = entity.properties?.getValue() as SatelliteProperties | undefined
      if (!properties) return

      const time = viewer.value.clock.currentTime
      const pos = entity.position?.getValue(time)
      if (!pos) return

      const screenPosition = Cesium.SceneTransforms.worldToWindowCoordinates(
        viewer.value.scene,
        pos,
      )
      if (!screenPosition) return

      const cartographic = Cesium.Cartographic.fromCartesian(pos)
      const lngLatAlt: LngLatAlt = {
        longitude: Cesium.Math.toDegrees(cartographic.longitude),
        latitude: Cesium.Math.toDegrees(cartographic.latitude),
        height: cartographic.height,
      }

      handleSatelliteHover(properties, screenPosition, lngLatAlt, entity)
      return
    }

    // ✅ 优先找 Billboard（飞机/机场图标）
    const billboardPicked = pickedObjects.find((obj) => {
      if (!(obj.primitive instanceof Cesium.Billboard)) return false
      const properties = (obj.primitive as any).properties as MapBillboardLabelProperties | undefined
      return (
        !!properties &&
        properties.type === 'billboard' &&
        (properties.sourceType === 'aircraft' || properties.sourceType === 'airport')
      )
    })
    if (billboardPicked) {
      //清空manager里测绘框选的hover高亮，无store里存储高亮图形信息
      clearHoveredDrawingToolHighlight()
      //清空store（卫星和飞机、机场的hover和select高亮共用）和manager（不共用）里卫星的hover高亮
      satelliteLeave()

      const billboard = billboardPicked.primitive
      if (!(billboard instanceof Cesium.Billboard)) return
      const properties = (billboard as any).properties as MapBillboardLabelProperties
      const position: Cesium.Cartesian3 = billboard.position
      const screenPosition: Cesium.Cartesian2 =
        Cesium.SceneTransforms.worldToWindowCoordinates(viewer.value.scene, position)
      if (!screenPosition) return

      if (properties.sourceType === 'aircraft') {
        handleAircraftHover(properties as AircraftBillboardProperties, screenPosition, billboard)
      } else if (properties.sourceType === 'airport') {
        handleAirportHover(properties as AirportBillboardProperties, screenPosition, billboard)
      }
      return
    }

    // ✅ 没有 Billboard，再处理 Entity（半球/多边形等）
    // useCesiumMouseEvents
    const drawingToolEntityPicked = pickedObjects.find((obj) => {
      if (!(obj.id instanceof Cesium.Entity)) return false
      const properties = obj.id.properties?.getValue() as EntityProperties | undefined
      return (
        properties?.operationType === 'distanceMeasurement' ||
        properties?.operationType === 'spatialSelection'
      )
    })

    if (drawingToolEntityPicked) {
      aviationBillboardLeave()
      satelliteLeave()

      const entity = drawingToolEntityPicked.id
      if (!(entity instanceof Cesium.Entity) || !entity.properties) return

      const properties = entity.properties.getValue() as EntityProperties
      handleDrawingToolHover(viewer, entity, properties)  // 或 rename → handleDrawingToolHover
      return
    }

    // ✅ 什么都没拾取到
    // aviationBillboardLeave()
    // clearHoveredDrawingToolHighlight()
    // emitCesiumEvent('satelliteLeave');
  }, 100,true,true)
  // }, 500,true,true)

  const aviationBillboardLeave=()=>{
    emitCesiumEvent('aircraftLeave');
    emitCesiumEvent('airportLeave');
    clearHoveredBillboardHighlight()
  }

  const satelliteLeave=()=>{
    clearHoveredSatelliteHighlight()
    emitCesiumEvent('satelliteLeave');
  }

  const clearSelectedDrawingTool=()=>{
    drawingToolStore.clearSelected()
    clearSelectedDrawingToolHighlight()
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

  return { initEvents, destroyEvents, refreshActiveSpatialSelections }
}
