import { reactive } from 'vue'
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

import type{ AirportFilterForm, } from '@/views/aviation-situation/types/aircraft'
import { highlightBillboardOnHover, highlightBillboardAndSetSelected } from './useHighlightManager'

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

export function useAirports(viewer) {
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
    airportGraphic.primitiveContainer.data = { type: 'airports' }

    viewer.value.scene.primitives.add(airportGraphic.primitiveContainer)
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

      // if (
      //   longitude == null ||
      //   latitude == null ||
      //   typeof longitude !== 'number' ||
      //   typeof latitude !== 'number'
      // ) {
      //   continue
      // }

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
          id: 'airport-billboard-' + icao,
          show: true,
          position: position,
          image: airportGreenSvgRawDataUrl,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            0,
            2000000
          ),
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
        show: true,
        id: 'airport-label-' + icao,
        position: position,
        text: airport.name,
        font: '14px sans-serif',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.TOP,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        pixelOffset: new Cesium.Cartesian2(0, 20),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
          0,
          2000000
        ),
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
    airportGraphic.primitives.billboardMap.forEach((billboard, icao) => {
      const p:AirportBaseProperties = billboard.properties
      if (!p) return

      const match =
        (!query.icao || p.icao.toLowerCase().includes(query.icao)) &&
        (!query.name || p.name.toLowerCase().includes(query.name)) &&
        (!query.country || p.country.toLowerCase().includes(query.country))

      const alpha = match ? HIGHLIGHT_ALPHA : DEFAULT_ALPHA
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
      const carto = Cesium.Cartographic.fromCartesian(matchedBillboard.position);

      carto.height += 1000000;
      const destination = Cesium.Cartographic.toCartesian(carto);

      viewer.value.camera.flyTo({
        destination: destination,
        duration: 1.5
      });
    }
  }

  const highlightAirportOnHover=(billboard:Cesium.Billboard):void=>{
    highlightBillboardOnHover(billboard, airportHoveredSvgRawDataUrl)
  }

  const highlightAirportOnSelect=(airportSelectedData:AirportSelectedData,billboard:Cesium.Billboard):void=>{
    highlightBillboardAndSetSelected(airportSelectedData,billboard, airportSelectedSvgRawDataUrl)
  }

  return {
    initAirports,
    loadAndDrawAirports,
    showAirportTooltip,
    hideAirportTooltip,
    tooltip,

    filterAirports,

    highlightAirportOnHover,

    highlightAirportOnSelect,

    toggleAirportsVisibility
  }
}
