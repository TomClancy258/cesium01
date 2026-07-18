//src/views/aviation-situation/composables/cesium-events/useCesiumMouseEvents.ts
import * as Cesium from 'cesium'
import { useThrottleFn } from '@vueuse/core'
import mittBus, { CesiumMouseEventName } from '../mitt-bus'
import type { LngLatAlt, MapBillboardLabelProperties } from '../../types/shared'

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
} from '@/views/aviation-situation/composables/highlight-manager/drawing-tool-highlight-manager'
import { clearSelectedRegion } from '@/views/aviation-situation/composables/selection/useRegionSelectionActions'

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
  clearHoveredBillboardHighlight,
} from '@/views/aviation-situation/composables/highlight-manager/billboard-highlight-manager'
import {
  clearHoveredSatelliteHighlight,
} from '@/views/aviation-situation/composables/highlight-manager/satellite-highlight-manager'
import { clearSelectedAviation } from '@/views/aviation-situation/composables/selection/useAviationSelectionActions'
import {
  OSMBuildingHoveredProperties, OSMBuildingSelectedProperties
} from '@/views/aviation-situation/types/osm-building'
import {
  handleOSMBuildingHover, handleOSMBuildingLeftClick
} from '@/views/aviation-situation/composables/cesium-events/event-handlers/interaction/osm-building'
import {
  clearHoveredOSMBuildingHighlight, clearSelectedOSMBuildingHighlight
} from '@/views/aviation-situation/composables/highlight-manager/osm-building-highlight-manager'
import { ControlZoneProperties } from '@/network/control-zone/type'
import {
  handleControlZoneHover, handleControlZoneLeftClick
} from '@/views/aviation-situation/composables/cesium-events/event-handlers/interaction/control-zone'
import {
  clearHoveredControlZoneHighlight
} from '@/views/aviation-situation/composables/highlight-manager/control-zone-highlight-manager'
import {
  handlePhotogrammetryHover,
} from '@/views/aviation-situation/composables/cesium-events/event-handlers/interaction/photogrammetry'
import type { PhotogrammetryHoveredProperties } from '@/views/aviation-situation/types/photogrammetry'

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
        // 清空区域轨：测绘框选 / 管控区
        clearSelectedRegion()
        clearSelectedOSMBuildingHighlight()
        return
      }

      const satelliteModelPicked = findSatelliteModelPicked(pickedObjects)
      if (satelliteModelPicked) {
        const entity = satelliteModelPicked.id
        if (!(entity instanceof Cesium.Entity)) return

        const properties: SatelliteProperties | undefined = entity.properties?.getValue()
        if (!properties) return

        const pickResult = buildLngLatAltFromEntity(entity, viewer.value.clock.currentTime)
        if (!pickResult) return

        handleSatelliteLeftClick(properties, pickResult.lngLatAlt, entity)
        return
      }

      const billboardPicked = findBillboardPicked(pickedObjects)
      if (billboardPicked) {
        const billboard = billboardPicked.primitive
        if (!(billboard instanceof Cesium.Billboard)) return
        const properties: MapBillboardLabelProperties = billboard.properties

        if (properties.sourceType === 'aircraft' && properties.type === 'billboard') {
          handleAircraftLeftClick(properties, billboard)
        } else if (properties.sourceType === 'airport' && properties.type === 'billboard') {
          handleAirportLeftClick(properties, billboard)
        }
        return
      }

      const buildingPicked:Cesium.Cesium3DTileFeature = findOSMBuildingPicked(pickedObjects)
      if (buildingPicked) {
        const elementType = buildingPicked.getProperty('elementType')
        const elementId = buildingPicked.getProperty('elementId')
        // fail fast（早退）
        if (elementType === undefined || elementId === undefined) return

        const longitude = buildingPicked.getProperty('cesium#longitude')
        const latitude = buildingPicked.getProperty('cesium#latitude')
        if (longitude == undefined || latitude == undefined) return

        const properties: OSMBuildingSelectedProperties = {
          sourceType: 'osmBuilding',
          name: buildingPicked.getProperty('name') ?? '',

          elementType:elementType,
          elementId:elementId,

          type:{
            shop:buildingPicked.getProperty('shop')??'', //类型
            building:buildingPicked.getProperty('building')??'',  //类型，没有shop才采用这个
          },
          addr:{
            housenumber:buildingPicked.getProperty('addr:housenumber')??'',
            street:buildingPicked.getProperty('addr:street')??'',
            city :buildingPicked.getProperty('addr:city')??'',
            state:buildingPicked.getProperty('addr:state')??'',
          },
          estimatedHeight:buildingPicked.getProperty('cesium#estimatedHeight'),
          lngLatAlt:{
            longitude:longitude,
            latitude:latitude,
            height:0
          },

          business:{
            openingHours:buildingPicked.getProperty('opening_hours')??'',
            phone:buildingPicked.getProperty('phone')??'',
            website:buildingPicked.getProperty('website')??'',
          },

          extension:{
            atm:buildingPicked.getProperty('atm')??'',
            wheelchair:buildingPicked.getProperty('wheelchair')??'',
            internetAccess:buildingPicked.getProperty('internet_access')??'',
            checkDate:buildingPicked.getProperty('check_date')??'',
          }
        }

        handleOSMBuildingLeftClick(properties,buildingPicked)
        return
      }

      const drawingToolEntityPicked = findDrawingToolEntityPicked(pickedObjects)
      if (drawingToolEntityPicked) {
        const entity = drawingToolEntityPicked.id
        if (!(entity instanceof Cesium.Entity) || !entity.properties) return

        const properties: EntityProperties = entity.properties.getValue()
        handleSpatialSelectionLeftClick(viewer, entity, properties)
        return
      }

      const controlZoneEntityPicked = findControlZoneEntityPicked(pickedObjects)
      if (controlZoneEntityPicked) {
        const entity = controlZoneEntityPicked.id
        if (!(entity instanceof Cesium.Entity) || !entity.properties) return

        const properties: ControlZoneProperties = entity.properties.getValue()
        handleControlZoneLeftClick(properties,entity)
        return
      }

      clearSelectedAviation()
      clearSelectedRegion()
      clearSelectedOSMBuildingHighlight()

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

  const findSatelliteModelPicked = (pickedObjects: PickedObjectLike[]) =>
    pickedObjects.find((obj) => {
      if (!(obj.id instanceof Cesium.Entity)) return false
      const primitive = obj.primitive
      const isSatelliteModel =
        primitive instanceof Cesium.Model ||
        primitive instanceof Cesium.ModelFeature
      if (!isSatelliteModel) return false
      const properties: EntityProperties | SatelliteProperties | undefined = obj.id.properties?.getValue()
      return properties?.sourceType === 'satellite'
    })

  const findBillboardPicked = (pickedObjects: PickedObjectLike[]) =>
    pickedObjects.find((obj) => {
      if (!(obj.primitive instanceof Cesium.Billboard)) return false
      const properties = (obj.primitive as { properties?: MapBillboardLabelProperties }).properties
      return (
        !!properties &&
        properties.type === 'billboard' &&
        (properties.sourceType === 'aircraft' || properties.sourceType === 'airport')
      )
    })

  const findDrawingToolEntityPicked = (pickedObjects: PickedObjectLike[]) =>
    pickedObjects.find((obj) => {
      if (!(obj.id instanceof Cesium.Entity)) return false
      const properties: EntityProperties | undefined = obj.id.properties?.getValue()
      return (
        properties?.operationType === 'distanceMeasurement' ||
        properties?.operationType === 'spatialSelection'
      )
    })

  const getPickedTileset = (obj: PickedObjectLike): Cesium.Cesium3DTileset | null => {
    if (obj instanceof Cesium.Cesium3DTileFeature) {
      return obj.tileset
    }
    if (obj.primitive instanceof Cesium.Cesium3DTileset) {
      return obj.primitive
    }
    return null
  }

  const findOSMBuildingPicked = (pickedObjects: PickedObjectLike[]) =>
    pickedObjects.find((obj): obj is Cesium.Cesium3DTileFeature => {
      if (!(obj instanceof Cesium.Cesium3DTileFeature)) return false
      return obj.tileset.meta?.sourceType === 'osmBuilding'
    })

  const findPhotogrammetryPicked = (pickedObjects: PickedObjectLike[]) =>
    pickedObjects.find((obj) => getPickedTileset(obj)?.meta?.sourceType === 'photogrammetry')

  const findControlZoneEntityPicked = (pickedObjects: PickedObjectLike[]) =>
    pickedObjects.find((obj) => {
      if (!(obj.id instanceof Cesium.Entity)) return false
      const properties: EntityProperties | undefined = obj.id.properties?.getValue()
      return (
        properties?.sourceType === 'controlZone'
      )
    })

  const buildLngLatAltFromEntity = (
    entity: Cesium.Entity,
    time: Cesium.JulianDate,
  ): { lngLatAlt: LngLatAlt; position: Cesium.Cartesian3 } | null => {
    const position = entity.position?.getValue(time)
    if (!position) return null
    const cartographic = Cesium.Cartographic.fromCartesian(position)
    return {
      position,
      lngLatAlt: {
        longitude: Cesium.Math.toDegrees(cartographic.longitude),
        latitude: Cesium.Math.toDegrees(cartographic.latitude),
        height: cartographic.height,
      },
    }
  }

  const clearAllHovers = (): void => {
    aviationBillboardLeave()
    clearHoveredDrawingToolHighlight()
    satelliteLeave()
    osmBuildingLeave()
    photogrammetryLeave()
    controlZoneLeave()
  }

  // 鼠标移动（节流）
  const mouseMove = useThrottleFn((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent): void => {
    const pickedObjects = viewer.value.scene.drillPick(movement.endPosition, 5) as PickedObjectLike[]
    if (pickedObjects.length === 0) {
      clearAllHovers()
      return
    }

    const satelliteModelPicked = findSatelliteModelPicked(pickedObjects)
    if (satelliteModelPicked) {
      aviationBillboardLeave()
      clearHoveredDrawingToolHighlight()
      osmBuildingLeave()
      photogrammetryLeave()
      controlZoneLeave()

      const entity = satelliteModelPicked.id
      if (!(entity instanceof Cesium.Entity)) return

      const properties: SatelliteProperties | undefined = entity.properties?.getValue()
      if (!properties) return

      const pickResult = buildLngLatAltFromEntity(entity, viewer.value.clock.currentTime)
      if (!pickResult) return

      const screenPosition = Cesium.SceneTransforms.worldToWindowCoordinates(
        viewer.value.scene,
        pickResult.position,
      )
      if (!screenPosition) return

      handleSatelliteHover(properties, screenPosition, pickResult.lngLatAlt, entity)
      return
    }

    const billboardPicked = findBillboardPicked(pickedObjects)
    if (billboardPicked) {
      clearHoveredDrawingToolHighlight()
      satelliteLeave()
      osmBuildingLeave()
      photogrammetryLeave()
      controlZoneLeave()

      const billboard = billboardPicked.primitive
      if (!(billboard instanceof Cesium.Billboard)) return
      const properties: MapBillboardLabelProperties = billboard.properties
      const screenPosition = Cesium.SceneTransforms.worldToWindowCoordinates(
        viewer.value.scene,
        billboard.position,
      )
      if (!screenPosition) return

      if (properties.sourceType === 'aircraft' && properties.type === 'billboard') {
        handleAircraftHover(properties, screenPosition, billboard)
      } else if (properties.sourceType === 'airport' && properties.type === 'billboard') {
        handleAirportHover(properties, screenPosition, billboard)
      }
      return
    }

    const buildingPicked:Cesium.Cesium3DTileFeature = findOSMBuildingPicked(pickedObjects)
    if (buildingPicked) {
      aviationBillboardLeave()
      satelliteLeave()
      clearHoveredDrawingToolHighlight()
      photogrammetryLeave()
      controlZoneLeave()

      // const propertyIds = buildingPicked.getPropertyIds();
      // const length = propertyIds.length;
      // console.log('\n')
      // for (let i = 0; i < length; ++i) {
      //   const propertyId = propertyIds[i];
      //   console.log(`${propertyId}: ${buildingPicked.getProperty(propertyId)}`);
      // }
      // console.log('\n')

      const longitude = buildingPicked.getProperty('cesium#longitude')
      const latitude = buildingPicked.getProperty('cesium#latitude')
      if (longitude == undefined || latitude == undefined) return
      // console.log("buildingPicked", buildingPicked);
      const properties:OSMBuildingHoveredProperties={
        name:buildingPicked.getProperty('name')??'',

        type:{
          shop:buildingPicked.getProperty('shop')??'', //类型
          building:buildingPicked.getProperty('building')??'',  //类型，没有shop才采用这个
        },
        addr:{
          housenumber:buildingPicked.getProperty('addr:housenumber')??'',
          street:buildingPicked.getProperty('addr:street')??'',
          city :buildingPicked.getProperty('addr:city')??'',
          state:buildingPicked.getProperty('addr:state')??'',
        },
        estimatedHeight:buildingPicked.getProperty('cesium#estimatedHeight'),
        lngLatAlt:{
          longitude:longitude,
          latitude:latitude,
          height:0
        },
      }

      // console.log("typeof opening_hours", typeof buildingPicked.getProperty('opening_hours'));

      handleOSMBuildingHover(properties,movement.endPosition,buildingPicked)
      return
    }

    const photogrammetryPicked = findPhotogrammetryPicked(pickedObjects)
    if (photogrammetryPicked) {
      aviationBillboardLeave()
      satelliteLeave()
      clearHoveredDrawingToolHighlight()
      osmBuildingLeave()
      controlZoneLeave()

      const cartesian = viewer.value.scene.pickPosition(movement.endPosition)
      if (!Cesium.defined(cartesian)) return

      const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
      const properties: PhotogrammetryHoveredProperties = {
        sourceType: 'photogrammetry',
        lngLatAlt: {
          longitude: Cesium.Math.toDegrees(cartographic.longitude),
          latitude: Cesium.Math.toDegrees(cartographic.latitude),
          height: cartographic.height,
        },
      }

      handlePhotogrammetryHover(properties, movement.endPosition)
      return
    }


    const drawingToolEntityPicked = findDrawingToolEntityPicked(pickedObjects)
    if (drawingToolEntityPicked) {
      aviationBillboardLeave()
      satelliteLeave()
      osmBuildingLeave()
      photogrammetryLeave()
      controlZoneLeave()

      const entity = drawingToolEntityPicked.id
      if (!(entity instanceof Cesium.Entity) || !entity.properties) return

      const properties: EntityProperties = entity.properties.getValue()
      handleDrawingToolHover(viewer, entity, properties)
      return
    }

    const controlZoneEntityPicked = findControlZoneEntityPicked(pickedObjects)
    if (controlZoneEntityPicked) {
      aviationBillboardLeave()
      satelliteLeave()
      osmBuildingLeave()
      photogrammetryLeave()
      clearHoveredDrawingToolHighlight()

      const entity = controlZoneEntityPicked.id
      if (!(entity instanceof Cesium.Entity) || !entity.properties) return

      const properties: ControlZoneProperties = entity.properties.getValue()
      handleControlZoneHover(properties,movement.endPosition,entity)
      return
    }

    clearAllHovers()
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

  const osmBuildingLeave=()=>{
    clearHoveredOSMBuildingHighlight()
    emitCesiumEvent('osmBuildingLeave');
  }

  const photogrammetryLeave=()=>{
    emitCesiumEvent('photogrammetryLeave');
  }

  const controlZoneLeave=()=>{
    clearHoveredControlZoneHighlight()
    emitCesiumEvent('controlZoneLeave');
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
      'osmBuildingHover', 'osmBuildingLeave', 'osmBuildingLeftClick',
      'photogrammetryHover', 'photogrammetryLeave',
      'controlZoneHover', 'controlZoneLeave',
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
