import { reactive,watch } from 'vue'
import * as Cesium from 'cesium'
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
import { highlightBillboardOnHover, highlightBillboardAndSetSelected } from './useHighlightManager'
import { useHighlightStore } from '@/stores/highlight'
const highlightStore = useHighlightStore()

import airplaneBlueSvgRaw from '@/assets/img/airplane/svg/airplane-blue.svg?raw'

const airplaneBlueSvgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airplaneBlueSvgRaw)}`

import airplaneHoveredSvgRaw from '@/assets/img/airplane/svg/airplane-hovered.svg?raw'

const airplaneHoveredSvgRawDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airplaneHoveredSvgRaw)}`

import airplaneSelectedSvgRaw from '@/assets/img/airplane/svg/airplane-selected.svg?raw'

const airplaneSelectedSvgRawDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airplaneSelectedSvgRaw)}`

interface AircraftPrimitives {
  billboards: Cesium.BillboardCollection | null
  billboardMap: Map<string, Cesium.Billboard>
  labelMap: Map<string, Cesium.Label>
  labels: Cesium.LabelCollection | null
  // routePolyline: Cesium.PolylineCollection | null
  routeEntity: Cesium.Entity | null
}

interface AircraftGraphic {
  primitiveContainer: Cesium.PrimitiveCollection | null
  primitives: AircraftPrimitives
}

export function useAircrafts(viewer) {
  let aircrafts: Aircraft[] = []

  const aircraftGraphic: AircraftGraphic = {
    primitiveContainer: null,
    primitives: {
      billboards: null,
      billboardMap: new Map(),
      labelMap: new Map(),
      labels: null,
      // routePolyline: null,
      routeEntity: null,
    },
  }
  const tooltip = reactive<AircraftTooltipState>({
    visible: false,
    position: { left: 0, top: 0 },
    properties: {
      type: '',
      sourceType: 'aircraft',
      icao24: '',
      origin_country: '',
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
    // aircraftGraphic.primitives.routePolyline = new Cesium.PolylineCollection()

    aircraftGraphic.primitiveContainer.add(aircraftGraphic.primitives.billboards)
    aircraftGraphic.primitiveContainer.add(aircraftGraphic.primitives.labels)
    // aircraftGraphic.primitiveContainer.add(aircraftGraphic.primitives.routePolyline)
    aircraftGraphic.primitiveContainer.data = { type: 'aircrafts' }

    viewer.value.scene.primitives.add(aircraftGraphic.primitiveContainer)

    aircraftGraphic.primitives.routeEntity = viewer.value.entities.add({
      id:'aircraftRoute',
      show: false, // 默认隐藏
      polyline: {
        width: 3,
        material: Cesium.Color.RED.withAlpha(0.8),
        clampToGround: false,
        // positions: Cesium.Cartesian3.fromDegreesArrayHeights([]), // 空坐标
      },
    })
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

  const loadAndDrawAircraftRoute = async (aircraftData: AircraftSelectedData):void => {
    if (!aircraftGraphic.primitives.routeEntity) return

    const routeData = await getAircraftRouteFull(aircraftData.icao24)

    const positions = []
    for (const point of routeData) {
      if (!isValidCoordinate(point.longitude, point.latitude, point.baroAltitude)) {
        continue
      }
      positions.push(point.longitude, point.latitude, point.baroAltitude)
    }
    const selected=highlightStore.selected
    positions.push(selected.position.longitude, selected.position.latitude, selected.position.baroAltitude)

    // 第二步：更新坐标 + 控制显示
    if (positions.length > 0) {
      aircraftGraphic.primitives.routeEntity.polyline.positions = Cesium.Cartesian3.fromDegreesArrayHeights(positions)
      aircraftGraphic.primitives.routeEntity.show = true // 显示路径
    } else {
      aircraftGraphic.primitives.routeEntity.show = false // 无坐标则隐藏
    }
  }

  const setupHighlightWatch = () => {
    watch(
      () => highlightStore.selected,
      (newSelected) => {
        // console.log("newSelected", newSelected);
        if (newSelected?.sourceType === 'aircraft') {
          // 选中飞机：更新路径并显示
          loadAndDrawAircraftRoute(newSelected as AircraftSelectedData)
        } else {
          // 未选中/非飞机：隐藏路径
          if (aircraftGraphic.primitives.routeEntity) {
            aircraftGraphic.primitives.routeEntity.show = false
          }
        }
      },
      // { immediate: true, deep: true }
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

  const updateAircrafts = async (aircraftsIndex: number): void => {
    try {
      const newData: AircraftStatesResponse = await getAircrafts()
      if (Array.isArray(newData) && newData.length > 0) {
        // newData = newData.slice(aircraftsIndex*10)

        // newData = [...newData, ...generateMockAircrafts(100)];

        for (const aircraft of newData) {
          aircraft.longitude += aircraftsIndex * 0.02
          aircraft.latitude += aircraftsIndex * 0.02
        }
        processAircraftUpdates(newData) // 核心更新逻辑
      } else {
        console.warn('飞机数据为空或格式错误:', newData)
      }
    } catch (error) {
      console.error('加载飞机数据失败:', error)
      clearAircrafts()
    }
  }
  const processAircraftUpdates = (newAircrafts: Aircraft[]): void => {
    const newIcaoSet = new Set<string>() // 存储新数据的所有 icao24

    // 1. 更新或添加飞机
    for (const aircraft of newAircrafts) {
      newIcaoSet.add(aircraft.icao24)

      const billboard = aircraftGraphic.primitives.billboardMap.get(aircraft.icao24)
      if (billboard) {
        // ✅ 更新现有飞机
        const position = Cesium.Cartesian3.fromDegrees(
          aircraft.longitude,
          aircraft.latitude,
          aircraft.baroAltitude,
        )
        billboard.position = position
        billboard.rotation = -Cesium.Math.toRadians(aircraft.heading)

        // 同步更新 label 位置（如果需要）
        const label = aircraftGraphic.primitives.labelMap.get(aircraft.icao24)
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
  const loadAndDrawAircraftRouteWithPolylineCollection = async (
    aircraftSelectedData: AircraftSelectedData,
    billboard: Cesium.Billboard,
  ): void => {
    try {
      const routeData = await getAircraftRouteFull(aircraftSelectedData.icao24)
      clearAircraftRoute()

      const positions = []
      for (const point of routeData) {
        if (!isValidCoordinate(point.longitude, point.latitude, point.baroAltitude)) {
          continue
        }
        // if(point.baroAltitude == 'ground'){
        //   point.baroAltitude = 0
        // }
        positions.push(point.longitude, point.latitude, point.baroAltitude)
      }
      aircraftGraphic.primitives.routePolyline.add({
        id: `aircraft-route-full-aircraftSelectedData-${aircraftSelectedData.icao24}`,
        positions: Cesium.Cartesian3.fromDegreesArrayHeights(positions),
        width: 2,
      })
    } catch (error) {
      console.error('绘制飞机路径失败:', error)
    }
  }

  const clearAircraftRoute = (): void => {
    // aircraftGraphic.primitives.routePolyline.removeAll()
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
    aircraftGraphic.primitives.billboardMap.clear()
    aircraftGraphic.primitives.labelMap.clear()
  }

  const removeAircraft = (icao24: string): void => {
    const billboard = aircraftGraphic.primitives.billboardMap.get(icao24)
    const label = aircraftGraphic.primitives.labelMap.get(icao24)

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
      id: 'aircraft-billboard-' + aircraft.icao24,
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
      origin_country: aircraft.origin_country,
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
      id: 'aircraft-label-' + aircraft.icao24,
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
      origin_country: aircraft.origin_country,
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

  const filterAircrafts = (form: AircraftFilterForm): void => {
    const DEFAULT_ALPHA: number = 0.0
    const HIGHLIGHT_ALPHA: number = 1.0

    const query: AircraftFilterForm = {
      icao24: form.icao24?.trim().toLowerCase(),
      callsign: form.callsign?.trim().toLowerCase(),
      origin_country: form.origin_country?.trim().toLowerCase(),
    }

    let matchedNum: number = 0
    let matchedBillboard: null | Cesium.Billboard = null

    // 高亮匹配项
    aircraftGraphic.primitives.billboardMap.forEach((billboard, icao24) => {
      const p: AircraftBaseProperties = billboard.properties
      if (!p) return

      const match =
        (!query.icao24 || p.icao24.toLowerCase().includes(query.icao24)) &&
        (!query.callsign || p.callsign.toLowerCase().includes(query.callsign)) &&
        (!query.origin_country || p.origin_country.toLowerCase().includes(query.origin_country))

      const alpha = match ? HIGHLIGHT_ALPHA : DEFAULT_ALPHA
      if (match) {
        matchedNum++
        matchedBillboard = billboard
      }

      // billboard.color = billboard.properties.originalColor.withAlpha(alpha)
      // const label:Cesium.Label = aircraftGraphic.primitives.labelMap.get(icao24)
      // label.fillColor = label.properties.originalFillColor.withAlpha(alpha)

      billboard.show = match
      const label: Cesium.Label = aircraftGraphic.primitives.labelMap.get(icao24)
      label.show = match
    })

    if (matchedNum === 1) {
      const carto = Cesium.Cartographic.fromCartesian(matchedBillboard.position)
      // console.log("carto", carto);
      // let lat = Cesium.Math.toDegrees(carto.latitude);
      // let lng = Cesium.Math.toDegrees(carto.longitude);
      // console.log("lat", lat);
      // console.log("lng", lng);

      carto.height += 1000000
      const destination = Cesium.Cartographic.toCartesian(carto)

      viewer.value.camera.flyTo({
        destination: destination,
        duration: 1.5,
      })
    }
  }

  const highlightAircraftOnHover = (billboard: Cesium.Billboard): void => {
    highlightBillboardOnHover(billboard, airplaneHoveredSvgRawDataUrl)
  }

  const highlightAircraftOnSelect = (
    aircraftSelectedData: AircraftSelectedData,
    billboard: Cesium.Billboard,
  ): void => {
    highlightBillboardAndSetSelected(aircraftSelectedData, billboard, airplaneSelectedSvgRawDataUrl)
  }

  return {
    initAircrafts,
    loadAndDrawAircrafts,
    updateAircrafts,

    showAircraftTooltip,
    hideAircraftTooltip,
    tooltip,

    filterAircrafts,

    highlightAircraftOnHover,

    highlightAircraftOnSelect,

    toggleAircraftsVisibility,

    // loadAndDrawAircraftRouteWithPolylineCollection,

    setupHighlightWatch,
  }
}
