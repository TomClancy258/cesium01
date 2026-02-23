import { reactive, watch,onUnmounted,ref } from 'vue'
import * as Cesium from 'cesium'
import { emitCesiumEvent, onCesiumEvent } from './useCesiumEvents'
import { getAircrafts, getAircraftRouteFull } from '@/network/aircraft'
import type { Aircraft, AircraftStatesResponse } from '@/network/aircraft/types/aircraft'
import {
  AircraftBaseProperties,
  AircraftBillboardProperties,
  AircraftSelectedData,
  AircraftLabelProperties,
  AircraftTooltipState,
} from '../types/aircraft'
import { isValidCoordinate, updateTooltip } from '@/utils/geoUtils'
import type { AircraftFilterForm } from '@/views/aviation-situation/types/aircraft'
import { highlightBillboardOnHover, highlightBillboardAndSetSelected,clearHoveredHighlight } from './useHighlightManager'
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
  AirportSelectedData
} from '@/views/aviation-situation/types/airport'

import {flyToPositionWithHeightOffset} from "@/utils/geoUtils"

import { useAircraftStore } from '@/stores/aircraft'
const aircraftStore = useAircraftStore()

import { useDebounceFn, useThrottleFn } from '@vueuse/core'
import type { MapBillboardLabelProperties } from '@/views/aviation-situation/types/shared'

interface AircraftPrimitives {
  billboards: Cesium.BillboardCollection | null
  billboardMap: Map<string, Cesium.Billboard>
  labelMap: Map<string, Cesium.Label>
  labels: Cesium.LabelCollection | null
  routePolylines: Cesium.PolylineCollection | null
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

export function useAircrafts(viewer) {
  let aircrafts: Aircraft[] = []
  let aircraftRoutes: RoutePoint[] = []
  let lastSelectedIcao24: string | null = null

  const matchedAircraftCount=ref<number>(0)

  const aircraftGraphic: AircraftGraphic = {
    primitiveContainer: null,
    primitives: {
      billboards: null,
      billboardMap: new Map(),
      labelMap: new Map(),
      labels: null,
      routePolylines: null,
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

  const hideAircraftTooltip = (): void => {
    tooltip.visible = false
  }

  const toggleAircraftsVisibility = (): void => {
    aircraftGraphic.primitiveContainer.show = !aircraftGraphic.primitiveContainer.show
  }

  const initAircrafts = () => {
    aircraftGraphic.primitiveContainer = new Cesium.PrimitiveCollection()
    aircraftGraphic.primitives.billboards = new Cesium.BillboardCollection()
    aircraftGraphic.primitives.labels = new Cesium.LabelCollection()
    aircraftGraphic.primitives.routePolylines = new Cesium.PolylineCollection()

    aircraftGraphic.primitiveContainer.id = 'aircrafts_container'
    aircraftGraphic.primitives.billboards.id = 'aircrafts_billboards'
    aircraftGraphic.primitives.labels.id = 'aircrafts_labels'
    aircraftGraphic.primitives.routePolylines.id = 'aircrafts_routePolylines'

    aircraftGraphic.primitiveContainer.add(aircraftGraphic.primitives.billboards)
    aircraftGraphic.primitiveContainer.add(aircraftGraphic.primitives.labels)
    aircraftGraphic.primitiveContainer.add(aircraftGraphic.primitives.routePolylines)

    aircraftGraphic.primitiveContainer.properties = { type: 'aircrafts' }
    aircraftGraphic.primitives.billboards.properties = { type: 'aircrafts' }
    aircraftGraphic.primitives.labels.properties = { type: 'aircrafts' }
    aircraftGraphic.primitives.routePolylines.properties = { type: 'aircraft_routePolylines' }

    viewer.value.scene.primitives.add(aircraftGraphic.primitiveContainer)

    setupHighlightWatch()
    setupSimulatedWebsocketWatch()
    setupAircraftFilterFormWatch()
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
    unwatchHighlight =watch(
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
    unwatchSimulatedWebsocket=watch(
      () => simulatedWebSocketStore.index,
      (newIndex: number, oldIndex: number) => {
        if (newIndex !== null) {
          syncAircrafts(newIndex)
          // const billboardsLen=aircraftGraphic.primitives.billboards.length
          // console.log("billboardsLen", billboardsLen);
          // const routeLen=aircraftGraphic.primitives.routePolylines.length
          // console.log("routeLen", routeLen);
        }
      },
      // { immediate: true } // 初始化时执行一次（保持原有逻辑）
    )
  }

  const setupAircraftFilterFormWatch = (): void => {
    unwatchAircraftFilterForm=watch(
      () => aircraftStore.aircraftFilterForm,
      (newForm: AircraftFilterForm, oldForm: AircraftFilterForm) => {
        filterAircrafts()
      },
      { deep: true }
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
          const offset:number=newIndex * 0.02
          for (const aircraft of data) {
            aircraft.longitude += offset
            aircraft.latitude += offset
          }
          aircrafts = data

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

      const billboard:Cesium.Billboard|undefined = aircraftGraphic.primitives.billboardMap.get(aircraft.icao24)
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
        const label:Cesium.Label = aircraftGraphic.primitives.labelMap.get(aircraft.icao24)
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
        aircraftRoutes=routeData
      }else{
        if (icao24 !== lastSelectedIcao24) {
          clearAircraftRoute()
          drawAircraftRoute(routeData, icao24)
        }else{
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
    aircraftRoutes=[]
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

    matchedAircraftCount.value=0
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
      // distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
      //   0,
      //   2000000
      // ),
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
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 3000000),
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
      matchedAircraftCount.value=0
      const form:AircraftFilterForm=aircraftStore.aircraftFilterForm

      const DEFAULT_ALPHA: number = 0.0
      const HIGHLIGHT_ALPHA: number = 1.0

      const query: AircraftFilterForm = {
        icao24: form.icao24?.trim().toLowerCase(),
        callsign: form.callsign?.trim().toLowerCase(),
        originCountry: form.originCountry?.trim().toLowerCase(),
      }

      let matchedBillboard: null | Cesium.Billboard = null

      // 高亮匹配项
      aircraftGraphic.primitives.billboardMap.forEach((billboard:Cesium.Billboard, icao24:string) => {
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

        const match: boolean =
          (!query.icao24 || p.icao24.toLowerCase().includes(query.icao24)) &&
          (!query.callsign || (p.callsign ?? '').toLowerCase().includes(query.callsign)) &&
          (!query.originCountry || (p.originCountry ?? '').toLowerCase().includes(query.originCountry))

        const alpha = match ? HIGHLIGHT_ALPHA : DEFAULT_ALPHA
        if (match) {
          matchedAircraftCount.value++
          matchedBillboard = billboard
        }

        // billboard.color = billboard.properties.originalColor.withAlpha(alpha)
        // const label:Cesium.Label = aircraftGraphic.primitives.labelMap.get(icao24)
        // label.fillColor = label.properties.originalFillColor.withAlpha(alpha)

        billboard.show = match
        const label: Cesium.Label = aircraftGraphic.primitives.labelMap.get(icao24)
        label.show = match
      })
      if (matchedAircraftCount.value === 0) {
        // ElNotification({
        //   title: '提示',
        //   message: '未查询到匹配的飞机信息，请检查筛选条件后重试',
        //   type: 'warning',
        // });
      } else if (matchedAircraftCount.value === 1) {
        flyToPositionWithHeightOffset(viewer.value, matchedBillboard.position, 1000000);
      }
    }, 300)

  // ===== 新增：内部订阅飞机事件 =====
  let unsubAircraftHover: () => void;
  let unsubAircraftLeave: () => void;
  let unsubAircraftLeftClick: () => void;

  const subscribeAircraftEvents = () => {
    // 订阅飞机hover事件
    unsubAircraftHover = onCesiumEvent('aircraftHover', (properties:AircraftBaseProperties, position:Cesium.Cartesian2, billboard:Cesium.Billboard) => {
      // console.log("aircraftHover 事件触发了！");
      showAircraftTooltip(position, properties);
      highlightBillboardOnHover(billboard, airplaneHoveredSvgRawDataUrl)
    });

    // 订阅飞机leave事件
    unsubAircraftLeave = onCesiumEvent('aircraftLeave', () => {
      hideAircraftTooltip();
      clearHoveredHighlight();
    });

    // 订阅飞机点击事件
    unsubAircraftLeftClick = onCesiumEvent('aircraftLeftClick', (data:AircraftSelectedData, billboard:Cesium.Billboard) => {
      highlightBillboardAndSetSelected(data, billboard, airplaneSelectedSvgRawDataUrl)
    });
  };

  // 初始化时自动订阅事件
  subscribeAircraftEvents();

  // ===== 组件卸载时取消订阅 =====
  onUnmounted(() => {
    unsubAircraftHover?.();
    unsubAircraftLeave?.();
    unsubAircraftLeftClick?.();

    unwatchHighlight?.();
    unwatchSimulatedWebsocket?.();
    unwatchAircraftFilterForm?.();
  });

  return {
    initAircrafts,
    loadAndDrawAircrafts,
    syncAircrafts,

    showAircraftTooltip,
    hideAircraftTooltip,
    tooltip,

    filterAircrafts,

    toggleAircraftsVisibility,
    matchedAircraftCount
  }
}
