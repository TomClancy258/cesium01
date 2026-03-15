//src/views/aviation-situation/composables/aircraft/useAircrafts.ts
import { reactive, watch, onUnmounted, ref } from 'vue'
import * as Cesium from 'cesium'
import { useCesiumCameraEvent } from '../cesium-events/useCesiumCameraEvents'
import { emitCesiumEvent, onCesiumEvent } from '@/views/aviation-situation/composables/mittBus'
import { getAircrafts } from '@/network/aircraft'
import type { Aircraft, AircraftStatesResponse } from '@/network/aircraft/types/aircraft'
import type {
  AircraftBaseProperties,
  AircraftBillboardProperties,
  AircraftSelectedData,
  AircraftLabelProperties,
  AircraftTooltipState,
  TrajectoryGroup,
} from '@/views/aviation-situation/types/aircraft'
import { getCameraHeight, isValidCoordinate, updateTooltip } from '@/utils/geoUtils'
import type { AircraftFilterForm,AircraftGraphic } from '@/views/aviation-situation/types/aircraft'
type AircraftFilterQuery = Pick<AircraftFilterForm, 'icao24' | 'callsign' | 'originCountry'>;
import {
  highlightBillboardOnHover,
  highlightBillboardAndSetSelected,
  clearHoveredHighlight, highlightBillboardOnBoxSelection, clearBoxSelectedHighlight
} from '../useBillboardHighlightManager'
import { useAviationSelectionStore } from '@/stores/aviationSelection'
import { useSimulatedWebSocketStore } from '@/stores/simulateWebSocket'
import { useAircraftStore } from '@/stores/aircraft'
import { useDebounceFn } from '@vueuse/core'
import type { AviationSelectedData } from '@/views/aviation-situation/types/shared'
import { useAircraftRoute } from './routes/useAircraftRoute'
import { useAircraftTrajectory } from './routes/useAircraftTrajectory'
import {
  AIRCRAFT_LABEL_SHOW_DISTANCE,
  airplaneBlueSvgDataUrl,
  airplaneHoveredSvgRawDataUrl,
  airplaneSelectedSvgRawDataUrl,
  airplaneBoxSelectionSvgRawDataUrl,
} from './aircraftConstants'
import * as turf from '@turf/turf'

const aviationSelectionStore = useAviationSelectionStore()
const simulatedWebSocketStore = useSimulatedWebSocketStore()
const aircraftStore = useAircraftStore()


export type Graphic =turf.Feature<turf.Polygon>|turf.Feature<turf.Point>

interface GraphicObj{
  type:string,
  graphic:Graphic,
  billboards:Cesium.Billboard[],
  aircraftIcao24Set:Set<string>
}

interface BoxSelectionActive{
  type:string,
  dataSourceName:string,
  graphic:Graphic,
  billboards:Cesium.Billboard[]
}

interface BoxSelection{
  finishedGraphicMap:Map<string,GraphicObj>
  active:BoxSelectionActive
}

interface MatchedAircraft{
  aircrafts: Aircraft[],
  billboards: Cesium.Billboard[],
  billboardMap: Map<string, Cesium.Billboard>,
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
  const aircraftDataMap:Map<string, Aircraft>=new Map()
  const matched:MatchedAircraft={
    aircrafts:[],
    billboards:[],
    billboardMap:new Map(),
  }

  const boxSelection:BoxSelection={
    active:{
      type:'',
      dataSourceName:'',
      graphic:null,
      aircraftObj:{

      },
    },
    finishedGraphicMap:new Map(),
  }
  const matchedAircraftCount = ref<number>(0)

  // 初始化图元容器
  const aircraftGraphic: AircraftGraphic = {
    primitiveContainer: null,
    primitives: {
      billboards: null,
      billboardMap: new Map(),
      labelMap: new Map(),
      labels: null,
      selectedAircraft: { // 对应类型中的selectedAircraft，语义清晰
        routePolylines: null,
        planned: {
          trajectoryPolylineEntity: null,
          waypoints: null,
        },
      },
    },
  };

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
  const {initAircraftRoute, syncAircraftRoute, clearAircraftRoute } = useAircraftRoute(viewer, aircraftGraphic)
  const {
    syncAircraftPlannedTrajectory,
    setAircraftPlannedTrajectoryVisible,
    setAircraftPlannedWaypointsVisible,
    resetAircraftPlannedTrajectory,
    clearAircraftPlannedWaypoints,
    initPlannedTrajectoryCallback,
    initPlannedTrajectory,
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

    // 设置ID和属性
    aircraftGraphic.primitiveContainer.id = 'aircrafts_container'
    aircraftGraphic.primitives.billboards.id = 'aircrafts_billboards'
    aircraftGraphic.primitives.labels.id = 'aircrafts_labels'

    // 添加到容器
    aircraftGraphic.primitiveContainer.add(aircraftGraphic.primitives.billboards)
    aircraftGraphic.primitiveContainer.add(aircraftGraphic.primitives.labels)

    // 设置属性
    aircraftGraphic.primitiveContainer.properties = { sourceType: 'aircraft', type: 'container' }
    aircraftGraphic.primitives.billboards.properties = { sourceType: 'aircraft', type: 'billboards' }
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

  }

  const setaArcraftDataMap=(data:Aircraft[])=>{
    aircraftDataMap.clear()
    data.forEach(aircraft => aircraftDataMap.set(aircraft.icao24, aircraft))
  }

  // ========== 数据加载与渲染 ==========
  const loadAndDrawAircrafts = async (): void => {
    try {
      const res: AircraftStatesResponse = await getAircrafts()
      clearAircrafts()
      if (Array.isArray(res) && res.length > 0) {
        aircrafts = res
        setaArcraftDataMap(res)
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
          setaArcraftDataMap(data)
          drawAircrafts()
          // finishedBoxSelection()
        } else {
          const offset: number = newIndex * 0.02
          for (const aircraft of data) {
            aircraft.longitude += offset
            aircraft.latitude += offset
          }
          aircrafts = data
          setaArcraftDataMap(data)
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
        aircraftGraphic.primitives.billboardMap.set(aircraft.icao24,billboard)
        const label:Cesium.Label = aircraftGraphic.primitives.labelMap.get(aircraft.icao24)
        if (label){
          label.position = position
          aircraftGraphic.primitives.labelMap.set(aircraft.icao24,label)
        }
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

    const position:Cesium.Cartesian3 = Cesium.Cartesian3.fromDegrees(longitude, latitude, baroAltitude)

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
      dataSourceNameSet:new Set<string>()
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
      dataSourceNameSet:new Set<string>()
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
      [() => simulatedWebSocketStore.index, () => aviationSelectionStore.selected],
      () => {
        const selected: AviationSelectedData = aviationSelectionStore.selected
        if (selected === null) {
          clearAircraftRoute()
          resetAircraftPlannedTrajectory()
          clearAircraftPlannedWaypoints()
          return
        }
        if (selected?.sourceType === 'aircraft') {
          const currentIcao24 = selected.icao24
          // 同步航线
          syncAircraftRoute(currentIcao24, selected)
          // 同步计划轨迹
          syncAircraftPlannedTrajectory(currentIcao24, selected)
          const planned:TrajectoryGroup = aircraftStore.aircraftTrajectoryOptions.planned
          if (planned.trajectoryVisible) {
            initPlannedTrajectoryCallback()
            setAircraftPlannedTrajectoryVisible(true)
          }

          if (planned.waypointsVisible) {
            setAircraftPlannedWaypointsVisible(true)
          }
        } else {
          clearAircraftRoute()
          resetAircraftPlannedTrajectory()
          clearAircraftPlannedWaypoints()
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
    matched.aircrafts = []
    matched.billboards = []
    matched.billboardMap.clear()
    matchedAircraftCount.value = 0
    const form:AircraftFilterForm = aircraftStore.aircraftFilterForm
    const query:AircraftFilterQuery = {
      icao24: form.icao24?.trim().toLowerCase(),
      callsign: form.callsign?.trim().toLowerCase(),
      originCountry: form.originCountry?.trim().toLowerCase(),
    }

    let isSelectedAircraftMatched = false

    aircraftGraphic.primitives.billboardMap.forEach((billboard, icao24) => {
      //如果 billboard.properties 的原始类型不是 AircraftBaseProperties（比如是 any/unknown/Record<string, any>），
      // 直接用 const p: 类型 = 变量 属于「类型赋值」，TS 会严格校验原始类型是否兼容，大概率报类型不匹配错误；
      const p = billboard.properties as AircraftBaseProperties
      if (!p) return

      const match:boolean =
        (!query.icao24 || p.icao24.toLowerCase().includes(query.icao24)) &&
        (!query.callsign || (p.callsign ?? '').toLowerCase().includes(query.callsign)) &&
        (!query.originCountry || (p.originCountry ?? '').toLowerCase().includes(query.originCountry))

      if (match) {
        matchedAircraftCount.value++
        const selected:AviationSelectedData  = aviationSelectionStore.selected
        if (selected?.sourceType === 'aircraft' && p.icao24 === selected.icao24) {
          isSelectedAircraftMatched = true
        }
        matched.billboards.push(billboard)

        const aircraft:Aircraft = aircraftDataMap.get(icao24)
        if (aircraft) {
          matched.aircrafts.push(aircraft)
        }

        matched.billboardMap.set(icao24,billboard)
      }

      billboard.show = match
      const label:Cesium.Label|null = aircraftGraphic.primitives.labelMap.get(icao24)
      if (label) label.show = match
    })

    // 控制航线/容器显隐
    aircraftGraphic.primitives.selectedAircraft.routePolylines.show = isSelectedAircraftMatched
    aircraftGraphic.primitiveContainer.show = form.visible

    // finishedBoxSelection()
    emitCesiumEvent('aircraftFiltered')
  }, 300)

  // ========== 事件订阅 ==========
  let unsubAircraftHover: () => void
  let unsubAircraftLeave: () => void
  let unsubAircraftLeftClick: () => void
  let unsubMouseWheel: () => void;
  let unsubBoxSelection: () => void;

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

    unsubBoxSelection = onCesiumEvent('aircraftBoxSelected', (boxSelectionData) => {
      if (boxSelectionData.isActive) {
        activeBoxSelection(boxSelectionData)
      }else{
        const graphicObj={
          graphic:boxSelectionData.graphic,
          type:boxSelectionData.type,
          aircraftIcao24Set:new Set<string>()
        }
        // for(const )
        boxSelection.finishedGraphicMap.set(boxSelectionData.dataSourceName,graphicObj)
      }
    });
  }

  const finishedBoxSelection=():void=>{
    matched.aircrafts.forEach(aircraft => {
      // 构建Turf点
      const turfPoint:turf.Feature<turf.Point> = turf.point([aircraft.longitude, aircraft.latitude]);

      let isInPolygon:boolean=false
      for (const [dataSourceName, graphicObj] of boxSelection.finishedGraphicMap) {
        if (graphicObj.type === 'polygon') {
          isInPolygon = turf.booleanPointInPolygon(turfPoint, graphicObj.graphic);
        }

      }

      const billboard:Cesium.Billboard=matched.billboardMap.get(aircraft.icao24)

      if (!billboard) {
        return
      }

      if (isInPolygon) {
        // matched.boxSelection.billboards.push(billboard)
        highlightBillboardOnBoxSelection(billboard,airplaneBoxSelectionSvgRawDataUrl)
      } else {
        clearBoxSelectedHighlight(dataSourceName,billboard)
      }
    })
  }


  const activeBoxSelection=(boxSelectionData):void=>{
    boxSelection.active.type=boxSelectionData.type
    boxSelection.active.dataSourceName=boxSelectionData.dataSourceName
    boxSelection.active.graphic=boxSelectionData.graphic
    boxSelection.active.billboards=[]
    matched.aircrafts.forEach(aircraft => {
      // 构建Turf点
      const turfPoint:turf.Feature<turf.Point> = turf.point([aircraft.longitude, aircraft.latitude]);

      // 3. 判断是否在内，并修改颜色
      const isInPolygon:boolean = turf.booleanPointInPolygon(turfPoint, boxSelectionData.graphic);
      const billboard:Cesium.Billboard=matched.billboardMap.get(aircraft.icao24)

      if (!billboard) {
        return
      }

      if (isInPolygon) {
        boxSelection.active.billboards.push(billboard)
        highlightBillboardOnBoxSelection(boxSelectionData.dataSourceName,billboard,airplaneBoxSelectionSvgRawDataUrl)
      } else {
        clearBoxSelectedHighlight(boxSelectionData.dataSourceName,billboard)
      }
    })
  }

  const showAircraftTooltip = (screenPosition: Cesium.Cartesian2, properties: AircraftBaseProperties) => {
    updateTooltip<AircraftBaseProperties>(tooltip, screenPosition, properties)
  }

  const hideAircraftTooltip = (): void => {
    tooltip.visible = false
  }

  const clearAircrafts = (): void => {
    aircraftGraphic.primitives.billboards?.removeAll()
    aircraftGraphic.primitives.labels?.removeAll()
    aircraftGraphic.primitives.billboardMap.clear()
    aircraftGraphic.primitives.labelMap.clear()

    aircraftDataMap.clear()
    matchedAircraftCount.value = 0

    clearAircraftRoute()
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
    unsubBoxSelection?.()
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
  }
}
