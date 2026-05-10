//src/views/aviation-situation/composables/aircraft/useAircrafts.ts
import { watch, onUnmounted, ShallowRef } from 'vue'
import * as Cesium from 'cesium'
import { useCesiumCameraEvent } from '../cesium-events/cesium-camera-events'
import { emitCesiumEvent, onCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import { getAircrafts } from '@/network/aircraft'
import type { Aircraft, AircraftStatesResponse } from '@/network/aircraft/types/aircraft'
import type {
  AircraftBaseProperties,
  AircraftBillboardProperties,
  AircraftSelectedData,
  AircraftLabelProperties,
  TrajectoryGroup,
  AircraftFilterForm, AircraftGraphic
} from '@/views/aviation-situation/types/aircraft'
import { flyToLngLatAlt, getCameraHeight, isValidCoordinate } from '@/utils/geoUtils'

type AircraftFilterQuery = Pick<AircraftFilterForm, 'icao24' | 'callsign' | 'originCountries'>
import {
  highlightBillboardOnHover,
  highlightBillboardAndSetSelected,
  clearHoveredBillboardHighlight,
} from '../highlight-manager/billboard-highlight-manager'
import { useAviationSelectionStore } from '@/stores/aviation-selection'
import { useSimulatedWebSocketStore } from '@/stores/simulate-websocket'
import { useAircraftStore } from '@/stores/aircraft'
import { useDebounceFn } from '@vueuse/core'
import type {
  AviationSelectedData,
  AviationRenderItem,
} from '@/views/aviation-situation/types/shared'
import { useAircraftRoute } from './routes/useAircraftRoute'
import { useAircraftTrajectory } from './routes/useAircraftTrajectory'
import {
  AIRCRAFT_LABEL_SHOW_DISTANCE,
  airplaneBlueSvgDataUrl,
  airplaneHoveredSvgRawDataUrl,
  airplaneSelectedSvgRawDataUrl,
  airplaneSpatialSelectedSvgRawDataUrl,
} from './aircraft-constants'
type AircraftRenderItem = AviationRenderItem<Aircraft>
import { useAviationTooltip } from '../useAviationTooltip'
import { useAircraftSpatialSelection } from './useAircraftSpatialSelection'
import {handleAircraftLeftClick} from "@/views/aviation-situation/composables/cesium-events/event-handlers/interaction/aircraft.ts"

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

export function useAircrafts(viewer:ShallowRef<Cesium.Viewer>) {
  const aviationSelectionStore = useAviationSelectionStore()
  const simulatedWebSocketStore = useSimulatedWebSocketStore()
  const aircraftStore = useAircraftStore()

  const aircraftRenderMap = new Map<string, AircraftRenderItem>()
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
    type: '',
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

  // ========== 相机事件 ==========
  let unsubCameraMoveEnd: () => void
  const handleCameraMoveEnd = (camera: Cesium.Camera) => {
    if (!aircraftStore.aircraftFilterForm.visible) return
    if (!aircraftGraphic.primitiveContainer) return
    const cameraHeight: number = getCameraHeight(camera)
    setAircraftsLabelVisible(cameraHeight <= AIRCRAFT_LABEL_SHOW_DISTANCE)
  }

  const setAircraftsLabelVisible = (isVisible): void => {
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
    aircraftGraphic.primitiveContainer = new Cesium.PrimitiveCollection()
    aircraftGraphic.primitives.billboards = new Cesium.BillboardCollection()
    aircraftGraphic.primitives.labels = new Cesium.LabelCollection()

    // 设置ID和属性
    aircraftGraphic.primitiveContainer.id = 'aircrafts_container'
    aircraftGraphic.primitives.billboards.id = 'aircrafts_billboards'
    aircraftGraphic.primitives.labels.id = 'aircrafts_labels'

    // 添加到容器
    aircraftGraphic.primitiveContainer.add(aircraftGraphic.primitives.billboards)
    aircraftGraphic.primitiveContainer.add(aircraftGraphic.primitives.labels)

    // 设置属性
    aircraftGraphic.primitiveContainer.properties = { sourceType: 'aircraft', type: 'container' }
    aircraftGraphic.primitives.billboards.properties = {
      sourceType: 'aircraft',
      type: 'billboards',
    }
    aircraftGraphic.primitives.labels.properties = { sourceType: 'aircraft', type: 'labels' }

    initAircraftRoute()
    initPlannedTrajectory()

    // 添加到场景
    viewer.value.scene.primitives.add(aircraftGraphic.primitiveContainer)

    // 初始隐藏标签
    setAircraftsLabelVisible(false)

    // 监听逻辑
    setupHighlightWatch()
    setupSimulatedWebsocketWatch()
    setupAircraftFilterFormWatch()

    // 订阅事件
    subscribeCameraEvents()
    subscribeAircraftEvents()
    subscribeSpatialSelectionEvents()
  }

  // ========== 数据加载与渲染 ==========
  const loadAndDrawAircrafts = async (): void => {
    try {
      const res: AircraftStatesResponse = await getAircrafts()
      clearAircrafts()
      if (Array.isArray(res) && res.length > 0) {
        drawAircrafts(res)
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
        if (aircraftRenderMap.size === 0) {
          drawAircrafts(data)
        } else {
          const offset: number = newIndex * 0.02
          // const offset: number = newIndex * 0.1
          for (const aircraft of data) {
            // aircraft.longitude += offset
            // aircraft.latitude += offset
            aircraft.longitude = parseFloat((aircraft.longitude + offset).toFixed(4))
            aircraft.latitude = parseFloat((aircraft.latitude + offset).toFixed(4))
          }
          refreshAircraftsInScene(data)
        }
        filterAircrafts()
      } else {
        console.warn('飞机数据为空或格式错误:', data)
        clearAircrafts()
        // emitCesiumEvent('aircraftsSynced', { data: [], status: 'empty' })
        aircraftStore.clearMatchedAircrafts()
      }
    } catch (error) {
      console.error('加载飞机数据失败:', error)
      clearAircrafts()
      // emitCesiumEvent('aircraftsSynced', { data: [], status: 'empty' })
      aircraftStore.clearMatchedAircrafts()
    }
  }

  const refreshAircraftsInScene = (newAircrafts: Aircraft[]): void => {
    const newIcaoSet = new Set<string>()

    for (const aircraft of newAircrafts) {
      newIcaoSet.add(aircraft.icao24)
      const aircraftRenderItem:AircraftRenderItem = aircraftRenderMap.get(aircraft.icao24)

      if (aircraftRenderItem) {
        // 更新位置和航向
        const position = Cesium.Cartesian3.fromDegrees(
          aircraft.longitude,
          aircraft.latitude,
          aircraft.baroAltitude,
        )
        aircraftRenderItem.billboard.position = position
        aircraftRenderItem.billboard.rotation = -Cesium.Math.toRadians(aircraft.heading)
        aircraftRenderItem.label.position = position
        aircraftRenderItem.data=aircraft

        aircraftRenderItem.billboard.properties.lngLatAlt.longitude=aircraft.longitude
        aircraftRenderItem.billboard.properties.lngLatAlt.latitude=aircraft.latitude
        aircraftRenderItem.billboard.properties.lngLatAlt.baroAltitude=aircraft.baroAltitude

        aircraftRenderItem.label.properties.lngLatAlt.longitude=aircraft.longitude
        aircraftRenderItem.label.properties.lngLatAlt.latitude=aircraft.latitude
        aircraftRenderItem.label.properties.lngLatAlt.baroAltitude=aircraft.baroAltitude

        if(aviationSelectionStore.hovered!=null&&
          aircraft.icao24===aviationSelectionStore.hovered.icao24){
          const properties:AircraftBaseProperties = {
            type: 'billboard',
            sourceType: 'aircraft',
            icao24: aircraft.icao24,
            originCountry: aircraft.originCountry,
            callsign: aircraft.callsign,
            heading: aircraft.heading,
            lngLatAlt: {
              latitude: aircraft.latitude,
              longitude: aircraft.longitude,
              baroAltitude: aircraft.baroAltitude
            }
          }
          const position: Cesium.Cartesian3 = aircraftRenderItem.billboard.position
          const screenPosition: Cesium.Cartesian2 =
            Cesium.SceneTransforms.worldToWindowCoordinates(viewer.value.scene, position)
            console.log("properties", properties);
          console.log('fasong')
          showAircraftTooltip(screenPosition, properties) // 替换原方法
        }

      } else {
        drawAircraft(aircraft)
      }
    }

    // 移除消失的飞机
    for (const icao24 of aircraftRenderMap.keys()) {
      if (!newIcaoSet.has(icao24)) {
        removeAircraft(icao24)
      }
    }

  }

  const drawAircraft = (aircraft: Aircraft): void => {
    const { longitude, latitude, baroAltitude, callsign, heading, icao24, originCountry } = aircraft
    if (!isValidCoordinate(longitude, latitude, baroAltitude)) return

    const position: Cesium.Cartesian3 = Cesium.Cartesian3.fromDegrees(
      longitude,
      latitude,
      baroAltitude,
    )

    // 创建Billboard
    const billboard = aircraftGraphic.primitives.billboards.add({
      id: `aircraft_billboard_${icao24}`,
      show: true,
      position,
      image: airplaneBlueSvgDataUrl,
      rotation: -Cesium.Math.toRadians(heading),
      width: 30,
      height: 30,
      // color: new Cesium.Color(1, 1, 1, 0)
      // distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
      //   0,
      //   5000000
      // ),
    })

    billboard.properties = {
      type: 'billboard',
      sourceType: 'aircraft',
      icao24,
      originCountry,
      callsign,
      heading,
      lngLatAlt:{
        longitude,
        latitude,
        baroAltitude,
      },
      originalColor: billboard.color,
      originalImage: billboard.image,
      dataSourceNameSet: new Set<string>(),
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
      // color: new Cesium.Color(1, 1, 1, 0)
      // distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
      //   0,
      //   AIRCRAFT_LABEL_SHOW_DISTANCE
      // ),
    })

    label.properties = {
      type: 'label',
      sourceType: 'aircraft',
      icao24,
      originCountry,
      callsign,
      heading,
      lngLatAlt:{
        longitude,
        latitude,
        baroAltitude,
      },
      originalFillColor: label.fillColor,
      dataSourceNameSet: new Set<string>(),
    } satisfies AircraftLabelProperties

    // 存入Map
    aircraftRenderMap.set(icao24, { data: aircraft, billboard, label })
  }

  const drawAircrafts = (data: Aircraft[]): void => {
    data.forEach((aircraft) => drawAircraft(aircraft))
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
  }

  // ========== 筛选逻辑 ==========
  const filterAircrafts = useDebounceFn((): void => {
    aircraftStore.clearMatchedAircrafts()

    const form = aircraftStore.aircraftFilterForm
    const query: AircraftFilterQuery = {
      icao24: form.icao24?.trim().toLowerCase(),
      callsign: form.callsign?.trim().toLowerCase(),
      originCountries: form.originCountries,
    }

    const originCountriesSet = new Set(query.originCountries)

    let isSelectedAircraftMatched = false

    aircraftRenderMap.forEach(({  data: aircraft, billboard, label }) => {
      const p = billboard.properties as AircraftBaseProperties
      if (!p) return

      const match =
        (!query.icao24 || p.icao24.toLowerCase().includes(query.icao24)) &&
        (!query.callsign || (p.callsign ?? '').toLowerCase().includes(query.callsign)) &&
        originCountriesSet.has(p.originCountry)
        // (!originCountriesSet.size || originCountriesSet.has(p.originCountry))

      if (match) {
        // matchedAircrafts.push(aircraft)
        aircraftStore.addMatchedAircrafts(aircraft)

        const selected = aviationSelectionStore.selected
        if (selected?.sourceType === 'aircraft' && p.icao24 === selected.icao24) {
          isSelectedAircraftMatched = true
        }
      }

      // 控制显隐
      billboard.show = match
      label.show = match
    })

    aircraftGraphic.primitives.selectedAircraft.routePolylines.show = isSelectedAircraftMatched
    aircraftGraphic.primitiveContainer.show = form.visible

    aircraftStore.commitMatchedAircrafts()
    finishedSpatialSelection()
    emitCesiumEvent('aviationFiltered')
    // emitCesiumEvent('aircraftsSynced', { data: matchedAircrafts, status: 'ok' })
  }, 300)

  // ========== 事件订阅 ==========
  let unsubAircraftHover: () => void
  let unsubAircraftLeave: () => void
  let unsubAircraftLeftClick: () => void
  let unsubMouseWheel: () => void
  let unSubAircraftFilterTableDetailClick: () => void

  const subscribeAircraftEvents = () => {
    // Hover事件
    unsubAircraftHover = onCesiumEvent(
      'aircraftHover',
      (properties: AircraftBaseProperties, position: Cesium.Cartesian2, billboard: Cesium.Billboard) => {
        showAircraftTooltip(position, properties) // 替换原方法
        highlightBillboardOnHover(properties,billboard, airplaneHoveredSvgRawDataUrl)
        // aviationSelectionStore.setHovered(properties)
      }
    )

    // Leave事件
    unsubAircraftLeave = onCesiumEvent('aircraftLeave', () => {
      hideAircraftTooltip() // 替换原方法
      // clearHoveredBillboardHighlight()
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
    })

    unSubAircraftFilterTableDetailClick = onCesiumEvent('aircraftFilterTableDetailClicked', (icao24:string) => {
      flyToAircraftByIcao24(icao24)
    })
  }

  const flyToAircraftByIcao24 = (icao24: string): void => {
    const aircraftRenderItem = aircraftRenderMap.get(icao24)
    if (!aircraftRenderItem) return
    const properties = aircraftRenderItem.billboard.properties as AircraftBillboardProperties
    handleAircraftLeftClick(properties,{
      primitive:aircraftRenderItem.billboard
    })
    flyToLngLatAlt(viewer,{
      longitude:aircraftRenderItem.data.longitude,
      latitude:aircraftRenderItem.data.latitude,
      height:aircraftRenderItem.data.baroAltitude,
    })
  }

  const clearAircrafts = (): void => {
    aircraftGraphic.primitives.billboards?.removeAll()
    aircraftGraphic.primitives.labels?.removeAll()
    aircraftRenderMap.clear() // ✅ 一行搞定
    clearAircraftRoute()
  }

  const removeAircraft = (icao24: string): void => {
    const aircraftRenderItem = aircraftRenderMap.get(icao24)
    if (!aircraftRenderItem) return

    aircraftGraphic.primitives.billboards?.remove(aircraftRenderItem.billboard)
    aircraftGraphic.primitives.labels?.remove(aircraftRenderItem.label)
    aircraftRenderMap.delete(icao24)
  }

  // ========== 卸载清理 ==========
  onUnmounted(() => {
    // 事件解绑
    unsubAircraftHover?.()
    unsubAircraftLeave?.()
    unsubAircraftLeftClick?.()
    unsubMouseWheel?.()
    unsubCameraMoveEnd?.()
    unSubAircraftFilterTableDetailClick?.()

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
  }
}
