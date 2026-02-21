//useAirports.ts
import { reactive,onUnmounted } from 'vue'
import * as Cesium from 'cesium'
import { getAirports } from '@/network/airport'
import type { Airport } from '@/network/airport/type.ts'
import type {
  AirportBaseProperties,
  AirportBillboardProperties,
  AirportLabelProperties, AirportSelectedData,
  AirportTooltipState
} from '../types/airport'
import { isValidCoordinate,updateTooltip } from '@/utils/geoUtils'
import airportGreenSvgRaw from '@/assets/img/airport/svg/airport-green.svg?raw'
const airportGreenSvgRawDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airportGreenSvgRaw)}`
import airportHoveredSvgRaw from '@/assets/img/airport/svg/airport-hovered.svg?raw'
const airportHoveredSvgRawDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airportHoveredSvgRaw)}`
import airportSelectedSvgRaw from '@/assets/img/airport/svg/airport-selected.svg?raw'
const airportSelectedSvgRawDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airportSelectedSvgRaw)}`
import { onCesiumEvent } from './useCesiumEvents'

import type{ AirportFilterForm, } from '@/views/aviation-situation/types/aircraft'
import { highlightBillboardOnHover, highlightBillboardAndSetSelected,clearHoveredHighlight } from './useHighlightManager'

// 新增：定义 CameraEventCallback 类型（和 useCesiumCameraEvents.ts 保持一致）
type CameraEventType = 'moveEnd' | 'flyEnd' | 'changed'
type CameraEventCallback = (camera: Cesium.Camera) => void

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

export function useAirports(viewer,onCameraEvent: (type: CameraEventType, callback: CameraEventCallback) => () => void) {
  let airports: Airport[] = []

  const airportGraphic: AirportGraphic = {
    primitiveContainer: null,
    primitives: {
      billboards: null,
      billboardMap: new Map(),
      labels: null,
      labelMap: new Map(),
    },
  }
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

  // 机场显示距离阈值（100km，可根据需求调整）
  const AIRPORT_SHOW_DISTANCE = 500000; // 单位：米

  // ========== 修改：移除原相机事件的 inject，直接使用传递的 onCameraEvent ==========
  let unsubCameraMoveEnd: () => void;

  // 计算相机到地面的距离，控制机场显隐
  const handleCameraMoveEnd = (camera: Cesium.Camera) => {
    if (!airportGraphic.primitiveContainer) return;

    // 计算相机位置到地面的距离
    const cartographic = Cesium.Cartographic.fromCartesian(camera.position);
    const cameraHeight = cartographic.height; // 相机高度（米）
    // 核心逻辑：高度小于阈值显示机场，大于则隐藏
    airportGraphic.primitiveContainer.show = cameraHeight <= AIRPORT_SHOW_DISTANCE;
  };

  // 订阅相机moveEnd事件（使用传递的 onCameraEvent）
  const subscribeCameraEvents = () => {
    unsubCameraMoveEnd = onCameraEvent('moveEnd', handleCameraMoveEnd);
  };
  // ========== 相机事件修改结束 ==========

  const hideAirportTooltip = (): void => {
    tooltip.visible = false
  }

  const toggleAirportsVisibility = (): void => {
    airportGraphic.primitiveContainer.show=!airportGraphic.primitiveContainer.show
  }

  const initAirports = () => {
    airportGraphic.primitiveContainer = new Cesium.PrimitiveCollection()
    airportGraphic.primitives.billboards = new Cesium.BillboardCollection()
    airportGraphic.primitives.labels = new Cesium.LabelCollection()

    airportGraphic.primitiveContainer.add(airportGraphic.primitives.billboards)
    airportGraphic.primitiveContainer.add(airportGraphic.primitives.labels)
    airportGraphic.primitiveContainer.properties = { type: 'airports' }
    airportGraphic.primitiveContainer.show=false

    viewer.value.scene.primitives.add(airportGraphic.primitiveContainer)

    // 初始化时订阅相机事件
    subscribeCameraEvents();
  }

  const loadAndDrawAirports = async () => {
    try {
      const data: Airport[] = await getAirports()
      if (Array.isArray(data) && data.length > 0) {
        airports = data.slice(0, 15000) // 限制数量
        // airports = data
        drawAirports()
      } else {
        console.warn('机场数据为空或格式错误:', data)
      }
    } catch (error) {
      console.error('加载机场数据失败:', error)
    }
  }

  const drawAirports = () => {
    for (const airport of airports) {
      const longitude: number = airport.longitude
      const latitude: number = airport.latitude
      const country: string = airport.country
      const icao: string = airport.icao

      if (!isValidCoordinate(longitude, latitude,0)) {
        continue
      }

      const position: Cesium.Cartesian3 = Cesium.Cartesian3.fromDegrees(
        longitude,
        latitude
      )

      // 添加 Billboard
      const billboard: Cesium.Billboard =
        airportGraphic.primitives.billboards.add({
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

      airportGraphic.primitives.billboardMap.set(airport.icao, billboard)
      airportGraphic.primitives.labelMap.set(airport.icao, label)
    }
  }

  const showAirportTooltip = (
    screenPosition: Cesium.Cartesian2,
    properties: AirportBaseProperties
  ):void => {
    updateTooltip<AirportBaseProperties>(tooltip, screenPosition, properties)
  }

  const filterAirports = (form: AirportFilterForm): void => {
    const DEFAULT_ALPHA:number = 0.0
    const HIGHLIGHT_ALPHA:number = 1.0

    const query: AirportFilterForm = {
      icao: form.icao?.trim().toLowerCase(),
      country: form.country?.trim().toLowerCase(),
      name: form.name?.trim().toLowerCase(),
    }

    let matchedNum:number=0
    let matchedBillboard:null|Cesium.Billboard=null

    // 高亮匹配项
    airportGraphic.primitives.billboardMap.forEach((billboard:Cesium.Billboard, icao:string) => {
      const p:AirportBaseProperties = billboard.properties
      if (!p) return

      const match:boolean =
        (!query.icao || p.icao.toLowerCase().includes(query.icao)) &&
        (!query.name || p.name.toLowerCase().includes(query.name)) &&
        (!query.country || p.country.toLowerCase().includes(query.country))

      const alpha:number = match ? HIGHLIGHT_ALPHA : DEFAULT_ALPHA
      if (match) {
        matchedNum++
        matchedBillboard=billboard
      }

      // billboard.color = billboard.properties.originalColor.withAlpha(alpha)
      // const label:Cesium.Label = airportGraphic.primitives.labelMap.get(icao)
      // label.fillColor = label.properties.originalFillColor.withAlpha(alpha)

      billboard.show = match
      const label:Cesium.Label = airportGraphic.primitives.labelMap.get(icao)
      label.show = match
    })

    if (matchedNum === 1) {
      const carto:Cesium.Cartographic = Cesium.Cartographic.fromCartesian(matchedBillboard.position);

      carto.height += 1000000;
      const destination = Cesium.Cartographic.toCartesian(carto);

      viewer.value.camera.flyTo({
        destination: destination,
        duration: 1.5
      });
    }
  }

  // ===== 新增：内部订阅机场事件 =====
  let unsubAirportHover: () => void;
  let unsubAirportLeave: () => void;
  let unsubAirportLeftClick: () => void;
  let unsubMouseWheel: () => void;

  const subscribeAirportEvents = () => {
    // 订阅机场hover事件
    unsubAirportHover = onCesiumEvent('airportHover', (properties:AirportBaseProperties, position:Cesium.Cartesian2, billboard:Cesium.Billboard) => {
      showAirportTooltip(position, properties);
      highlightBillboardOnHover(billboard, airportHoveredSvgRawDataUrl)
    });

    // 订阅机场leave事件
    unsubAirportLeave = onCesiumEvent('airportLeave', () => {
      hideAirportTooltip();
      clearHoveredHighlight();
    });

    // 订阅机场点击事件
    unsubAirportLeftClick = onCesiumEvent('airportLeftClick', (data:AirportSelectedData, billboard:Cesium.Billboard) => {
      highlightBillboardAndSetSelected(data,billboard, airportSelectedSvgRawDataUrl)
    });

    //订阅鼠标wheel事件
    unsubMouseWheel= onCesiumEvent('mouseWheel', () => {
      handleCameraMoveEnd(viewer.value.camera)
    });
  };

  // 初始化时自动订阅事件
  subscribeAirportEvents();

  // ===== 组件卸载时取消订阅 =====
  onUnmounted(() => {
    unsubAirportHover?.();
    unsubAirportLeave?.();
    unsubAirportLeftClick?.();
    unsubCameraMoveEnd?.(); // 取消相机事件订阅
    unsubMouseWheel?.();
  });

  return {
    initAirports,
    loadAndDrawAirports,
    showAirportTooltip,
    hideAirportTooltip,
    tooltip,

    filterAirports,

    toggleAirportsVisibility,

  }
}
