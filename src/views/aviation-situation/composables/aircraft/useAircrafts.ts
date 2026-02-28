//useAircrafts.ts
import { reactive, watch, onUnmounted, ref } from 'vue'
import * as Cesium from 'cesium'
import { useCesiumCameraEvent } from '../useCesiumCameraEvents'
import { emitCesiumEvent, onCesiumEvent } from '../useCesiumEvents'
import { getAircrafts } from '@/network/aircraft'
import type { Aircraft, AircraftStatesResponse } from '@/network/aircraft/types/aircraft'
import {
  AircraftBaseProperties,
  AircraftBillboardProperties,
  AircraftSelectedData,
  AircraftLabelProperties,
  AircraftTooltipState,
} from '../../types/aircraft'
import { getCameraHeight, isValidCoordinate, updateTooltip } from '@/utils/geoUtils'
import type { AircraftFilterForm } from '@/views/aviation-situation/types/aircraft'
import {
  highlightBillboardOnHover,
  highlightBillboardAndSetSelected,
  clearHoveredHighlight,
} from '../useHighlightManager'
import { useHighlightStore } from '@/stores/highlight'
import { useSimulatedWebSocketStore } from '@/stores/simulateWebSocket'
import type { RoutePoint } from '@/network/aircraft/types/route-full'
import { type TrajectoryGroup, type AircraftTrajectoryOptions, useAircraftStore } from '@/stores/aircraft'
import { useDebounceFn } from '@vueuse/core'
import type { AviationSelectedData } from '@/views/aviation-situation/types/shared'
import { useAircraftRoute } from './useAircraftRoute'
import { useAircraftTrajectory } from './useAircraftTrajectory'
import {
  AIRCRAFT_LABEL_SHOW_DISTANCE,
  airplaneBlueSvgDataUrl,
  airplaneHoveredSvgRawDataUrl,
  airplaneSelectedSvgRawDataUrl,
} from './aircraftConstants'

const highlightStore = useHighlightStore()
const simulatedWebSocketStore = useSimulatedWebSocketStore()
const aircraftStore = useAircraftStore()

interface AircraftPrimitives {
  billboards: Cesium.BillboardCollection | null
  billboardMap: Map<string, Cesium.Billboard>
  labelMap: Map<string, Cesium.Label>
  labels: Cesium.LabelCollection | null
  routePolylines: Cesium.PolylineCollection | null
  waypoints: Cesium.PointPrimitiveCollection | null
}

interface AircraftGraphic {
  primitiveContainer: Cesium.PrimitiveCollection | null
  primitives: AircraftPrimitives
}

/**
 * 根据高度值获取对应区间的固定颜色
 * @param altitude 高度（米）
 * @returns Cesium.Color
 */
const getColorByAltitude = (altitude: number): Cesium.Color => {
  if (altitude === null || altitude === undefined || isNaN(altitude)) {
    return Cesium.Color.fromCssColorString('rgba(128, 128, 128, 0.8)')
  }
  const matchItem = altitudeColorMap.find((item) => altitude >= item.min && altitude < item.max)
  return matchItem
    ? Cesium.Color.fromCssColorString(matchItem.color)
    : Cesium.Color.fromCssColorString('rgba(128, 128, 128, 0.8)')
}

export function useAircrafts(viewer) {
  let aircrafts: Aircraft[] = []
  let matchedBillboards: Cesium.Billboard[] = []
  const matchedAircraftCount = ref<number>(0)

  // 初始化图元容器
  const aircraftGraphic: AircraftGraphic = {
    primitiveContainer: null,
    primitives: {
      billboards: null,
      billboardMap: new Map(),
      labelMap: new Map(),
      labels: null,
      routePolylines: null,
      waypoints: null,
    },
  }

  // 提示框状态
  const tooltip = reactive<AircraftTooltipState>({
    visible: false,
    position: { left: 0, top: 0 },
    properties: {
      type: '',
      sourceType: 'aircraft',
      icao24: '',
      originCountry: '',
      callsign: '',
      longitude: 0,
      latitude: 0,
      baroAltitude: 0,
      heading: 0,
    },
  })

  // 引入航线/轨迹模块
  const { syncAircraftRoute, clearAircraftRoute } = useAircraftRoute(viewer, aircraftGraphic)
  const {
    syncAircraftPlannedTrajectory,
    setAircraftPlannedTrajectoryVisible,
    resetAircraftPlannedTrajectory
  } = useAircraftTrajectory(viewer, aircraftGraphic)

  // ========== 相机事件 ==========
  let unsubCameraMoveEnd: () => void;
  const handleCameraMoveEnd = (camera: Cesium.Camera) => {
    if (!aircraftStore.aircraftFilterForm.visible) return;
    if (!aircraftGraphic.primitiveContainer) return;
    const cameraHeight: number = getCameraHeight(camera);
    setAircraftsLabelVisible(cameraHeight <= AIRCRAFT_LABEL_SHOW_DISTANCE)
  };

  const setAircraftsLabelVisible = (isVisible): void => {
    if (aircraftGraphic.primitives.labels) {
      aircraftGraphic.primitives.labels.show = isVisible
    }
  }

  const subscribeCameraEvents = () => {
    unsubCameraMoveEnd = useCesiumCameraEvent('moveEnd', handleCameraMoveEnd);
  };

  // ========== 初始化 ==========
  const initAircrafts = () => {
    // 创建图元集合
    aircraftGraphic.primitiveContainer = new Cesium.PrimitiveCollection()
    aircraftGraphic.primitives.billboards = new Cesium.BillboardCollection()
    aircraftGraphic.primitives.labels = new Cesium.LabelCollection()
    aircraftGraphic.primitives.routePolylines = new Cesium.PolylineCollection()
    aircraftGraphic.primitives.waypoints = new Cesium.PointPrimitiveCollection()

    // 设置ID和属性
    aircraftGraphic.primitiveContainer.id = 'aircrafts_container'
    aircraftGraphic.primitives.billboards.id = 'aircrafts_billboards'
    aircraftGraphic.primitives.labels.id = 'aircrafts_labels'
    aircraftGraphic.primitives.routePolylines.id = 'aircraft_routePolylines'
    aircraftGraphic.primitives.waypoints.id = 'aircraft_plannedWaypoints'

    // 添加到容器
    aircraftGraphic.primitiveContainer.add(aircraftGraphic.primitives.billboards)
    aircraftGraphic.primitiveContainer.add(aircraftGraphic.primitives.labels)
    aircraftGraphic.primitiveContainer.add(aircraftGraphic.primitives.routePolylines)
    aircraftGraphic.primitiveContainer.add(aircraftGraphic.primitives.waypoints)

    // 设置属性
    aircraftGraphic.primitiveContainer.properties = { sourceType: 'aircraft', type: 'container' }
    aircraftGraphic.primitives.billboards.properties = { sourceType: 'aircraft', type: 'billboards' }
    aircraftGraphic.primitives.labels.properties = { sourceType: 'aircraft', type: 'labels' }
    aircraftGraphic.primitives.routePolylines.properties = { sourceType: 'aircraft', type: 'aircraft_routePolylines' }
    aircraftGraphic.primitives.waypoints.properties = { sourceType: 'aircraft', type: 'aircraft_plannedWaypoints' }

    // 添加到场景
    viewer.value.scene.primitives.add(aircraftGraphic.primitiveContainer)

    aircraftGraphic.primitives.plannedTrajectoryEntity = viewer.value.entities.add({
      id: 'aircraft_plannedTrajectory',
      show: false, // 默认隐藏
      // show:true,
      properties: {
        sourceType: 'aircraft',
        type:'aircraft_plannedTrajectory'
      },
      polyline: {
        width: 3,
        material: Cesium.Color.RED.withAlpha(0.8),
        positions: []
      },
    })


    // 初始隐藏标签
    setAircraftsLabelVisible(false)

    // 监听逻辑
    setupHighlightWatch()
    setupSimulatedWebsocketWatch()
    setupAircraftFilterFormWatch()

    // 订阅事件
    subscribeCameraEvents()
    subscribeAircraftEvents()
  }

  // ========== 数据加载与渲染 ==========
  const loadAndDrawAircrafts = async (): void => {
    try {
      const res: AircraftStatesResponse = await getAircrafts()
      clearAircrafts()
      if (Array.isArray(res) && res.length > 0) {
        aircrafts = res
        drawAircrafts()
      } else {
        console.warn('飞机数据为空或格式错误:', res)
      }
    } catch (error) {
      console.error('加载飞机数据失败:', error)
      clearAircrafts()
    }
  }

  const syncAircrafts = async (newIndex: number): void => {
    try {
      const data: AircraftStatesResponse = await getAircrafts()
      if (Array.isArray(data) && data.length > 0) {
        if (aircrafts.length === 0) {
          aircrafts = data
          drawAircrafts()
        } else {
          const offset: number = newIndex * 0.02
          for (const aircraft of data) {
            aircraft.longitude += offset
            aircraft.latitude += offset
          }
          aircrafts = data
          refreshAircraftsInScene(data)
        }
        filterAircrafts()
      } else {
        console.warn('飞机数据为空或格式错误:', data)
        clearAircrafts()
      }
    } catch (error) {
      console.error('加载飞机数据失败:', error)
      clearAircrafts()
    }
  }

  const refreshAircraftsInScene = (newAircrafts: Aircraft[]): void => {
    const newIcaoSet = new Set<string>()

    // 更新/添加飞机
    for (const aircraft of newAircrafts) {
      newIcaoSet.add(aircraft.icao24)
      const billboard = aircraftGraphic.primitives.billboardMap.get(aircraft.icao24)
      if (billboard) {
        const position = Cesium.Cartesian3.fromDegrees(
          aircraft.longitude,
          aircraft.latitude,
          aircraft.baroAltitude,
        )
        billboard.position = position
        billboard.rotation = -Cesium.Math.toRadians(aircraft.heading)
        const label = aircraftGraphic.primitives.labelMap.get(aircraft.icao24)
        if (label) label.position = position
      } else {
        drawAircraft(aircraft)
      }
    }

    // 移除消失的飞机
    for (const icao24 of aircraftGraphic.primitives.billboardMap.keys()) {
      if (!newIcaoSet.has(icao24)) {
        removeAircraft(icao24)
      }
    }

    aircrafts = newAircrafts
  }

  const drawAircraft = (aircraft: Aircraft): void => {
    const { longitude, latitude, baroAltitude, callsign, heading, icao24, originCountry } = aircraft
    if (!isValidCoordinate(longitude, latitude, baroAltitude)) return

    const position = Cesium.Cartesian3.fromDegrees(longitude, latitude, baroAltitude)

    // 创建Billboard
    const billboard = aircraftGraphic.primitives.billboards.add({
      id: `aircraft_billboard_${icao24}`,
      show: true,
      position,
      image: airplaneBlueSvgDataUrl,
      rotation: -Cesium.Math.toRadians(heading),
      width: 30,
      height: 30,
    })

    billboard.properties = {
      type: 'billboard',
      sourceType: 'aircraft',
      icao24,
      originCountry,
      callsign,
      longitude,
      latitude,
      baroAltitude,
      heading,
      originalColor: billboard.color,
      originalImage: billboard.image,
    } satisfies AircraftBillboardProperties

    // 创建Label
    const label = aircraftGraphic.primitives.labels.add({
      show: true,
      id: `aircraft_label_${icao24}`,
      position,
      text: callsign,
      font: '14px sans-serif',
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      outlineWidth: 2,
      verticalOrigin: Cesium.VerticalOrigin.TOP,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      pixelOffset: new Cesium.Cartesian2(0, 20),
      outlineColor: Cesium.Color.BLACK,
    })

    label.properties = {
      type: 'label',
      sourceType: 'aircraft',
      icao24,
      originCountry,
      callsign,
      longitude,
      latitude,
      baroAltitude,
      heading,
      originalFillColor: label.fillColor,
    } satisfies AircraftLabelProperties

    // 存入Map
    aircraftGraphic.primitives.billboardMap.set(icao24, billboard)
    aircraftGraphic.primitives.labelMap.set(icao24, label)
  }

  const drawAircrafts = (): void => {
    aircrafts.forEach(aircraft => drawAircraft(aircraft))
  }

  // ========== 监听逻辑 ==========
  let unwatchHighlight: () => void
  let unwatchSimulatedWebsocket: () => void
  let unwatchAircraftFilterForm: () => void

  const setupHighlightWatch = (): void => {
    unwatchHighlight = watch(
      [() => simulatedWebSocketStore.index, () => highlightStore.selected, () => aircraftStore.aircraftTrajectoryOptions],
      () => {
        const selected: AviationSelectedData = highlightStore.selected
        if (selected === null) {
          clearAircraftRoute()
          resetAircraftPlannedTrajectory()
          return
        }
        if (selected?.sourceType === 'aircraft') {
          const currentIcao24 = selected.icao24
          // 同步航线
          syncAircraftRoute(currentIcao24, selected)
          // 同步计划轨迹
          const { planned } = aircraftStore.aircraftTrajectoryOptions
          if (planned.trajectoryVisible) {
            syncAircraftPlannedTrajectory(currentIcao24, selected)
          } else {
            setAircraftPlannedTrajectoryVisible(false)
            resetAircraftPlannedTrajectory()
          }
          // 计划航路点逻辑（待实现）
          if (planned.waypointsVisible) {
            // syncAircraftPlannedWaypoints()
          } else {
            // setAircraftPlannedWaypointsVisible(false)
          }
        } else {
          clearAircraftRoute()
          resetAircraftPlannedTrajectory()
        }
      },
      { deep: true }
    )
  }

  const setupSimulatedWebsocketWatch = (): void => {
    unwatchSimulatedWebsocket = watch(
      () => simulatedWebSocketStore.index,
      (newIndex) => {
        if (newIndex !== null) syncAircrafts(newIndex)
      }
    )
  }

  const setupAircraftFilterFormWatch = (): void => {
    unwatchAircraftFilterForm = watch(
      () => aircraftStore.aircraftFilterForm,
      () => {
        filterAircrafts()
        handleCameraMoveEnd(viewer.value.camera)
      },
      { deep: true }
    )
  }

  // ========== 筛选逻辑 ==========
  const filterAircrafts = useDebounceFn((): void => {
    matchedBillboards = []
    matchedAircraftCount.value = 0
    const form = aircraftStore.aircraftFilterForm
    const query = {
      icao24: form.icao24?.trim().toLowerCase(),
      callsign: form.callsign?.trim().toLowerCase(),
      originCountry: form.originCountry?.trim().toLowerCase(),
    }

    let isSelectedAircraftMatched = false

    aircraftGraphic.primitives.billboardMap.forEach((billboard, icao24) => {
      const p = billboard.properties as AircraftBaseProperties
      if (!p) return

      const match =
        (!query.icao24 || p.icao24.toLowerCase().includes(query.icao24)) &&
        (!query.callsign || (p.callsign ?? '').toLowerCase().includes(query.callsign)) &&
        (!query.originCountry || (p.originCountry ?? '').toLowerCase().includes(query.originCountry))

      if (match) {
        matchedAircraftCount.value++
        const selected = highlightStore.selected
        if (selected?.sourceType === 'aircraft' && p.icao24 === selected.icao24) {
          isSelectedAircraftMatched = true
        }
        matchedBillboards.push(billboard)
      }

      billboard.show = match
      const label = aircraftGraphic.primitives.labelMap.get(icao24)
      if (label) label.show = match
    })

    // 控制航线/容器显隐
    aircraftGraphic.primitives.routePolylines.show = isSelectedAircraftMatched
    aircraftGraphic.primitiveContainer.show = form.visible
  }, 300)

  // ========== 相机飞行 ==========
  const flyToMatchedAircrafts = () => {
    flyToMatchedBillboards(matchedBillboards)
  }

  const flyToMatchedBillboards = (matchedBillboards: Cesium.Billboard[]) => {
    if (!viewer.value || matchedBillboards.length === 0) return;

    const positions = matchedBillboards
      .map(b => b.position)
      .filter(pos => Cesium.defined(pos))

    if (positions.length === 0) return;

    // 单点逻辑
    if (positions.length === 1) {
      const cartographic = Cesium.Cartographic.fromCartesian(positions[0])
      viewer.value.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          Cesium.Math.toDegrees(cartographic.longitude),
          Cesium.Math.toDegrees(cartographic.latitude),
          50000
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-45),
          roll: 0.0
        },
        duration: 2.0,
        maximumHeight: 1000000,
      });
      return;
    }

    // 多点包围盒
    const boundingSphere = Cesium.BoundingSphere.fromPoints(positions)
    const offset = new Cesium.HeadingPitchRange(
      Cesium.Math.toRadians(0),
      Cesium.Math.toRadians(-60),
      boundingSphere.radius * 2.5
    )

    viewer.value.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(0, 0, 0),
      target: boundingSphere,
      offset,
      duration: 2.0,
      maximumHeight: boundingSphere.radius * 5,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
      complete: () => {
        viewer.value.camera.lookAt(
          boundingSphere.center,
          new Cesium.Cartesian3(0, -boundingSphere.radius * 2, boundingSphere.radius)
        );
      },
    });
  };

  // ========== 事件订阅 ==========
  let unsubAircraftHover: () => void
  let unsubAircraftLeave: () => void
  let unsubAircraftLeftClick: () => void
  let unsubMouseWheel: () => void;

  const subscribeAircraftEvents = () => {
    // Hover事件
    unsubAircraftHover = onCesiumEvent(
      'aircraftHover',
      (properties: AircraftBaseProperties, position: Cesium.Cartesian2, billboard: Cesium.Billboard) => {
        showAircraftTooltip(position, properties)
        highlightBillboardOnHover(billboard, airplaneHoveredSvgRawDataUrl)
      },
    )

    // Leave事件
    unsubAircraftLeave = onCesiumEvent('aircraftLeave', () => {
      hideAircraftTooltip()
      clearHoveredHighlight()
    })

    // 点击事件
    unsubAircraftLeftClick = onCesiumEvent(
      'aircraftLeftClick',
      (data: AircraftSelectedData, billboard: Cesium.Billboard) => {
        highlightBillboardAndSetSelected(data, billboard, airplaneSelectedSvgRawDataUrl)
      },
    )

    // 滚轮事件
    unsubMouseWheel = onCesiumEvent('mouseWheel', () => {
      handleCameraMoveEnd(viewer.value.camera)
    });
  }

  // ========== 工具方法 ==========
  const showAircraftTooltip = (screenPosition: Cesium.Cartesian2, properties: AircraftBaseProperties) => {
    updateTooltip<AircraftBaseProperties>(tooltip, screenPosition, properties)
  }

  const hideAircraftTooltip = (): void => {
    tooltip.visible = false
  }

  const clearAircrafts = (): void => {
    aircraftGraphic.primitives.billboards?.removeAll()
    aircraftGraphic.primitives.labels?.removeAll()
    aircraftGraphic.primitives.routePolylines?.removeAll()
    aircraftGraphic.primitives.billboardMap.clear()
    aircraftGraphic.primitives.labelMap.clear()
    matchedAircraftCount.value = 0
  }

  const removeAircraft = (icao24: string): void => {
    const billboard = aircraftGraphic.primitives.billboardMap.get(icao24)
    const label = aircraftGraphic.primitives.labelMap.get(icao24)

    if (billboard) aircraftGraphic.primitives.billboards?.remove(billboard)
    if (label) aircraftGraphic.primitives.labels?.remove(label)

    aircraftGraphic.primitives.billboardMap.delete(icao24)
    aircraftGraphic.primitives.labelMap.delete(icao24)
  }

  // ========== 卸载清理 ==========
  onUnmounted(() => {
    // 事件解绑
    unsubAircraftHover?.()
    unsubAircraftLeave?.()
    unsubAircraftLeftClick?.()
    unsubMouseWheel?.()
    unsubCameraMoveEnd?.()

    // 监听解绑
    unwatchHighlight?.()
    unwatchSimulatedWebsocket?.()
    unwatchAircraftFilterForm?.()

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
    matchedAircraftCount,
    flyToMatchedAircrafts,
  }
}
