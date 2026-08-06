//src/views/aviation-situation/composables/useAirport.ts
import { onUnmounted, markRaw, watch, ShallowRef } from 'vue'
import * as Cesium from 'cesium'
import { getAirports } from '@/network/airport'
import type { Airport } from '@/network/airport/type.ts'
import type {
  AirportBaseProperties,
  AirportBillboardProperties,
  AirportLabelProperties,
  AirportSelectedData,
  AirportFilterForm,
  AirportGraphic,
} from '@/views/aviation-situation/types/airport'
import { isValidCoordinate, getCameraHeight, flyToLngLatAlt } from '@/utils/geoUtils'
import airportGreenSvgRaw from '@/assets/img/airport/svg/airport-green.svg?raw'

const airportGreenSvgRawDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airportGreenSvgRaw)}`

import airportHighRiskSvgRaw from '@/assets/img/airport/svg/airport-high-risk.svg?raw'

const airportHighRiskSvgRawDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airportHighRiskSvgRaw)}`

import airportHoveredSvgRaw from '@/assets/img/airport/svg/airport-hovered.svg?raw'

const airportHoveredSvgRawDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airportHoveredSvgRaw)}`

import airportSelectedSvgRaw from '@/assets/img/airport/svg/airport-selected.svg?raw'

const airportSelectedSvgRawDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airportSelectedSvgRaw)}`

import airportSpatialSelectedSvgRaw from '@/assets/img/airport/svg/airport-spatial-selected.svg?raw'

const airportSpatialSelectedSvgRawDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airportSpatialSelectedSvgRaw)}`

import airportSatelliteConeScannedSvgRaw from '@/assets/img/airport/svg/airport-satellite-cone-scan.svg?raw'

const airportSatelliteConeScannedSvgRawDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airportSatelliteConeScannedSvgRaw)}`

import { useCesiumCameraEvent } from '../cesium-events/cesium-camera-events' // 替换原导入
import { onCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'

import {
  highlightBillboardOnHover,
  clearHoveredBillboardHighlight,
} from '../highlight-manager/billboard-highlight-manager'
import { selectBillboard } from '@/views/aviation-situation/composables/selection/useAviationSelectionActions'

import { useAirportStore } from '@/stores/airport'
import { useDebounceFn } from '@vueuse/core'
import { AviationRenderItem } from '@/views/aviation-situation/types/shared'
import { useAviationTooltip } from '../useAviationTooltip'
import { useAirportSpatialSelection } from './useAirportSpatialSelection'
import { useAirportConeScannedBySatellite } from './useAirportConeScannedBySatellite'
import { handleAirportLeftClick } from '@/views/aviation-situation/composables/cesium-events/event-handlers/interaction/airport'
import { useAviationSelectionStore } from '@/stores/aviation-selection'
import { useRiskRipple } from '@/views/aviation-situation/composables/useRiskRipple'

type AircraftFilterQuery = Pick<AirportFilterForm, 'icao' | 'name' | 'countries' | 'riskLevel'>

export interface UseAirportsOptions {
  onAviationDataUpdated?: () => void
}

export function useAirport(
  viewer: ShallowRef<Cesium.Viewer>,
  options: UseAirportsOptions = {},
) {
  const AIRPORT_LABEL_DISTANCE = 2000 * 1000 // 机场标签显示阈值（米）
  const AIRPORT_SHOW_DISTANCE = 400 * 1000 // 机场整体显示阈值（米）
  const airportStore = useAirportStore()
  const aviationSelectionStore = useAviationSelectionStore()
  const airportRiskRipple = useRiskRipple(viewer, {
    idPrefix: 'airport_high_risk_ripple',
    sourceType: 'airportHighRiskRipple',
    imageUrl: '/src/assets/img/effects/png/warning-circle-red.png',
    color: '#D32F2F',
  })

  const airportRenderMap = new Map<string, AirportRenderItem>()

  const notifyAviationDataUpdated = (): void => {
    options.onAviationDataUpdated?.()
  }

  const airportGraphic: AirportGraphic = markRaw({
    primitiveContainer: null,
    primitives: {
      billboards: null,
      labels: null,
    },
  })

  const {
    tooltip,
    showTooltip: showAirportTooltip,
    hideTooltip: hideAirportTooltip,
  } = useAviationTooltip<AirportBaseProperties>({
    icao: '',
    type: 'billboard',
    sourceType: 'airport',
    country: '',
    name: '',
    lngLatAlt: {
      longitude: 0,
      latitude: 0,
      elevation: 0,
    },
  })

  const { finishedSpatialSelection, subscribeSpatialSelectionEvents } = useAirportSpatialSelection({
    viewer,
    renderMap: airportRenderMap as Map<string, AviationRenderItem<Airport>>,
    spatialSelectedImageUrl: airportSpatialSelectedSvgRawDataUrl,
  })

  const { refreshSatelliteConeScan } = useAirportConeScannedBySatellite({
    viewer,
    renderMap: airportRenderMap as Map<string, AviationRenderItem<Airport>>,
    satelliteConeScannedImageUrl: airportSatelliteConeScannedSvgRawDataUrl,
  })

  // ========== 修改：移除原相机事件的 inject，直接使用传递的 onCameraEvent ==========
  let unsubCameraMoveEnd: () => void

  // 计算相机到地面的距离，控制机场显隐
  const handleCameraMoveEnd = (camera: Cesium.Camera,type) => {
    const form: AirportFilterForm = airportStore.airportFilterForm
    const cameraHeight1: number = getCameraHeight(camera)
    console.log("type", type);
    console.log('cameraHeightMoveEnd', cameraHeight1)

    if (!form.visible) {
      setAirportsVisible(false)
      return
    }

    const cameraHeight: number = getCameraHeight(camera)

    if (form.alwaysVisible) {
      setAirportsLabelVisible(cameraHeight <= AIRPORT_LABEL_DISTANCE)

      setAirportsVisible(true)
      return
    }

    // 原核心逻辑（仅当 visible=true 且 alwaysVisible=false 时执行）
    if (!airportGraphic.primitiveContainer) return

    // console.log('cameraHeight', cameraHeight)

    setAirportsLabelVisible(cameraHeight <= AIRPORT_SHOW_DISTANCE)
    // 核心逻辑：高度小于阈值显示机场，大于则隐藏
    setAirportsVisible(cameraHeight <= AIRPORT_SHOW_DISTANCE)
  }

  // 订阅相机moveEnd事件（使用传递的 onCameraEvent）
  const subscribeCameraEvents = () => {
    unsubCameraMoveEnd = useCesiumCameraEvent('moveEnd', handleCameraMoveEnd)
  }
  // ========== 相机事件修改结束 ==========

  const setAirportsVisible = (isVisible: boolean): void => {
    airportGraphic.primitiveContainer.show = isVisible
  }
  const setAirportsLabelVisible = (isVisible: boolean): void => {
    airportGraphic.primitives.labels.show = isVisible
  }

  const initAirports = () => {
    airportGraphic.primitiveContainer = new Cesium.PrimitiveCollection()
    airportGraphic.primitives.billboards = new Cesium.BillboardCollection()
    airportGraphic.primitives.labels = new Cesium.LabelCollection()

    airportGraphic.primitiveContainer.id = 'airports_container'
    airportGraphic.primitives.billboards.id = 'airports_billboards'
    airportGraphic.primitives.labels.id = 'airports_labels'

    airportGraphic.primitiveContainer.add(airportGraphic.primitives.billboards)
    airportGraphic.primitiveContainer.add(airportGraphic.primitives.labels)

    airportGraphic.primitiveContainer.properties = { sourceType: 'airport', type: 'container' }
    airportGraphic.primitives.billboards.properties = { sourceType: 'airport', type: 'billboards' }
    airportGraphic.primitives.labels.properties = { sourceType: 'airport', type: 'labels' }

    setAirportsVisible(false)
    setAirportsLabelVisible(false)

    viewer.value.scene.primitives.add(airportGraphic.primitiveContainer)
    // airportRiskRipple.init()

    setupAirportFilterFormWatch()

    // 初始化时订阅相机事件
    subscribeCameraEvents()
    subscribeAirportEvents()
    subscribeSpatialSelectionEvents()
  }

  const loadAndDrawAirports = async () => {
    try {
      const data: Airport[] = await getAirports()
      if (Array.isArray(data) && data.length > 0) {
        // drawAirports(data.slice(0, 15000))
        drawAirports(data.slice(0, 20000))
        // drawAirports(data)
        filterAirports()
      } else {
        console.warn('机场数据为空或格式错误:', data)
        clearAirports()
        airportStore.clearMatchedAirports()
      }
    } catch (error) {
      console.error('加载机场数据失败:', error)
      clearAirports()
      airportStore.clearMatchedAirports()
    }
  }

  const drawAirports = (airports: Airport[]) => {
    for (const airport of airports) {
      const longitude: number = airport.longitude
      const latitude: number = airport.latitude
      const elevation: number = airport.elevation
      const country: string = airport.country
      const icao: string = airport.icao

      if (!isValidCoordinate(longitude, latitude, 0)) {
        continue
      }

      const position: Cesium.Cartesian3 = Cesium.Cartesian3.fromDegrees(
        longitude,
        latitude,
        elevation,
      )

      let image:string=airportGreenSvgRawDataUrl
      if (airport.riskLevel === 'high') {
        image=airportHighRiskSvgRawDataUrl
      }

      // 添加 Billboard
      const billboard: Cesium.Billboard = airportGraphic.primitives.billboards.add({
        id: 'airport_billboard_' + icao,
        // show: false,
        position: position,
        image: image,
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 2_000_000),
        width: 30,
        height: 30,
        // disableDepthTestDistance: Number.POSITIVE_INFINITY,
      })

      billboard.properties = {
        type: 'billboard',
        sourceType: 'airport',
        icao,
        country,
        riskLevel:airport.riskLevel,
        name: airport.name,
        lngLatAlt: {
          longitude,
          latitude,
          elevation,
        },
        originalColor: billboard.color,
        images: {
          original: billboard.image,
          satelliteConeScan: null,
          spatialSelection: null,
        },
        sets: {
          dataSourceName: new Set<string>(),
          coneScanSatelliteId: new Set<string>(),
        },
      } satisfies AirportBillboardProperties

      airportRenderMap.set(icao, { data: airport, billboard })
      // airportRiskRipple.sync({
      //   id: icao,
      //   position,
      //   riskLevel: airport.riskLevel,
      //   visible: airportStore.airportFilterForm.visible,
      // })
    }
  }

  const filterAirports = useDebounceFn((): void => {
    airportStore.clearMatchedAirports()

    const DEFAULT_ALPHA: number = 0.0
    const HIGHLIGHT_ALPHA: number = 1.0
    const form: AirportFilterForm = airportStore.airportFilterForm

    const query: AircraftFilterQuery = {
      icao: form.icao?.trim().toLowerCase(),
      // country: form.country?.trim().toLowerCase(),
      name: form.name?.trim().toLowerCase(),
      countries: form.countries,
      riskLevel: form.riskLevel,
    }

    const countriesSet = new Set(query.countries)

    airportRenderMap.forEach(({ data: airport, billboard, label }) => {
      const p: AirportBaseProperties = billboard.properties
      if (!p) return

      const match: boolean =
        (!query.icao || p.icao.toLowerCase().includes(query.icao)) &&
        (!query.name || p.name.toLowerCase().includes(query.name)) &&
        countriesSet.has(p.country) &&
        (query.riskLevel === 'all' || airport.riskLevel === query.riskLevel) &&
        form.visible
      // (!query.country || p.country.toLowerCase().includes(query.country))

      // const alpha: number = match ? HIGHLIGHT_ALPHA : DEFAULT_ALPHA
      if (match) {
        airportStore.addMatchedAirports(airport)
        // matchedBillboard=billboard
      }

      // billboard.color = billboard.properties.originalColor.withAlpha(alpha)
      // const label:Cesium.Label = airportGraphic.primitives.labelMap.get(icao)
      // label.fillColor = label.properties.originalFillColor.withAlpha(alpha)

      billboard.show = match
      if (form.labelVisible && label) {
        label.show = match
      }
      // airportRiskRipple.sync({
      //   id: airport.icao,
      //   position: billboard.position,
      //   riskLevel: airport.riskLevel,
      //   visible: form.visible && match,
      // })
    })
    airportStore.commitMatchedAirports()
    finishedSpatialSelection()
    notifyAviationDataUpdated()
    // 高亮匹配项
  }, 300)

  const removeAirportLabels = (): void => {
    airportGraphic.primitives.labels?.removeAll()
    airportRenderMap.forEach((item) => {
      item.label = undefined
    })
  }

  const addAirportLabels = (): void => {
    for (const item of airportRenderMap.values()) {
      if (item.label) continue

      const airport = item.data
      const longitude: number = airport.longitude
      const latitude: number = airport.latitude
      const elevation: number = airport.elevation
      const country: string = airport.country
      const icao: string = airport.icao

      if (!isValidCoordinate(longitude, latitude, 0)) {
        continue
      }
      const position: Cesium.Cartesian3 = Cesium.Cartesian3.fromDegrees(
        longitude,
        latitude,
        elevation,
      )

      // 添加 Label
      const label: Cesium.Label = airportGraphic.primitives.labels.add({
        // show: false,
        id: 'airport_label_' + icao,
        position: position,
        text: airport.name,
        font: '14px sans-serif',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.TOP,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        pixelOffset: new Cesium.Cartesian2(0, 20),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 200_000),
        outlineColor: Cesium.Color.BLACK,
        // disableDepthTestDistance: Number.POSITIVE_INFINITY,
      })

      label.properties = {
        type: 'label',
        sourceType: 'airport',
        icao,
        country,
        name: airport.name,
        lngLatAlt: {
          longitude,
          latitude,
          elevation,
        },
        originalFillColor: label.fillColor,
      } satisfies AirportLabelProperties

      item.label = label
    }
  }

  // ===== 新增：内部订阅机场事件 =====
  let unsubAirportHover: () => void
  let unsubAirportLeave: () => void
  let unsubAirportLeftClick: () => void
  let unsubMouseWheel: () => void

  const subscribeAirportEvents = () => {
    // 订阅机场hover事件
    unsubAirportHover = onCesiumEvent(
      'airportHover',
      (
        properties: AirportBaseProperties,
        position: Cesium.Cartesian2,
        billboard: Cesium.Billboard,
      ) => {
        showAirportTooltip(position, properties) // 替换原方法
        highlightBillboardOnHover(properties, billboard, airportHoveredSvgRawDataUrl)
        const hovered = aviationSelectionStore.hovered
        if (
          hovered === null ||
          hovered.sourceType !== 'airport' ||
          hovered.icao !== properties.icao
        ) {
          aviationSelectionStore.setHovered(properties)
        }
      },
    )

    unsubAirportLeave = onCesiumEvent('airportLeave', () => {
      hideAirportTooltip() // 替换原方法
      // clearHoveredBillboardHighlight()
      const hovered = aviationSelectionStore.hovered
      if (hovered?.sourceType === 'airport') {
        aviationSelectionStore.clearHovered()
      }
    })

    // 订阅机场点击事件
    unsubAirportLeftClick = onCesiumEvent(
      'airportLeftClick',
      (data: AirportSelectedData, billboard: Cesium.Billboard) => {
        selectBillboard(billboard, airportSelectedSvgRawDataUrl, data)
      },
    )

    //订阅鼠标wheel事件
    unsubMouseWheel = onCesiumEvent('mouseWheel', () => {
      handleCameraMoveEnd(viewer.value.camera,'mouseWheel')
    })
  }

  const flyToAirportByIcao = (icao: string): void => {
    const airportRenderItem = airportRenderMap.get(icao)
    if (!airportRenderItem) return
    const properties: AirportBillboardProperties = airportRenderItem.billboard.properties
    handleAirportLeftClick(properties, airportRenderItem.billboard)
    flyToLngLatAlt(
      viewer,
      {
        longitude: airportRenderItem.data.longitude,
        latitude: airportRenderItem.data.latitude-.35,
        height: airportRenderItem.data.elevation,
      },
      300000,
    )
  }

  const clearAirports = (): void => {
    airportGraphic.primitives.billboards.removeAll()
    airportGraphic.primitives.labels.removeAll()
    // airportRiskRipple.clear()
    airportRenderMap.clear() // ✅ 一行清空
    airportStore.clearMatchedAirports()
  }

  let unwatchAirportFilterForm: () => void
  let unwatchAirportLabelVisible: () => void

  const setupAirportFilterFormWatch = (): void => {
    unwatchAirportFilterForm = watch(
      () => airportStore.airportFilterForm,
      () => {
        filterAirports()
        handleCameraMoveEnd(viewer.value.camera)
      },
      { deep: true },
    )

    unwatchAirportLabelVisible = watch(
      () => airportStore.airportFilterForm.labelVisible,
      (labelVisible) => {
        if (labelVisible) {
          addAirportLabels()
        } else {
          removeAirportLabels()
        }
        filterAirports()
      },
    )
  }

  // ===== 组件卸载时取消订阅 =====
  onUnmounted(() => {
    unsubAirportHover?.()
    unsubAirportLeave?.()
    unsubAirportLeftClick?.()
    unsubCameraMoveEnd?.() // 取消相机事件订阅
    unsubMouseWheel?.()

    unwatchAirportFilterForm?.()
    unwatchAirportLabelVisible?.()
    // airportRiskRipple.destroy()
  })

  return {
    initAirports,
    loadAndDrawAirports,
    showAirportTooltip,
    hideAirportTooltip,
    tooltip,

    filterAirports,
    flyToAirportByIcao,
    refreshSatelliteConeScan,
  }
}
