//src/views/aviation-situation/composables/aircraft/useAircrafts.ts
import { watch, onUnmounted } from 'vue'
import type { ShallowRef } from 'vue'
import * as Cesium from 'cesium'
import { useCesiumCameraEvent } from '../cesium-events/cesium-camera-events'
import type { Aircraft } from '@/network/aircraft/types/aircraft'
import type {
  AircraftBaseProperties,
  AircraftBillboardProperties,
  TrajectoryGroup,
  AircraftGraphic
} from '@/views/aviation-situation/types/aircraft'
import { flyToLngLatAlt, getCameraHeight } from '@/utils/geoUtils'
import { useAviationSelectionStore } from '@/stores/aviation-selection'
import { useSimulatedWebSocketStore } from '@/stores/simulate-websocket'
import { useAircraftStore } from '@/stores/aircraft'
import type {
  AviationSelectedData,
  AviationRenderItem,
} from '@/views/aviation-situation/types/shared'
import { useAircraftRoute } from './routes/useAircraftRoute'
import { useAircraftTrajectory } from './routes/useAircraftTrajectory'
import {
  AIRCRAFT_LABEL_SHOW_DISTANCE,
  airplaneHoveredSvgRawDataUrl,
  airplaneSelectedSvgRawDataUrl,
  airplaneSpatialSelectedSvgRawDataUrl,
  airplaneSatelliteConeScanSvgRawDataUrl,
} from './aircraft-constants'
type AircraftRenderItem = AviationRenderItem<Aircraft>
import { useAviationTooltip } from '../useAviationTooltip'
import { useAircraftSpatialSelection } from './useAircraftSpatialSelection'
import { useAircraftConeScannedBySatellite } from './useAircraftConeScannedBySatellite'
import {handleAircraftLeftClick} from "@/views/aviation-situation/composables/cesium-events/event-handlers/interaction/aircraft.ts"
import { useAircraftRiskRipple } from './useAircraftRiskRipple'
import { useAircraftFilter } from './useAircraftFilter'
import { useAircraftInteractions } from './useAircraftInteractions'
import { useAircraftRenderer } from './useAircraftRenderer'
import { useAircraftSync } from './useAircraftSync'

export interface UseAircraftsOptions {
  onAviationDataUpdated?: () => void
}

export function useAircrafts(
  viewer: ShallowRef<Cesium.Viewer>,
  options: UseAircraftsOptions = {},
) {
  const aviationSelectionStore = useAviationSelectionStore()
  const simulatedWebSocketStore = useSimulatedWebSocketStore()
  const aircraftStore = useAircraftStore()
  const aircraftRiskRipple = useAircraftRiskRipple(viewer)

  const aircraftRenderMap = new Map<string, AircraftRenderItem>()

  const notifyAviationDataUpdated = (): void => {
    options.onAviationDataUpdated?.()
  }

  const syncAircraftRiskRipple = (
    aircraft: Aircraft,
    position: Cesium.Cartesian3,
    isVisible: boolean,
  ): void => {
    aircraftRiskRipple.sync({
      icao24: aircraft.icao24,
      position,
      riskLevel: aircraft.riskLevel,
      visible: isVisible,
    })
  }
  // 初始化图元容器
  const aircraftGraphic: AircraftGraphic = {
    primitiveContainer: null,
    primitives: {
      billboards: null,
      labels: null,
      selectedAircraft: {
        // 对应类型中的selectedAircraft，语义清晰
        routePolylines: null,
        planned: {
          trajectoryPolylineEntity: null,
          waypoints: null,
        },
      },
    },
  }

  const {
    tooltip,
    showTooltip: showAircraftTooltip,
    hideTooltip: hideAircraftTooltip
  } = useAviationTooltip<AircraftBaseProperties>({
    type: 'billboard',
    sourceType: 'aircraft',
    icao24: '',
    originCountry: '',
    callsign: '',
    lngLatAlt:{
      longitude: 0,
      latitude: 0,
      baroAltitude: 0,
    },
    heading: 0,
  })

  // 引入航线/轨迹模块
  const { initAircraftRoute, syncAircraftRoute, clearAircraftRoute } = useAircraftRoute(
    viewer,
    aircraftGraphic,
  )
  const {
    syncAircraftPlannedTrajectory,
    setAircraftPlannedTrajectoryVisible,
    setAircraftPlannedWaypointsVisible,
    resetAircraftPlannedTrajectory,
    clearAircraftPlannedWaypoints,
    initPlannedTrajectoryCallback,
    initPlannedTrajectory,
  } = useAircraftTrajectory(viewer, aircraftGraphic)

  const { finishedSpatialSelection, subscribeSpatialSelectionEvents } = useAircraftSpatialSelection({
    viewer,
    renderMap: aircraftRenderMap,
    spatialSelectedImageUrl: airplaneSpatialSelectedSvgRawDataUrl,
  })
  const { refreshSatelliteConeScan } = useAircraftConeScannedBySatellite({
    viewer,
    renderMap: aircraftRenderMap,
    satelliteConeScannedImageUrl: airplaneSatelliteConeScanSvgRawDataUrl,
  })
  const { filterAircrafts } = useAircraftFilter({
    renderMap: aircraftRenderMap,
    aircraftGraphic,
    aircraftFilterForm: aircraftStore.aircraftFilterForm,
    clearMatchedAircrafts: aircraftStore.clearMatchedAircrafts,
    addMatchedAircrafts: aircraftStore.addMatchedAircrafts,
    commitMatchedAircrafts: aircraftStore.commitMatchedAircrafts,
    getSelected: () => aviationSelectionStore.selected,
    onSyncRiskRipple: (aircraft, billboard, isMatch) =>
      syncAircraftRiskRipple(
        aircraft,
        billboard.position,
        aircraftStore.aircraftFilterForm.visible && isMatch,
      ),
    onFinishedSpatialSelection: finishedSpatialSelection,
    onAviationDataUpdated: notifyAviationDataUpdated,
  })
  const {
    initGraphicCollections,
    drawAircraft,
    drawAircrafts,
    addAircraftLabels,
    removeAircraftLabels,
    clearAircrafts: clearAircraftGraphics,
    removeAircraft: removeAircraftGraphic,
  } = useAircraftRenderer({
    aircraftGraphic,
    aircraftRenderMap,
    aircraftFilterForm: aircraftStore.aircraftFilterForm,
    syncRiskRipple: (aircraft, position) =>
      syncAircraftRiskRipple(aircraft, position, aircraftStore.aircraftFilterForm.visible),
    removeRiskRipple: aircraftRiskRipple.remove,
    clearRiskRipple: aircraftRiskRipple.clear,
  })
  const aircraftInteractions = useAircraftInteractions({
    aviationSelectionStore,
    showAircraftTooltip,
    hideAircraftTooltip,
    onMouseWheel: () => {
      handleCameraMoveEnd(viewer.value.camera)
    },
    hoveredImageUrl: airplaneHoveredSvgRawDataUrl,
    selectedImageUrl: airplaneSelectedSvgRawDataUrl,
  })
  const { loadAndDrawAircrafts, syncAircrafts } = useAircraftSync({
    viewer,
    aircraftRenderMap,
    drawAircraft,
    drawAircrafts,
    removeAircraft: (icao24) => removeAircraft(icao24),
    clearAircrafts: () => clearAircrafts(),
    filterAircrafts,
    clearMatchedAircrafts: aircraftStore.clearMatchedAircrafts,
    syncRiskRipple: (aircraft, position, billboardShow) =>
      syncAircraftRiskRipple(aircraft, position, aircraftStore.aircraftFilterForm.visible && billboardShow),
    getHovered: () => aviationSelectionStore.hovered,
    showAircraftTooltip,
  })

  // ========== 相机事件 ==========
  let unsubCameraMoveEnd: () => void
  const handleCameraMoveEnd = (camera: Cesium.Camera) => {
    if (!aircraftStore.aircraftFilterForm.visible) return
    if (!aircraftGraphic.primitiveContainer) return
    const cameraHeight: number = getCameraHeight(camera)
    setAircraftsLabelVisible(cameraHeight <= AIRCRAFT_LABEL_SHOW_DISTANCE)
  }

  const setAircraftsLabelVisible = (isVisible: boolean): void => {
    if (aircraftGraphic.primitives.labels) {
      aircraftGraphic.primitives.labels.show = isVisible
    }
  }

  const subscribeCameraEvents = () => {
    unsubCameraMoveEnd = useCesiumCameraEvent('moveEnd', handleCameraMoveEnd)
  }

  // ========== 初始化 ==========
  const initAircrafts = () => {
    // 创建图元集合
    initGraphicCollections()

    initAircraftRoute()
    initPlannedTrajectory()

    // 添加到场景
    viewer.value.scene.primitives.add(aircraftGraphic.primitiveContainer)
    aircraftRiskRipple.init()

    // 初始隐藏标签
    setAircraftsLabelVisible(false)

    // 监听逻辑
    setupAircraftWatches()
    // setupHighlightWatch()
    // setupSimulatedWebsocketWatch()
    // setupAircraftFilterFormWatch()

    // 订阅事件
    subscribeCameraEvents()
    subscribeAircraftEvents()
    subscribeSpatialSelectionEvents()
  }

  const clearSelectedAircraftRouteAndTrajectory=()=>{
    clearAircraftRoute()
    resetAircraftPlannedTrajectory()
    clearAircraftPlannedWaypoints()
  }

  // ========== 监听逻辑 ==========
  let unwatchHighlight: () => void
  let unwatchSimulatedWebsocket: () => void
  let unwatchAircraftFilterForm: () => void
  let unwatchAircraftLabelVisible: () => void

  const setupAircraftWatches=():void=>{
    setupHighlightWatch()
    setupSimulatedWebsocketWatch()
    setupAircraftFilterFormWatch()
  }
  const setupHighlightWatch = (): void => {
    unwatchHighlight = watch(
      [() => simulatedWebSocketStore.index, () => aviationSelectionStore.selected],
      () => {
        const selected: AviationSelectedData = aviationSelectionStore.selected
        if (selected === null) {
          clearSelectedAircraftRouteAndTrajectory()
          return
        }
        if (selected?.sourceType === 'aircraft') {
          const currentIcao24 = selected.icao24
          // 同步航线
          syncAircraftRoute(currentIcao24, selected)
          // 同步计划轨迹
          syncAircraftPlannedTrajectory(currentIcao24, selected)
          const planned: TrajectoryGroup = aircraftStore.aircraftTrajectoryOptions.planned
          if (planned.trajectoryVisible) {
            initPlannedTrajectoryCallback()
            setAircraftPlannedTrajectoryVisible(true)
          }

          if (planned.waypointsVisible) {
            setAircraftPlannedWaypointsVisible(true)
          }
        } else {
          clearSelectedAircraftRouteAndTrajectory()
        }
      },
      { deep: true },
    )
  }

  const setupSimulatedWebsocketWatch = (): void => {
    unwatchSimulatedWebsocket = watch(
      () => simulatedWebSocketStore.index,
      (newIndex) => {
        if (newIndex !== null) syncAircrafts(newIndex)
      },
    )
  }

  const setupAircraftFilterFormWatch = (): void => {
    unwatchAircraftFilterForm = watch(
      () => aircraftStore.aircraftFilterForm,
      () => {
        filterAircrafts()
        handleCameraMoveEnd(viewer.value.camera)
      },
      { deep: true },
    )

    unwatchAircraftLabelVisible = watch(
      () => aircraftStore.aircraftFilterForm.labelVisible,
      (labelVisible) => {
        if (labelVisible) {
          addAircraftLabels()
        } else {
          removeAircraftLabels()
        }
        filterAircrafts()
        handleCameraMoveEnd(viewer.value.camera)
      },
    )
  }

  // const addDiffusionCircle


  // ========== 事件订阅 ==========
  const subscribeAircraftEvents = () => {
    aircraftInteractions.subscribe()
  }

  const flyToAircraftByIcao24 = (icao24: string): void => {
    const aircraftRenderItem = aircraftRenderMap.get(icao24)
    if (!aircraftRenderItem) return
    const properties = (aircraftRenderItem.billboard as any).properties as AircraftBillboardProperties
    handleAircraftLeftClick(properties,aircraftRenderItem.billboard)
    flyToLngLatAlt(viewer,{
      longitude: aircraftRenderItem.data.longitude,
      latitude: aircraftRenderItem.data.latitude-.55,
      height: aircraftRenderItem.data.baroAltitude,
    })
  }

  const clearAircrafts = (): void => {
    clearAircraftGraphics()
    clearAircraftRoute()
  }

  const removeAircraft = (icao24: string): void => {
    removeAircraftGraphic(icao24)
  }

  // ========== 卸载清理 ==========
  onUnmounted(() => {
    // 事件解绑
    aircraftInteractions.unsubscribe()
    unsubCameraMoveEnd?.()

    // 监听解绑
    unwatchHighlight?.()
    unwatchSimulatedWebsocket?.()
    unwatchAircraftFilterForm?.()
    unwatchAircraftLabelVisible?.()
    aircraftRiskRipple.destroy()

    // 重置store
    aircraftStore.resetAircraftFilterForm()
  })

  // ========== 暴露方法 ==========
  return {
    initAircrafts,
    loadAndDrawAircrafts,
    syncAircrafts,
    showAircraftTooltip,
    hideAircraftTooltip,
    tooltip,
    filterAircrafts,
    flyToAircraftByIcao24,
    refreshSatelliteConeScan,
  }
}
