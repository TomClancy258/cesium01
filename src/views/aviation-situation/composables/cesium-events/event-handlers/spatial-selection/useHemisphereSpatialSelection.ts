// src/views/aviation-situation/composables/cesium-events/event-handlers/spatial-selection/useHemisphereSpatialSelection.ts
import * as Cesium from 'cesium'
import { onUnmounted, ShallowRef, watch } from 'vue'
import {  useSpatialSelectionStore } from '@/stores/spatial-selection'
import { useAircraftStore } from '@/stores/aircraft'
import { useAirportStore } from '@/stores/airport'
import type { Aircraft } from '@/network/aircraft/types/aircraft'
import type { Airport } from '@/network/airport/type'
import { generateBizUniqueId } from '@/utils/uuid'
import type { TempPointLabelPosition } from '../shared/useMouseFollowPointLabel'
import { useKeyboardEvents } from '../useKeyboardEvents'
import {
  calculateAreaFromGraphic,
  calculatePerimeterFromGraphic,
  calculateSurfaceDistance,
  createCircleFromCenterAndRadius,
  formatArea,
  formatDistance,
} from '@/utils/geoUtils'
import {
  DrawingDataSource,
  LngLatAlt, LngLatAltArray,
  SpatialSelectionData,
  FinishedHemisphereSpatialSelectionData,
} from '@/views/aviation-situation/types/shared'
import {
  BOX_SELECTION_STYLE,
  TEMP_POINT_LABEL_STYLE,
  TEMP_TOTAL_LENGTH_LABEL_STYLE,
} from '@/views/aviation-situation/constants/cesium-style-constants'
import { cloneEntityAsConfig } from '@/utils/cesiumUtils'
import {buildSpatialSelectionLabelText} from "./shared/spatial-selection-label-utils"

import {type DrawingToolForm, useDrawingToolStore } from '@/stores/drawing-tool'
import { emitCesiumEvent, onCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import {
  emitSpatialSelectByTarget,
  emitClearSpatialSelectionByTarget,
} from '../shared/spatial-selection-event-emitters'
import { useSimulatedWebSocketStore } from '@/stores/simulate-websocket'

export interface PerimeterInfo {
  perimeter: number
  formattedPerimeterStr: string
}

export interface AreaInfo {
  area: number
  formattedAreaStr: string
}

export interface RadiusInfo {
  radius: number
  radii: Cesium.Cartesian3
  formattedRadiusStr: string
}

interface DynamicHemisphereState {
  lngLatAltArray: number[]
  pointCount: number
  perimeterInfo: PerimeterInfo
  areaInfo: AreaInfo
  radiusInfo: RadiusInfo
}

/** 单条距离测绘的完整结构 */
export interface HemisphereSpatialSelectionSession {
  dataSource: Cesium.CustomDataSource | null
  surveyPoints: Cesium.Entity[]
  segmentDistanceLabels: Cesium.Entity[]
  dynamicHemisphere: Cesium.Entity | null
}

/**
 * 创建线段长度Label的样式配置（仅Label，无Point）
 * @param positions 实体位置（静态坐标/CallbackProperty）
 * @returns Polyline样式配置
 */
const createDynamicHemisphereConfig = (
  radii: Cesium.Cartesian3 | Cesium.CallbackProperty,
  text: string | Cesium.CallbackProperty,
  position: Cesium.Cartesian3 | Cesium.CallbackProperty | null = null,
): Cesium.Entity.ConstructorOptions => {
  const baseConfig: Cesium.Entity.ConstructorOptions = {
    show: true,
    label: {
      font: TEMP_POINT_LABEL_STYLE.LABEL.FONT,
      outlineColor: TEMP_POINT_LABEL_STYLE.LABEL.OUTLINE_COLOR,
      outlineWidth: TEMP_POINT_LABEL_STYLE.LABEL.OUTLINE_WIDTH,
      style: TEMP_POINT_LABEL_STYLE.LABEL.STYLE,
      pixelOffset: TEMP_TOTAL_LENGTH_LABEL_STYLE.LABEL.PIXEL_OFFSET,
      heightReference: TEMP_POINT_LABEL_STYLE.LABEL.HEIGHT_REFERENCE,
      disableDepthTestDistance: Number.POSITIVE_INFINITY, // 补充防遮挡配置（常量里漏了的话）
    },
    point: {
      pixelSize: TEMP_POINT_LABEL_STYLE.POINT.PIXEL_SIZE,
      color: TEMP_POINT_LABEL_STYLE.POINT.COLOR,
      outlineColor: TEMP_POINT_LABEL_STYLE.POINT.OUTLINE_COLOR,
      outlineWidth: TEMP_POINT_LABEL_STYLE.POINT.OUTLINE_WIDTH,
      heightReference: TEMP_POINT_LABEL_STYLE.POINT.HEIGHT_REFERENCE,
    },
    ellipsoid: {
      radii: radii,
      material: BOX_SELECTION_STYLE.ELLIPSOID.MATERIAL,
      outline: BOX_SELECTION_STYLE.ELLIPSOID.OUTLINE,
      outlineColor: BOX_SELECTION_STYLE.ELLIPSOID.OUTLINE_COLOR,
      minimumCone: BOX_SELECTION_STYLE.ELLIPSOID.MINIMUM_CONE, // 顶部
      maximumCone: BOX_SELECTION_STYLE.ELLIPSOID.MAXIMUM_CONE, // 赤道，只保留上半球
      heightReference: BOX_SELECTION_STYLE.ELLIPSOID.HEIGHT_REFERENCE,
    },
  }
  // 动态/静态文本、位置单独赋值
  if (position) baseConfig.position = position
  if (text) baseConfig.label.text = text

  return baseConfig
}

export const useHemisphereSpatialSelection = (
  viewer: ShallowRef<Cesium.Viewer | null>,
  mouseFollowPointLabelManager,
) => {
  const drawingToolStore = useDrawingToolStore()
  const spatialSelectionStore = useSpatialSelectionStore()
  const aircraftStore = useAircraftStore()
  const airportStore = useAirportStore()
  const simulatedWebSocketStore = useSimulatedWebSocketStore()

  // const hemisphereEntities: Cesium.Entity[] = []
  // const hemisphereMap: Map<string, Cesium.Entity> = new Map<string, Cesium.Entity>()
  let dynamicHemisphere: Cesium.Entity | null = null

  let dynamicHemisphereState: DynamicHemisphereState = {
    lngLatAltArray: [],
    pointCount: 0,
    perimeterInfo: {
      perimeter: 0,
      formattedPerimeterStr: '',
    },
    areaInfo: {
      area: 0,
      formattedAreaStr: '',
    },
    radiusInfo: {
      radius: 0,
      radii: new Cesium.Cartesian3(0, 0, 0),
      formattedRadiusStr: '',
    },
  }

  const hemisphereSpatialSelection = (cartesian2: Cesium.Cartesian2): void => {
    const ray: Cesium.Ray = viewer.value.camera.getPickRay(cartesian2)
    const cartesian3: Cesium.Cartesian3 = viewer.value.scene.globe.pick(ray, viewer.value.scene)
    if (!cartesian3) {
      return
    }

    // 复用抽离后的更新逻辑
    mouseFollowPointLabelManager.updateTempPointLabel(cartesian3)

    updateDynamicHemisphere()
  }

  const updateDynamicHemisphere = () => {
    const lngLatAlt: LngLatAlt = mouseFollowPointLabelManager.tempPointLabel.position.lngLatAlt

    if (dynamicHemisphereState.pointCount === 1) {
      const lngLatAltArray = dynamicHemisphereState.lngLatAltArray

      lngLatAltArray[3] = lngLatAlt.longitude
      lngLatAltArray[4] = lngLatAlt.latitude
      lngLatAltArray[5] = lngLatAlt.height

      const startPoint = [lngLatAltArray[0], lngLatAltArray[1], lngLatAltArray[2]]
      const endPoint = [lngLatAltArray[3], lngLatAltArray[4], lngLatAltArray[5]]
      const radius = calculateSurfaceDistance(startPoint, endPoint)
      dynamicHemisphereState.radiusInfo.radius = radius
      dynamicHemisphereState.radiusInfo.radii.x = radius
      dynamicHemisphereState.radiusInfo.radii.y = radius
      dynamicHemisphereState.radiusInfo.radii.z = radius
      dynamicHemisphereState.radiusInfo.formattedRadiusStr = formatDistance(radius)

      const circle = createCircleFromCenterAndRadius(startPoint, radius)

      const perimeter = calculatePerimeterFromGraphic(circle)
      dynamicHemisphereState.perimeterInfo.perimeter = perimeter
      dynamicHemisphereState.perimeterInfo.formattedPerimeterStr = formatDistance(perimeter)

      const area = calculateAreaFromGraphic(circle)
      dynamicHemisphereState.areaInfo.area = area
      dynamicHemisphereState.areaInfo.formattedAreaStr = formatArea(area)

      emitActiveCircleSpatialSelect(startPoint, radius)
    }
  }

  let unsubAircraftFiltered: () => void

  const subscribeHemisphereSpatialSelectionEvents = () => {
    unsubAircraftFiltered = onCesiumEvent('aviationFiltered', () => {
      updateDynamicHemisphere()
    })
  }

  const confirmSurveyPoint = () => {
    if (dynamicHemisphereState.pointCount >= 2) {
      return
    }
    const position: TempPointLabelPosition = mouseFollowPointLabelManager.tempPointLabel.position
    const lngLatAlt: LngLatAlt = position.lngLatAlt
    const cartesian3: Cesium.Cartesian3 = position.cartesian3

    dynamicHemisphereState.lngLatAltArray.push(
      lngLatAlt.longitude,
      lngLatAlt.latitude,
      lngLatAlt.height,
    )
    dynamicHemisphereState.pointCount++

    if (dynamicHemisphereState.pointCount === 1) {
      dynamicHemisphere.position = cartesian3
    }
  }

  const initActiveHemisphereSpatialSelection = (): void => {
    const hemisphereUniqueId: string = generateBizUniqueId('activeHemisphereSpatialSelection')

    const drawingDataSourceData: DrawingDataSource = {
      name: hemisphereUniqueId,
    }
    drawingToolStore.setDrawingDataSource(drawingDataSourceData)

    // 2. 创建动态位置的CallbackProperty
    const radiiCallback: Cesium.CallbackProperty = new Cesium.CallbackProperty(() => {
      return dynamicHemisphereState.radiusInfo.radii
    }, false)
    // 2. 创建动态位置的CallbackProperty
    const textCallback: Cesium.CallbackProperty = new Cesium.CallbackProperty((): string => {
      const text = `周长：${dynamicHemisphereState.perimeterInfo.formattedPerimeterStr}\n面积：${dynamicHemisphereState.areaInfo.formattedAreaStr}\n半径：${dynamicHemisphereState.radiusInfo.formattedRadiusStr}`
      const drawingToolForm=drawingToolStore.drawingToolForm
      const activeSpatialSelection=spatialSelectionStore.activeSpatialSelection

      return buildSpatialSelectionLabelText(
        text,
        drawingToolForm.operationType,
        drawingToolForm.spatialSelectionTarget,
        activeSpatialSelection.aircraft.icao24Set.size,
        activeSpatialSelection.airport.icaoSet.size,
      )
    }, false)

    const hemisphereConfig: Cesium.Entity.ConstructorOptions = createDynamicHemisphereConfig(
      radiiCallback,
      textCallback,
    )
    // 4. 组装实体并添加
    dynamicHemisphere = viewer.value.entities.add({
      id: hemisphereUniqueId,
      properties: {
        operationType: 'spatialSelection',
        sourceType: 'hemisphereSpatialSelection',
        type: 'ellipsoid',
        dataSourceName: hemisphereUniqueId,
        label: {
          originalFillColor: hemisphereConfig.label?.fillColor,
        },
        ellipsoid: {
          originalMaterial: hemisphereConfig.ellipsoid?.material,
        },
        isDraft: true,
      },
      ...hemisphereConfig,
    })
  }

  const cloneDynamicHemisphereToDataSource = (dataSourceName: string) => {

    const hemisphereConfig: Cesium.Entity.ConstructorOptions = cloneEntityAsConfig(
      dynamicHemisphere,
      dataSourceName,
      viewer,
    )

    const drawingToolForm = drawingToolStore.drawingToolForm
    const activeSpatialSelection = spatialSelectionStore.activeSpatialSelection
    hemisphereConfig.label.text = `周长：${dynamicHemisphereState.perimeterInfo.formattedPerimeterStr}\n面积：${dynamicHemisphereState.areaInfo.formattedAreaStr}\n半径：${dynamicHemisphereState.radiusInfo.formattedRadiusStr}`
    hemisphereConfig.label.text=buildSpatialSelectionLabelText(
      hemisphereConfig.label.text,
      drawingToolForm.operationType,
      drawingToolForm.spatialSelectionTarget,
      activeSpatialSelection.aircraft.icao24Set.size,
      activeSpatialSelection.airport.icaoSet.size,
    )

    const radius = dynamicHemisphereState.radiusInfo.radius
    hemisphereConfig.ellipsoid.radii = new Cesium.Cartesian3(radius, radius, radius)

    // const originalFillColor=hemisphereConfig.properties.label.originalFillColor

    // hemisphereConfig.show=false
    hemisphereConfig.point.show = false
    hemisphereConfig.label.show = false

    // hemisphereConfig.label.fillColor=Cesium.Color.TRANSPARENT

    hemisphereConfig.properties.label.perimeterInfo={...dynamicHemisphereState.perimeterInfo}
    hemisphereConfig.properties.label.areaInfo={...dynamicHemisphereState.areaInfo}
    hemisphereConfig.properties.label.radiusInfo={
      radius:radius,
      formattedRadiusStr:dynamicHemisphereState.radiusInfo.formattedRadiusStr,
    }
    hemisphereConfig.properties.isDraft=true

    // 4. 组装实体并添加
    const entity = viewer.value.entities.add({
      id: dataSourceName,
      ...hemisphereConfig, // 复用通用样式，消除重复代码
    })

    // hemisphereEntities.push(entity)
    // hemisphereMap.set(dataSourceName, entity)
  }

  /**
   * 重置计划轨迹
   */
  const resetDynamicHemisphereState = (): void => {
    dynamicHemisphereState = {
      lngLatAltArray: [],
      pointCount: 0,
      perimeterInfo: {
        perimeter: 0,
        formattedPerimeterStr: '',
      },
      areaInfo: {
        area: 0,
        formattedAreaStr: '',
      },
      radiusInfo: {
        radius: 0,
        radii: new Cesium.Cartesian3(0, 0, 0),
        formattedRadiusStr: '',
      },
    }
  }

  const resetHemisphereSpatialSelectionSession = () => {
    viewer.value?.entities.remove(dynamicHemisphere)
    resetDynamicHemisphereState()
  }

  let unwatchDrawingToolForm: () => void
  let unwatchSimulatedWebSocketStore: () => void
  const setupDrawingToolWatch = (): void => {
    unwatchDrawingToolForm = watch(
      () => drawingToolStore.drawingToolForm,
      (newForm: DrawingToolForm, oldForm: DrawingToolForm) => {
        if (
          newForm.operationType === 'spatialSelection' &&
          newForm.spatialSelectionSubtype === 'hemisphere'
        ) {
          resetHemisphereSpatialSelectionSession()
          initActiveHemisphereSpatialSelection()
        } else {
          resetHemisphereSpatialSelectionSession()
          emitCesiumEvent('clearAircraftSpatialSelection')
          emitCesiumEvent('clearAirportSpatialSelection')
        }
      },
      {
        deep: true,
      },
    )

    unwatchSimulatedWebSocketStore = watch(
      () => simulatedWebSocketStore.index,
      (newIndex: number, oldIndex: number) => {
        if (dynamicHemisphereState.pointCount === 2) {
          const lngLatAltArray = dynamicHemisphereState.lngLatAltArray

          const startPoint = [lngLatAltArray[0], lngLatAltArray[1], lngLatAltArray[2]]
          const endPoint = [lngLatAltArray[3], lngLatAltArray[4], lngLatAltArray[5]]
          const radius = calculateSurfaceDistance(startPoint, endPoint)
          emitActiveCircleSpatialSelect(startPoint, radius)
        }
      },
    )
  }

  const emitActiveCircleSpatialSelect = (startPoint: number[], radius: number): void => {
    const spatialSelectionTarget: string =
      drawingToolStore.drawingToolForm.spatialSelectionTarget
    const spatialSelectionData: SpatialSelectionData = {
      dataSourceName: dynamicHemisphere.id,
      sourceType: 'hemisphereSpatialSelection',
      type: 'ellipsoid',
      label: {
        radiusInfo: {
          radius: radius,
        },
      },
      centerLngLatAltArray: startPoint,
      isActive: true,
    }
    emitSpatialSelectByTarget(spatialSelectionTarget, spatialSelectionData)
  }

  const finishHemisphereSpatialSelection = (): void => {
    if (dynamicHemisphereState.pointCount <= 1) {
      return
    }

    const uniqueId: string = generateBizUniqueId('hemisphereSpatialSelectionHemisphere')
    cloneDynamicHemisphereToDataSource(uniqueId) //多边形，存放在dataSource.entities里的index=0的位置

    const lngLatAltArray = dynamicHemisphereState.lngLatAltArray
    const centerLngLatAltArray: LngLatAltArray = [lngLatAltArray[0], lngLatAltArray[1], lngLatAltArray[2]]

    // const hemisphere:turf.Feature<turf.Polygon>=createCircleFromCenterAndRadius(centerLngLatAltArray,dynamicHemisphereState.radiusInfo.radius)

    const spatialSelectionTarget: string =
      drawingToolStore.drawingToolForm.spatialSelectionTarget

    const spatialSelectionData: FinishedHemisphereSpatialSelectionData = {
      dataSourceName: uniqueId,
      sourceType: 'hemisphereSpatialSelection',
      type: 'ellipsoid',
      // graphic:hemisphere,
      isActive: false,
      isDraft: true,
      centroidLngLatAlt: {
        longitude: lngLatAltArray[0],
        latitude: lngLatAltArray[1],
        height: lngLatAltArray[2],
      },
      centerLngLatAltArray: centerLngLatAltArray,
      aircraft: {
        aircraftMap: (() => {
          const map = new Map<string, Aircraft>()
          for (const icao24 of spatialSelectionStore.activeSpatialSelection.aircraft.icao24Set) {
            const aircraft = aircraftStore.matchedAircrafts.get(icao24)
            if (aircraft) map.set(icao24, aircraft)
          }
          return map
        })()
      },
      airport: {
        airportMap: (() => {
          const map = new Map<string, Airport>()
          for (const icao of spatialSelectionStore.activeSpatialSelection.airport.icaoSet) {
            const airport = airportStore.matchedAirports.get(icao)
            if (airport) map.set(icao, airport)
          }
          return map
        })()
      },
      spatialSelectionTarget: drawingToolStore.drawingToolForm.spatialSelectionTarget,
      label: {
        perimeterInfo: {
          perimeter: dynamicHemisphereState.perimeterInfo.perimeter,
          formattedPerimeterStr: dynamicHemisphereState.perimeterInfo.formattedPerimeterStr,
        },
        areaInfo: {
          area: dynamicHemisphereState.areaInfo.area,
          formattedAreaStr: dynamicHemisphereState.areaInfo.formattedAreaStr,
        },
        radiusInfo: {
          radius: dynamicHemisphereState.radiusInfo.radius,
          formattedRadiusStr: dynamicHemisphereState.radiusInfo.formattedRadiusStr,
        },
      },
    }
    emitSpatialSelectByTarget(spatialSelectionTarget, spatialSelectionData)
    emitClearSpatialSelectionByTarget(spatialSelectionTarget, { isActive: true })

    drawingToolStore.setOperationType('none')
    spatialSelectionStore.clearActiveAviationSpatialSelection()
  }

  const handleEsc = () => {
    console.log('ESC pressed - Resetting distance surveying')

    const spatialSelectionTarget: string =
      drawingToolStore.drawingToolForm.spatialSelectionTarget

    emitClearSpatialSelectionByTarget(spatialSelectionTarget, { isActive: true })

    drawingToolStore.setOperationType('none')
  }

  const handleBackspace = () => {
    console.log('Backspace pressed - Removing last point')

    // 回退最后一个坐标点
    if (dynamicHemisphereState.pointCount === 2) {
      dynamicHemisphereState.lngLatAltArray.splice((dynamicHemisphereState.pointCount - 1) * 3, 3)
      dynamicHemisphereState.pointCount--

      updateDynamicHemisphere()
    }
    // if (dynamicHemisphereState.pointCount === 1) {
    //   const spatialSelectionTarget:string=drawingToolStore.drawingToolForm.spatialSelectionTarget
    //
    //   emitCesiumEvent('clearAviationSpatialSelection')
    // }
  }

  // 仅在距离测绘模式下监听键盘事件
  const { unbindKeyboardEvents } = useKeyboardEvents(
    handleEsc,
    handleBackspace,
    () =>
      drawingToolStore.drawingToolForm.operationType === 'spatialSelection' &&
      drawingToolStore.drawingToolForm.spatialSelectionSubtype === 'hemisphere',
  )

  onUnmounted(() => {
    unwatchDrawingToolForm?.()
    unwatchSimulatedWebSocketStore?.()
    unbindKeyboardEvents()
    unsubAircraftFiltered()
  })

  return {
    hemisphereSpatialSelection,
    confirmSurveyPoint,
    setupDrawingToolWatch,
    finishHemisphereSpatialSelection,
    subscribeHemisphereSpatialSelectionEvents,
  }
}
