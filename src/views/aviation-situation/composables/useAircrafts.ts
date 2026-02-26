import { reactive, watch, onUnmounted, ref } from 'vue'
import * as Cesium from 'cesium'
import { emitCesiumEvent, onCesiumEvent } from './useCesiumEvents'
import { getAircrafts, getAircraftRouteFull,getAircraftPlannedTrajectory } from '@/network/aircraft'
import type { Aircraft, AircraftStatesResponse } from '@/network/aircraft/types/aircraft'
import {
  AircraftBaseProperties,
  AircraftBillboardProperties,
  AircraftSelectedData,
  AircraftLabelProperties,
  AircraftTooltipState,
} from '../types/aircraft'
import { getCameraHeight, isValidCoordinate, updateTooltip } from '@/utils/geoUtils'
import type { AircraftFilterForm } from '@/views/aviation-situation/types/aircraft'
import {
  highlightBillboardOnHover,
  highlightBillboardAndSetSelected,
  clearHoveredHighlight,
} from './useHighlightManager'
import { useHighlightStore } from '@/stores/highlight'

const highlightStore = useHighlightStore()

import { useSimulatedWebSocketStore } from '@/stores/simulateWebSocket'

const simulatedWebSocketStore = useSimulatedWebSocketStore()

import airplaneBlueSvgRaw from '@/assets/img/airplane/svg/airplane-blue.svg?raw'

const airplaneBlueSvgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airplaneBlueSvgRaw)}`

import airplaneHoveredSvgRaw from '@/assets/img/airplane/svg/airplane-hovered.svg?raw'

const airplaneHoveredSvgRawDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airplaneHoveredSvgRaw)}`

import airplaneSelectedSvgRaw from '@/assets/img/airplane/svg/airplane-selected.svg?raw'

const airplaneSelectedSvgRawDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airplaneSelectedSvgRaw)}`

import { RoutePoint } from '@/network/aircraft/types/route-full'

import {
  AirportBillboardProperties,
  AirportSelectedData,
} from '@/views/aviation-situation/types/airport'

import { flyToPositionWithHeightOffset } from '@/utils/geoUtils'

import { useAircraftStore } from '@/stores/aircraft'
const aircraftStore = useAircraftStore()

import { useDebounceFn, useThrottleFn } from '@vueuse/core'
import type { AviationSelectedData } from '@/views/aviation-situation/types/shared'

interface AircraftPrimitives {
  billboards: Cesium.BillboardCollection | null
  billboardMap: Map<string, Cesium.Billboard>
  labelMap: Map<string, Cesium.Label>
  labels: Cesium.LabelCollection | null
  routePolylines: Cesium.PolylineCollection | null
  routeFullEntity: Cesium.Entity | null
}

interface AircraftGraphic {
  primitiveContainer: Cesium.PrimitiveCollection | null
  primitives: AircraftPrimitives
}

// 高度-颜色映射配置（集中管理，可抽离为常量文件）
const altitudeColorMap = [
  { min: -Infinity, max: 0, color: 'rgba(0, 255, 0, 1)' }, // 0 及以下：绿色
  { min: 0, max: 1000, color: 'rgba(173, 255, 47, 1)' }, // 0-1000：浅绿
  { min: 1000, max: 3000, color: 'rgba(255, 255, 0, 1)' }, // 1000-3000：黄色
  { min: 3000, max: 5000, color: 'rgba(255, 165, 0, 1)' }, // 3000-5000：橙色
  { min: 5000, max: 8000, color: 'rgba(255, 0, 0, 1)' }, // 5000-8000：红色
  { min: 8000, max: 10000, color: 'rgba(128, 0, 128, 1)' }, // 8000-10000：紫色
  { min: 10000, max: Infinity, color: 'rgba(128, 0, 128, 1)' }, // 10000+：紫色
]
/**
 * 根据高度值获取对应区间的固定颜色（优化版配置式）
 * @param altitude 高度（米）
 * @returns Cesium.Color
 */
const getColorByAltitude = (altitude: number): Cesium.Color => {
  // 处理 null/undefined/非数字高度
  if (altitude === null || altitude === undefined || isNaN(altitude)) {
    return 'rgba(128, 128, 128, 0.8)' // 灰色兜底
  }

  // 查找匹配的区间颜色
  const matchItem = altitudeColorMap.find((item) => altitude >= item.min && altitude < item.max)
  return matchItem ? matchItem.color : 'rgba(128, 128, 128, 0.8)'
}

export function useAircrafts(viewer,onCameraEvent: (type: CameraEventType, callback: CameraEventCallback) => () => void) {
  const AIRCRAFT_LABEL_SHOW_DISTANCE = 2000*1000; // 单位：米

  let aircrafts: Aircraft[] = []
  let aircraftRoutes: RoutePoint[] = []
  let lastSelectedIcao24: string | null = null
  let matchedBillboards:Cesium.Billboard[]=[]

  const matchedAircraftCount = ref<number>(0)

  const aircraftGraphic: AircraftGraphic = {
    primitiveContainer: null,
    primitives: {
      billboards: null,
      billboardMap: new Map(),
      labelMap: new Map(),
      labels: null,
      routePolylines: null,
      routeFullEntity: null,
    },
  }
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

  // ========== 修改：移除原相机事件的 inject，直接使用传递的 onCameraEvent ==========
  let unsubCameraMoveEnd: () => void;

  // 计算相机到地面的距离，控制机场显隐
  const handleCameraMoveEnd = (camera: Cesium.Camera) => {
    if (!aircraftStore.aircraftFilterForm.visible) return;
    if (!aircraftGraphic.primitiveContainer) return;

    // 计算相机位置到地面的距离
    const cameraHeight:number = getCameraHeight(camera);

    // 核心逻辑：高度小于阈值显示机场，大于则隐藏
    setAircraftsLabelVisible(cameraHeight <= AIRCRAFT_LABEL_SHOW_DISTANCE)
  };

  const setAircraftsLabelVisible=(isVisible):void=>{
    aircraftGraphic.primitives.labels.show=isVisible
  }


  // 订阅相机moveEnd事件（使用传递的 onCameraEvent）
  const subscribeCameraEvents = () => {
    unsubCameraMoveEnd = onCameraEvent('moveEnd', handleCameraMoveEnd);
  };
  // ========== 相机事件修改结束 ==========

  const hideAircraftTooltip = (): void => {
    tooltip.visible = false
  }

  const initAircrafts = () => {
    aircraftGraphic.primitiveContainer = new Cesium.PrimitiveCollection()
    aircraftGraphic.primitives.billboards = new Cesium.BillboardCollection()
    aircraftGraphic.primitives.labels = new Cesium.LabelCollection()
    aircraftGraphic.primitives.routePolylines = new Cesium.PolylineCollection()

    aircraftGraphic.primitiveContainer.id = 'aircrafts_container'
    aircraftGraphic.primitives.billboards.id = 'aircrafts_billboards'
    aircraftGraphic.primitives.labels.id = 'aircrafts_labels'
    aircraftGraphic.primitives.routePolylines.id = 'aircraft_routePolylines'

    aircraftGraphic.primitiveContainer.add(aircraftGraphic.primitives.billboards)
    aircraftGraphic.primitiveContainer.add(aircraftGraphic.primitives.labels)
    aircraftGraphic.primitiveContainer.add(aircraftGraphic.primitives.routePolylines)

    aircraftGraphic.primitiveContainer.properties = { sourceType: 'aircraft',type:'container' }
    aircraftGraphic.primitives.billboards.properties = { sourceType: 'aircraft' ,type:'billboards'}
    aircraftGraphic.primitives.labels.properties = { sourceType: 'aircraft',type:'labels' }
    aircraftGraphic.primitives.routePolylines.properties = { sourceType:'aircraft',type: 'aircraft_routePolylines' }

    viewer.value.scene.primitives.add(aircraftGraphic.primitiveContainer)

    aircraftGraphic.primitives.routeFullEntity = viewer.value.entities.add({
      id: 'aircraftPlannedTrajectory',
      show: false, // 默认隐藏
      properties: {
        sourceType: 'aircraft',
        type:'aircraft_planned_trajectory'
      },
      polyline: {
        width: 3,
        material: Cesium.Color.RED.withAlpha(0.8),
        clampToGround: false,
      },
    })

    setAircraftsLabelVisible(false)

    setupHighlightWatch()
    setupSimulatedWebsocketWatch()

    setupAircraftFilterFormWatch()

    subscribeCameraEvents()
  }

  const loadAndDrawAircrafts = async (): void => {
    try {
      const res: AircraftStatesResponse = await getAircrafts()
      clearAircrafts()
      if (Array.isArray(res) && res.length > 0) {
        // aircrafts = res.slice(0,10)
        aircrafts = res
        drawAircrafts()
      } else {
        console.warn('飞机数据为空或格式错误:', data)
      }
    } catch (error) {
      console.error('加载飞机数据失败:', error)
      clearAircrafts()
    }
  }

  let unwatchHighlight: () => void
  let unwatchSimulatedWebsocket: () => void
  let unwatchAircraftFilterForm: () => void

  const setupHighlightWatch = (): void => {
    // index 或 selected 变化时，执行飞机选中/路径逻辑
    unwatchHighlight = watch(
      [() => simulatedWebSocketStore.index, () => highlightStore.selected],
      (newVals, oldVals) => {
        const selected: AircraftSelectedData | AirportSelectedData | null = highlightStore.selected

        if (selected === null) {
          clearAircraftRoute()
          lastSelectedIcao24 = null
          return
        }
        if (selected?.sourceType === 'aircraft') {
          const currentIcao24: string = selected.icao24
          syncAircraftRoute(currentIcao24, selected)
        } else {
          clearAircraftRoute()
          lastSelectedIcao24 = null
        }
      },
      {
        // immediate: true,
        // deep: true // 必须开启：监听 selected 对象内部属性变化
      },
    )
  }

  const setupSimulatedWebsocketWatch = (): void => {
    unwatchSimulatedWebsocket = watch(
      () => simulatedWebSocketStore.index,
      (newIndex: number, oldIndex: number) => {
        if (newIndex !== null) {
          syncAircrafts(newIndex)
        }
      },
      // { immediate: true } // 初始化时执行一次（保持原有逻辑）
    )
  }

  const setupAircraftFilterFormWatch = (): void => {
    unwatchAircraftFilterForm = watch(
      () => aircraftStore.aircraftFilterForm,
      (newForm: AircraftFilterForm, oldForm: AircraftFilterForm) => {
        filterAircrafts()
        handleCameraMoveEnd(viewer.value.camera)
      },
      { deep: true },
    )
  }

  // 仅用于开发调试！生产环境应禁用
  const generateMockAircrafts = (count: number): Aircraft[] => {
    return Array.from({ length: count }, (_, i) => ({
      icao24: 'CN' + String(i).padStart(4, '0'),
      latitude: 30 + Math.random() * 10,
      longitude: 100 + Math.random() * 20,
      baroAltitude: Math.random() > 0.2 ? 8000 + Math.random() * 5000 : null,
      heading: Math.random() * 360,
      callsign: 'CES' + (1000 + i),
      onGround: Math.random() > 0.8,
      // ... 其他字段
    }))
  }

  const syncAircrafts = async (newIndex: number): void => {
    try {
      const data: AircraftStatesResponse = await getAircrafts()
      if (Array.isArray(data) && data.length > 0) {
        // data = data.slice(newIndex*10)

        // data = [...data, ...generateMockAircrafts(100)];
        if (aircrafts.length === 0) {
          aircrafts = data
          drawAircrafts()
        } else {
          // clearAircrafts()
          const offset: number = newIndex * 0.02
          for (const aircraft of data) {
            aircraft.longitude += offset
            aircraft.latitude += offset
          }
          aircrafts = data
          // drawAircrafts()

          // const selected: AircraftSelectedData | AirportSelectedData | null = highlightStore.selected
          // if (selected !== null) {
          //   if (selected.sourceType === 'aircraft') {
          //     console.log('执行一次')
          //     const longitude: number = selected.position.longitude + offset
          //     const latitude: number = selected.position.latitude + offset
          //     const baroAltitude: number = selected.position.baroAltitude
          //     highlightStore.setSelectedPosition(longitude, latitude, baroAltitude)
          //   }
          // }

          refreshAircraftsInScene(data) // 核心更新逻辑
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
    const newIcaoSet = new Set<string>() // 存储新数据的所有 icao24

    // 1. 更新或添加飞机
    for (const aircraft of newAircrafts) {
      newIcaoSet.add(aircraft.icao24)

      const billboard: Cesium.Billboard | undefined = aircraftGraphic.primitives.billboardMap.get(
        aircraft.icao24,
      )
      if (billboard) {
        // ✅ 更新现有飞机
        const position: Cesium.Cartesian3 = Cesium.Cartesian3.fromDegrees(
          aircraft.longitude,
          aircraft.latitude,
          aircraft.baroAltitude,
        )
        billboard.position = position
        billboard.rotation = -Cesium.Math.toRadians(aircraft.heading)

        // 同步更新 label 位置（如果需要）
        const label: Cesium.Label = aircraftGraphic.primitives.labelMap.get(aircraft.icao24)
        if (label) label.position = position
      } else {
        // ✅ 添加新飞机
        drawAircraft(aircraft)
      }
    }

    // 2. 移除已消失的飞机（高效！）
    for (const icao24 of aircraftGraphic.primitives.billboardMap.keys()) {
      if (!newIcaoSet.has(icao24)) {
        removeAircraft(icao24)
      }
    }

    // 3. 原子性更新全局状态
    aircrafts = newAircrafts
  }

  const drawAircraftRoute = (routeData: RoutePoint[], icao24: string): void => {
    // 遍历路径点，逐段绘制（每两个点组成一条线段，按第二个点高度着色）
    for (let i = 0; i < routeData.length - 1; i++) {
      const startPoint: RoutePoint = routeData[i]
      const endPoint: RoutePoint = routeData[i + 1]

      // 校验坐标有效性
      if (
        !isValidCoordinate(startPoint.longitude, startPoint.latitude, startPoint.baroAltitude) ||
        !isValidCoordinate(endPoint.longitude, endPoint.latitude, endPoint.baroAltitude)
      ) {
        continue
      }

      // 构建线段坐标（两个点）
      const positions: Cesium.Cartesian3[] = Cesium.Cartesian3.fromDegreesArrayHeights([
        startPoint.longitude,
        startPoint.latitude,
        startPoint.baroAltitude,
        endPoint.longitude,
        endPoint.latitude,
        endPoint.baroAltitude,
      ])

      // 按第二个点高度获取颜色
      const segmentColor: string = getColorByAltitude(endPoint.baroAltitude)
      // console.log("segmentColor", segmentColor);
      // 添加单段线到集合
      aircraftGraphic.primitives.routePolylines.add({
        id: `aircraftRoute_${icao24}_segment_${i}`, // 唯一标识每段线
        positions: positions,
        width: 2,
        arcType: Cesium.ArcType.GEODESIC,
        material: Cesium.Material.fromType('Color', {
          color: Cesium.Color.fromCssColorString(segmentColor),
        }),
      })
      aircraftGraphic.primitives.routePolylines.show = true
    }
  }

  /**
   * 加载并绘制飞机路径（核心优化版）
   * @param icao24 飞机唯一标识
   */
  const syncAircraftRoute = async (icao24: string, selected: AircraftSelectedData): void => {
    if (!icao24 || !aircraftGraphic.primitives.routePolylines) return
    try {
      const routeData: RoutePoint[] = await getAircraftRouteFull(icao24)
      routeData.push({
        latitude: selected.position.latitude,
        longitude: selected.position.longitude,
        baroAltitude: selected.position.baroAltitude, // 英尺
      })
      if (!Array.isArray(routeData) || routeData.length < 2) {
        clearAircraftRoute()
        return
      }
      if (aircraftRoutes.length === 0) {
        drawAircraftRoute(routeData, icao24)
        aircraftRoutes = routeData
      } else {
        if (icao24 !== lastSelectedIcao24) {
          clearAircraftRoute()
          drawAircraftRoute(routeData, icao24)
        } else {
          //   processAircraftRouteUpdate(routeData, icao24)
        }
      }
    } catch (error) {
      console.error('绘制飞机路径失败:', error)
      clearAircraftRoute()
    }
    lastSelectedIcao24 = icao24
  }

  const clearAircraftRoute = (): void => {
    aircraftGraphic.primitives.routePolylines.removeAll()
    aircraftRoutes = []
  }

  const getAircraftImageByAltitude = (altitude): string => {
    if (altitude > 10000) {
      return aircraft01DataUrl
    } else if (altitude > 5000) {
      return airplaneBlueSvgDataUrl
    } else if (altitude > 2000) {
      return airplaneDarkSvgDataUrl
    } else {
      return airplanePurpleSvgDataUrl
    }
  }

  const clearAircrafts = (): void => {
    aircraftGraphic.primitives.billboards.removeAll()
    aircraftGraphic.primitives.labels.removeAll()
    aircraftGraphic.primitives.routePolylines.removeAll()

    aircraftGraphic.primitives.billboardMap.clear()
    aircraftGraphic.primitives.labelMap.clear()

    matchedAircraftCount.value = 0
  }

  const removeAircraft = (icao24: string): void => {
    const billboard: Cesium.Billboard = aircraftGraphic.primitives.billboardMap.get(icao24)
    const label: Cesium.Label = aircraftGraphic.primitives.labelMap.get(icao24)

    if (billboard && aircraftGraphic.primitives.billboards) {
      aircraftGraphic.primitives.billboards.remove(billboard)
    }
    if (label && aircraftGraphic.primitives.labels) {
      aircraftGraphic.primitives.labels.remove(label)
    }

    aircraftGraphic.primitives.billboardMap.delete(icao24)
    aircraftGraphic.primitives.labelMap.delete(icao24)
  }

  const drawAircraft = (aircraft: Aircraft): void => {
    const longitude: number = aircraft.longitude
    const latitude: number = aircraft.latitude
    const altitude: number = aircraft.baroAltitude
    const callsign: string = aircraft.callsign
    const heading: number = aircraft.heading

    if (!isValidCoordinate(longitude, latitude, altitude)) {
      return
    }

    const position: Cesium.Cartesian3 = Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude)

    // const aircraftImageByAltitude = getAircraftImageByAltitude(altitude)

    // 添加 Billboard
    const billboard: Cesium.Billboard = aircraftGraphic.primitives.billboards.add({
      id: 'aircraft_billboard_' + aircraft.icao24,
      show: true,
      position: position,
      image: airplaneBlueSvgDataUrl,
      // image: aircraftImageByAltitude,
      rotation: -Cesium.Math.toRadians(heading), // 负数是因为Cesium的旋转方向
      width: 30,
      height: 30,
      // disableDepthTestDistance: Number.POSITIVE_INFINITY,
    })

    billboard.properties = {
      type: 'billboard',
      sourceType: 'aircraft',
      icao24: aircraft.icao24,
      originCountry: aircraft.originCountry,
      callsign,
      longitude,
      latitude,
      baroAltitude: aircraft.baroAltitude,
      heading,
      originalColor: billboard.color,
      originalImage: billboard.image,
    } satisfies AircraftBillboardProperties

    // 添加 Label
    const label: Cesium.Label = aircraftGraphic.primitives.labels.add({
      show: true,
      id: 'aircraft_label_' + aircraft.icao24,
      position: position,
      text: aircraft.callsign,
      font: '14px sans-serif',
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      outlineWidth: 2,
      verticalOrigin: Cesium.VerticalOrigin.TOP,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      pixelOffset: new Cesium.Cartesian2(0, 20),
      // distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 3000000),
      outlineColor: Cesium.Color.BLACK,
      // disableDepthTestDistance: Number.POSITIVE_INFINITY,
    })

    label.properties = {
      type: 'label',
      sourceType: 'aircraft',
      icao24: aircraft.icao24,
      originCountry: aircraft.originCountry,
      callsign,
      longitude,
      latitude,
      baroAltitude: aircraft.baroAltitude,
      heading,
      originalFillColor: label.fillColor,
    } satisfies AircraftLabelProperties

    aircraftGraphic.primitives.billboardMap.set(aircraft.icao24, billboard)
    aircraftGraphic.primitives.labelMap.set(aircraft.icao24, label)
  }

  const drawAircrafts = (): void => {
    for (const aircraft of aircrafts) {
      drawAircraft(aircraft)
    }
  }

  const showAircraftTooltip = (
    screenPosition: Cesium.Cartesian2,
    properties: AircraftBaseProperties,
  ) => {
    updateTooltip<AircraftBaseProperties>(tooltip, screenPosition, properties)
    // tooltip.position.left = screenPosition.x + 10
    // tooltip.position.top = screenPosition.y + 50
    // tooltip.properties = { ...properties }
    // tooltip.visible = true
  }

  const filterAircrafts = useDebounceFn((): void => {
    matchedBillboards=[]
    matchedAircraftCount.value = 0
    const form: AircraftFilterForm = aircraftStore.aircraftFilterForm

    const DEFAULT_ALPHA: number = 0.0
    const HIGHLIGHT_ALPHA: number = 1.0

    const query: AircraftFilterForm = {
      icao24: form.icao24?.trim().toLowerCase(),
      callsign: form.callsign?.trim().toLowerCase(),
      originCountry: form.originCountry?.trim().toLowerCase(),
    }

    let isSelectedAircraftMatched:boolean=false

    // 高亮匹配项
    aircraftGraphic.primitives.billboardMap.forEach(
      (billboard: Cesium.Billboard, icao24: string) => {
        const p: AircraftBaseProperties = billboard.properties
        if (!p) return

        // if (p.callsign===null) {
        //   console.log("p.callsign", p.callsign);
        //   console.log("typeof p.callsign",typeof p.callsign);
        // }
        // if (p.originCountry===null) {
        //   console.log("form.originCountry", p.originCountry);
        //   console.log("typeof p.originCountry", typeof p.originCountry);
        // }

        //?? 是 ES2020 引入的空值合并操作符，作用是：当左侧值为 null 或 undefined 时，返回右侧默认值；否则返回左侧值。
        const match: boolean =
          (!query.icao24 || p.icao24.toLowerCase().includes(query.icao24)) &&
          (!query.callsign || (p.callsign ?? '').toLowerCase().includes(query.callsign)) &&
          (!query.originCountry || (p.originCountry ?? '').toLowerCase().includes(query.originCountry))

        const alpha = match ? HIGHLIGHT_ALPHA : DEFAULT_ALPHA
        if (match) {
          matchedAircraftCount.value++
          const selected:AviationSelectedData=highlightStore.selected
          if (selected?.sourceType === 'aircraft') {
            if(p.icao24===selected.icao24){
              isSelectedAircraftMatched=true
            }
          }
          matchedBillboards.push(billboard)
        }

        // billboard.color = billboard.properties.originalColor.withAlpha(alpha)
        // const label:Cesium.Label = aircraftGraphic.primitives.labelMap.get(icao24)
        // label.fillColor = label.properties.originalFillColor.withAlpha(alpha)

        billboard.show = match
        const label: Cesium.Label = aircraftGraphic.primitives.labelMap.get(icao24)
        label.show = match
      },
    )

    aircraftGraphic.primitives.routePolylines.show=isSelectedAircraftMatched
    aircraftGraphic.primitiveContainer.show=form.visible

    if (matchedAircraftCount.value === 0) {
      // ElNotification({
      //   title: '提示',
      //   message: '未查询到匹配的飞机信息，请检查筛选条件后重试',
      //   type: 'warning',
      // });
    } else if (matchedAircraftCount.value === 1) {
      // flyToPositionWithHeightOffset(viewer.value, matchedBillboard.position, 1000000)
    }
  }, 300)

  const flyToMatchedAircrafts=()=>{
    // const b1=aircraftGraphic.primitives.billboardMap.get("7609f0")
    // const b2=aircraftGraphic.primitives.billboardMap.get("adbef0")
    // matchedBillboards=[b1,b2]
    flyToMatchedBillboards(matchedBillboards)
  }

  /**
   * 计算并让相机飞至刚好显示所有匹配billboard的视角
   * @param matchedBillboards 匹配的飞机billboard数组
   */
  const flyToMatchedBillboards = (matchedBillboards: Cesium.Billboard[]) => {
    if (!viewer.value || matchedBillboards.length === 0) return;

    // 1. 提取所有billboard的坐标点
    const positions: Cesium.Cartesian3[] = [];
    matchedBillboards.forEach((billboard) => {
      const position = billboard.position;
      if (Cesium.defined(position)) {
        positions.push(position);
      }
    });

    if (positions.length === 0) return;

    // 2. 计算包围盒（BoundingSphere）
    const boundingSphere = Cesium.BoundingSphere.fromPoints(positions);

    // 3. 处理单点特殊情况（避免相机无限近）
    if (positions.length === 1) {
      viewer.value.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          Cesium.Cartographic.fromCartesian(positions[0]).longitude,
          Cesium.Cartographic.fromCartesian(positions[0]).latitude,
          50000 // 单点时默认高度50公里
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-45), // 45度俯视
          roll: 0.0
        },
        duration: 2.0, // 飞行时长
        maximumHeight: 1000000, // 最大飞行高度限制
      });
      return;
    }

    // 4. 计算合适的相机视角（自动适配所有点）
    const camera = viewer.value.camera;
    const offset = new Cesium.HeadingPitchRange(
      Cesium.Math.toRadians(0), // 朝向
      Cesium.Math.toRadians(-60), // 俯仰角（60度俯视，可调整）
      boundingSphere.radius * 2.5 // 距离包围盒中心的距离（适配视野）
    );

    // 5. 执行飞行
    viewer.value.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(0, 0, 0), // 占位，会被target替换
      target: boundingSphere, // 目标包围盒
      offset: offset,
      duration: 2.0, // 飞行过渡时间（秒）
      maximumHeight: boundingSphere.radius * 5, // 限制最大高度
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT, // 平滑过渡
      complete: () => {
        // 飞行完成后微调（可选）
        camera.lookAt(
          boundingSphere.center,
          new Cesium.Cartesian3(0, -boundingSphere.radius * 2, boundingSphere.radius)
        );
      },
      cancel: () => console.warn('相机飞行被取消'),
      fail: (error) => console.error('相机飞行失败:', error)
    });
  };

  // ===== 新增：内部订阅飞机事件 =====
  let unsubAircraftHover: () => void
  let unsubAircraftLeave: () => void
  let unsubAircraftLeftClick: () => void
  let unsubMouseWheel: () => void;

  const subscribeAircraftEvents = () => {
    // 订阅飞机hover事件
    unsubAircraftHover = onCesiumEvent(
      'aircraftHover',
      (
        properties: AircraftBaseProperties,
        position: Cesium.Cartesian2,
        billboard: Cesium.Billboard,
      ) => {
        // console.log("aircraftHover 事件触发了！");
        showAircraftTooltip(position, properties)
        highlightBillboardOnHover(billboard, airplaneHoveredSvgRawDataUrl)
      },
    )

    // 订阅飞机leave事件
    unsubAircraftLeave = onCesiumEvent('aircraftLeave', () => {
      hideAircraftTooltip()
      clearHoveredHighlight()
    })

    // 订阅飞机点击事件
    unsubAircraftLeftClick = onCesiumEvent(
      'aircraftLeftClick',
      (data: AircraftSelectedData, billboard: Cesium.Billboard) => {
        highlightBillboardAndSetSelected(data, billboard, airplaneSelectedSvgRawDataUrl)
      },
    )

    //订阅鼠标wheel事件
    unsubMouseWheel= onCesiumEvent('mouseWheel', () => {
      handleCameraMoveEnd(viewer.value.camera)
    });
  }

  // 初始化时自动订阅事件
  subscribeAircraftEvents()

  // ===== 组件卸载时取消订阅 =====
  onUnmounted(() => {
    unsubAircraftHover?.()
    unsubAircraftLeave?.()
    unsubAircraftLeftClick?.()

    unwatchHighlight?.()
    unwatchSimulatedWebsocket?.()
    unwatchAircraftFilterForm?.()

    unsubCameraMoveEnd?.(); // 取消相机事件订阅
    unsubMouseWheel?.();

    aircraftStore.resetAircraftFilterForm()
  })

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
