//useAirports.ts
import { reactive, onUnmounted, markRaw, ref, watch } from 'vue'
import * as Cesium from 'cesium'
import { getAirports } from '@/network/airport'
import type { Airport } from '@/network/airport/type.ts'
import type {
  AirportBaseProperties,
  AirportBillboardProperties,
  AirportLabelProperties,
  AirportSelectedData,
  AirportTooltipState,
} from '../types/airport'
import { isValidCoordinate, updateTooltip,getCameraHeight } from '@/utils/geoUtils'
import airportGreenSvgRaw from '@/assets/img/airport/svg/airport-green.svg?raw'
const airportGreenSvgRawDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airportGreenSvgRaw)}`

import airportHoveredSvgRaw from '@/assets/img/airport/svg/airport-hovered.svg?raw'
const airportHoveredSvgRawDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airportHoveredSvgRaw)}`

import airportSelectedSvgRaw from '@/assets/img/airport/svg/airport-selected.svg?raw'
const airportSelectedSvgRawDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airportSelectedSvgRaw)}`

import airportSpatialSelectedSvgRaw from '@/assets/img/airport/svg/airport-spatial-selection.svg?raw'
const airportSpatialSelectedSvgRawDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airportSpatialSelectedSvgRaw)}`

import { useCesiumCameraEvent } from './cesium-events/useCesiumCameraEvents' // 替换原导入
import { onCesiumEvent } from '@/views/aviation-situation/composables/mittBus'

import type {
  AirportFilterForm,
} from '@/views/aviation-situation/types/airport'
import {
  highlightBillboardOnHover,
  highlightBillboardAndSetSelected,
  clearHoveredHighlight, highlightBillboardOnSpatialSelection, clearSpatialSelectedHighlight
} from './useBillboardHighlightManager'

import { useAirportStore } from '@/stores/airport'
import { useDebounceFn } from '@vueuse/core'
import { Graphic, SpatialSelectionData } from '@/views/aviation-situation/types/shared'
import * as turf from '@turf/turf'

const airportStore = useAirportStore()

export interface AirportRenderItem {
  airport: Airport
  billboard: Cesium.Billboard
  label: Cesium.Label
}

interface AirportPrimitives {
  billboards: Cesium.BillboardCollection | null
  billboardMap: Map<string, Cesium.Billboard>
  labelMap: Map<string, Cesium.Label>
  labels: Cesium.LabelCollection | null
}

interface AirportGraphic {
  primitiveContainer: Cesium.PrimitiveCollection | null
  primitives: AirportPrimitives
}

export interface AirportRenderItem {
  airport: Airport
  billboard: Cesium.Billboard
  label: Cesium.Label
}

interface SelectionRegion {
  type: string
  graphic: Graphic
  billboards: Cesium.Billboard[]
  icaoSet: Set<string>
}

interface SpatialSelectionActive {
  type: string
  dataSourceName: string
  graphic: Graphic
  icaoSet: Set<string>
}

interface SpatialSelection {
  finishedGraphicMap: Map<string, SelectionRegion>
  active: SpatialSelectionActive
}

export function useAirports(viewer) {
  const AIRPORT_LABEL_DISTANCE = 2000 * 1000; // 机场标签显示阈值（米）
  const AIRPORT_SHOW_DISTANCE = 400 * 1000;   // 机场整体显示阈值（米）

  let airports: Airport[] = []
  const matchedIcaoSet = new Set<string>()

  const matchedAirportCount = ref<number>(0)
  const airportRenderMap = new Map<string, AirportRenderItem>()

  const airportGraphic: AirportGraphic = markRaw({
    primitiveContainer: null,
    primitives: {
      billboards: null,
      labels: null,
    },
  })
  const tooltip = reactive<AirportTooltipState>({
    visible: false,
    position: { left: 0, top: 0 },
    properties: {
      icao: '',
      type: '',
      sourceType: '',
      country: '',
      name: '',
      longitude: 0,
      latitude: 0,
    },
  })

  // ========== 修改：移除原相机事件的 inject，直接使用传递的 onCameraEvent ==========
  let unsubCameraMoveEnd: () => void

  // 计算相机到地面的距离，控制机场显隐
  const handleCameraMoveEnd = (camera: Cesium.Camera) => {
    const form:AirportFilterForm = airportStore.airportFilterForm;

    if (!form.visible) {
      setAirportsVisible(false);
      return;
    }

    const cameraHeight:number = getCameraHeight(camera);

    if (form.alwaysVisible) {
      setAirportsLabelVisible(cameraHeight <= AIRPORT_LABEL_DISTANCE);

      setAirportsVisible(true);
      return;
    }

    // 原核心逻辑（仅当 visible=true 且 alwaysVisible=false 时执行）
    if (!airportGraphic.primitiveContainer) return;

    console.log("cameraHeight", cameraHeight);

    setAirportsLabelVisible(cameraHeight <= AIRPORT_SHOW_DISTANCE);
    // 核心逻辑：高度小于阈值显示机场，大于则隐藏
    setAirportsVisible(cameraHeight <= AIRPORT_SHOW_DISTANCE);
  };

  // 订阅相机moveEnd事件（使用传递的 onCameraEvent）
  const subscribeCameraEvents = () => {
    unsubCameraMoveEnd = useCesiumCameraEvent('moveEnd', handleCameraMoveEnd)
  }
  // ========== 相机事件修改结束 ==========

  const hideAirportTooltip = (): void => {
    tooltip.visible = false
  }

  const setAirportsVisible = (isVisible:boolean): void => {
    airportGraphic.primitiveContainer.show = isVisible
  }
  const setAirportsLabelVisible = (isVisible:boolean): void => {
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

    setupAirportFilterFormWatch()

    // 初始化时订阅相机事件
    subscribeCameraEvents()
  }

  const loadAndDrawAirports = async () => {
    try {
      const data: Airport[] = await getAirports()
      if (Array.isArray(data) && data.length > 0) {
        // airports = data.slice(0, 15000) // 限制数量
        airports = data.slice(0, 20000) // 限制数量
        // airports = data
        drawAirports()
        filterAirports()
      } else {
        console.warn('机场数据为空或格式错误:', data)
        clearAirports()
      }
    } catch (error) {
      console.error('加载机场数据失败:', error)
      clearAirports()
    }
  }

  const drawAirports = () => {
    for (const airport of airports) {
      const longitude: number = airport.longitude
      const latitude: number = airport.latitude
      const elevation: number = airport.elevation
      const country: string = airport.country
      const icao: string = airport.icao

      if (!isValidCoordinate(longitude, latitude, 0)) {
        continue
      }

      const position: Cesium.Cartesian3 = Cesium.Cartesian3.fromDegrees(longitude, latitude,elevation)

      // 添加 Billboard
      const billboard: Cesium.Billboard = airportGraphic.primitives.billboards.add({
        id: 'airport_billboard_' + icao,
        // show: false,
        position: position,
        image: airportGreenSvgRawDataUrl,
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
        sourceType: 'airport',
        icao,
        country,
        name: airport.name,
        longitude,
        latitude,
        originalColor: billboard.color,
        originalImage: billboard.image,
      } satisfies AirportBillboardProperties

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
        // distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
        //   0,
        //   2000000
        // ),
        outlineColor: Cesium.Color.BLACK,
        // disableDepthTestDistance: Number.POSITIVE_INFINITY,
      })

      label.properties = {
        type: 'label',
        sourceType: 'airport',
        icao,
        country,
        name: airport.name,
        longitude,
        latitude,
        originalFillColor: label.fillColor,
      } satisfies AirportLabelProperties

      airportRenderMap.set(icao, { airport, billboard, label })
    }
  }

  const showAirportTooltip = (
    screenPosition: Cesium.Cartesian2,
    properties: AirportBaseProperties,
  ): void => {
    updateTooltip<AirportBaseProperties>(tooltip, screenPosition, properties)
  }

  const filterAirports = useDebounceFn((): void => {
    matchedAirportCount.value = 0

    const DEFAULT_ALPHA: number = 0.0
    const HIGHLIGHT_ALPHA: number = 1.0
    const form: AirportFilterForm = airportStore.airportFilterForm

    const query: AirportFilterForm = {
      icao: form.icao?.trim().toLowerCase(),
      country: form.country?.trim().toLowerCase(),
      name: form.name?.trim().toLowerCase(),
    }

    const matchedBillboard: null | Cesium.Billboard = null

    airportRenderMap.forEach(({ airport, billboard, label }) => {
      const p: AirportBaseProperties = billboard.properties
      if (!p) return

      const match: boolean =
        (!query.icao || p.icao.toLowerCase().includes(query.icao)) &&
        (!query.name || p.name.toLowerCase().includes(query.name)) &&
        (!query.country || p.country.toLowerCase().includes(query.country))

      const alpha: number = match ? HIGHLIGHT_ALPHA : DEFAULT_ALPHA
      if (match) {
        matchedAirportCount.value++
        // matchedBillboard=billboard
      }

      // billboard.color = billboard.properties.originalColor.withAlpha(alpha)
      // const label:Cesium.Label = airportGraphic.primitives.labelMap.get(icao)
      // label.fillColor = label.properties.originalFillColor.withAlpha(alpha)

      billboard.show = match
      label.show = match
    })
    // 高亮匹配项
    if (matchedAirportCount.value === 0) {
      // ElNotification({
      //   title: '提示',
      //   message: '未查询到匹配的机场信息，请检查筛选条件后重试',
      //   type: 'warning',
      // });
    } else if (matchedAirportCount.value === 1) {
      // flyToPositionWithHeightOffset(viewer.value, matchedBillboard.position, 500000);
    }
  }, 300)

  // ===== 新增：内部订阅机场事件 =====
  let unsubAirportHover: () => void
  let unsubAirportLeave: () => void
  let unsubAirportLeftClick: () => void
  let unsubMouseWheel: () => void
  let unsubSpatialSelect: () => void

  const subscribeAirportEvents = () => {
    // 订阅机场hover事件
    unsubAirportHover = onCesiumEvent(
      'airportHover',
      (
        properties: AirportBaseProperties,
        position: Cesium.Cartesian2,
        billboard: Cesium.Billboard,
      ) => {
        showAirportTooltip(position, properties)
        highlightBillboardOnHover(billboard, airportHoveredSvgRawDataUrl)
      },
    )

    // 订阅机场leave事件
    unsubAirportLeave = onCesiumEvent('airportLeave', () => {
      hideAirportTooltip()
      clearHoveredHighlight()
    })

    // 订阅机场点击事件
    unsubAirportLeftClick = onCesiumEvent(
      'airportLeftClick',
      (data: AirportSelectedData, billboard: Cesium.Billboard) => {
        highlightBillboardAndSetSelected(data, billboard, airportSelectedSvgRawDataUrl)
      },
    )

    //订阅鼠标wheel事件
    unsubMouseWheel = onCesiumEvent('mouseWheel', () => {
      handleCameraMoveEnd(viewer.value.camera)
    })

    unsubSpatialSelect = onCesiumEvent('airportSpatialSelect', (spatialSelectionData:SpatialSelectionData) => {
      if (spatialSelectionData.isActive) {
        activateSpatialSelection(spatialSelectionData)
      } else {
        const selectionRegion:SelectionRegion = {
          graphic: spatialSelectionData.graphic,
          type: spatialSelectionData.type,
          icaoSet: new Set<string>(matchedIcaoSet),
        }

        spatialSelection.finishedGraphicMap.set(spatialSelectionData.dataSourceName, selectionRegion)
        finishedSpatialSelection()
      }
    })
  }

  const finishedSpatialSelection = (): void => {
    matchedIcaoSet.forEach((icao) => {
      const airportRenderItem = airportRenderMap.get(icao)
      if (!airportRenderItem) return
      const {airport,billboard}=airportRenderItem
      // 构建Turf点
      const turfPoint: turf.Feature<turf.Point> = turf.point([
        airport.longitude,
        airport.latitude,
      ])

      for (const [dataSourceName, selectionRegion] of spatialSelection.finishedGraphicMap) {
        let isInGraphic: boolean = false
        if (selectionRegion.type === 'polygon') {

          isInGraphic = turf.booleanPointInPolygon(turfPoint, selectionRegion.graphic)
        }
        if (isInGraphic) {
          highlightBillboardOnSpatialSelection(dataSourceName, billboard, airplaneSpatialSelectionSvgRawDataUrl)
          // if (billboard.properties.icao24 === 'c05f5d') {
          //   console.log('选中')
          //   console.log("billboard.properties.spatialSelectionImage", billboard.properties.spatialSelectionImage);
          // }
        }else{
          clearSpatialSelectedHighlight(dataSourceName, billboard)
          // if (billboard.properties.icao24 === 'c05f5d') {
          //   console.log('未选中')
          //   console.log("billboard.properties.spatialSelectionImage", billboard.properties.spatialSelectionImage);
          // }
        }
      }
    })
  }


  const clearAirports = (): void => {
    airportGraphic.primitives.billboards.removeAll()
    airportGraphic.primitives.labels.removeAll()
    airportRenderMap.clear() // ✅ 一行清空
    matchedAirportCount.value = 0
  }

  // 初始化时自动订阅事件
  subscribeAirportEvents()

  let unwatchAirportFilterForm: () => void
  const setupAirportFilterFormWatch = (): void => {
    unwatchAirportFilterForm = watch(
      () => airportStore.airportFilterForm,
      (newForm: AirportFilterForm, oldForm: AirportFilterForm) => {
        filterAirports()
        handleCameraMoveEnd(viewer.value.camera)
      },
      { deep: true },
    )
  }

  // ===== 组件卸载时取消订阅 =====
  onUnmounted(() => {
    unsubAirportHover?.()
    unsubAirportLeave?.()
    unsubAirportLeftClick?.()
    unsubCameraMoveEnd?.() // 取消相机事件订阅
    unsubMouseWheel?.()
    unsubSpatialSelect?.()

    unwatchAirportFilterForm?.()

    airportStore.resetAirportFilterForm()
  })

  return {
    initAirports,
    loadAndDrawAirports,
    showAirportTooltip,
    hideAirportTooltip,
    tooltip,

    filterAirports,

    matchedAirportCount,
  }
}
