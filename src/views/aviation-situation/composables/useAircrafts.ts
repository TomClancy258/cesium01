import { reactive } from 'vue'
import * as Cesium from 'cesium'
import { getAircrafts } from '@/network/aircraft'
import type { Aircraft, AircraftStatesResponse } from '@/network/aircraft/type.ts'
import { parseAircraftStates } from '@/network/aircraft/type.ts'
import {
  AircraftBaseProperties,
  AircraftBillboardProperties,
  AircraftLabelProperties,
  AircraftTooltipState
} from '../types/aircraft'
import { isValidCoordinate, updateTooltip } from '@/utils/geoUtils'
import type { AircraftFilterForm } from '@/views/aviation-situation/types/aircraft'
import { highlightBillboard } from './useHighlightManager'
import airplaneBlueSvgRaw from '@/assets/img/airplane/svg/airplane-blue.svg?raw'

const airplaneBlueSvgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airplaneBlueSvgRaw)}`

import airplaneDarkSvgRaw from '@/assets/img/airplane/svg/airplane-dark.svg?raw'

const airplaneDarkSvgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airplaneDarkSvgRaw)}`

import airplaneGreenSvgRaw from '@/assets/img/airplane/svg/airplane-green.svg?raw'

const airplaneGreenSvgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airplaneGreenSvgRaw)}`

import airplanePurpleSvgRaw from '@/assets/img/airplane/svg/airplane-purple.svg?raw'

const airplanePurpleSvgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airplanePurpleSvgRaw)}`

import airplaneRedSvgRaw from '@/assets/img/airplane/svg/airplane-red.svg?raw'

const airplaneRedSvgRawDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airplaneRedSvgRaw)}`

import airplaneYellowSvgRaw from '@/assets/img/airplane/svg/airplane-yellow.svg?raw'

const airplaneYellowSvgRawDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airplaneYellowSvgRaw)}`

interface AircraftPrimitives {
  billboards: Cesium.BillboardCollection | null
  billboardMap: Map<string, Cesium.Billboard>
  labelMap: Map<string, Cesium.Label>
  labels: Cesium.LabelCollection | null
}

interface AircraftGraphic {
  primitiveContainer: Cesium.PrimitiveCollection | null
  primitives: AircraftPrimitives
}

export function useAircrafts(viewer) {
  let aircrafts: Aircraft[] = []

  let hoveredBillboard:null|Cesium.Billboard=null

  const aircraftGraphic: AircraftGraphic = {
    primitiveContainer: null,
    primitives: {
      billboards: null,
      billboardMap: new Map(),
      labelMap: new Map(),
      labels: null,
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
      baro_altitude: 0,
      heading: 0,
    },
  })

  const hideAircraftTooltip = (): void => {
    tooltip.visible = false
  }

  const hideAircrafts = (): void => {
    // aircraftGraphic.primitiveContainer.
  }

  const initAircrafts = () => {
    aircraftGraphic.primitiveContainer = new Cesium.PrimitiveCollection()
    aircraftGraphic.primitives.billboards = new Cesium.BillboardCollection()
    aircraftGraphic.primitives.labels = new Cesium.LabelCollection()

    aircraftGraphic.primitiveContainer.add(aircraftGraphic.primitives.billboards)
    aircraftGraphic.primitiveContainer.add(aircraftGraphic.primitives.labels)
    aircraftGraphic.primitiveContainer.data = { type: 'aircrafts' }

    viewer.value.scene.primitives.add(aircraftGraphic.primitiveContainer)
  }

  const loadAndDrawAircrafts = async () => {
    try {
      const res: AircraftStatesResponse = await getAircrafts()
      if (Array.isArray(res.states) && res.states.length > 0) {
        aircrafts = parseAircraftStates(res)
        // console.log("res", res);
        drawAircrafts()
      } else {
        console.warn('飞机数据为空或格式错误:', data)
      }
    } catch (error) {
      console.error('加载飞机数据失败:', error)
    }
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

  const drawAircrafts = () => {
    for (const aircraft of aircrafts) {
      const longitude: number = aircraft.longitude
      const latitude: number = aircraft.latitude
      const altitude: number = aircraft.baro_altitude
      const callsign: string = aircraft.callsign
      const heading: number = aircraft.heading

      // if (
      //   longitude == null ||
      //   latitude == null ||
      //   typeof longitude !== 'number' ||
      //   typeof latitude !== 'number'
      // ) {
      //   continue
      // }
      if (!isValidCoordinate(longitude, latitude)) {
        continue
      }

      const position: Cesium.Cartesian3 = Cesium.Cartesian3.fromDegrees(
        longitude,
        latitude,
        altitude,
      )

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
        baro_altitude: aircraft.baro_altitude,
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
        baro_altitude: aircraft.baro_altitude,
        heading,
        originalFillColor: label.fillColor,
      } satisfies AircraftLabelProperties

      aircraftGraphic.primitives.billboardMap.set(aircraft.icao24, billboard)
      aircraftGraphic.primitives.labelMap.set(aircraft.icao24, label)
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
    const DEFAULT_ALPHA:number = 0.0
    const HIGHLIGHT_ALPHA:number = 1.0

    const query: AircraftFilterForm = {
      icao24: form.icao24?.trim().toLowerCase(),
      callsign: form.callsign?.trim().toLowerCase(),
      origin_country: form.origin_country?.trim().toLowerCase(),
    }

    let matchedNum:number=0
    let matchedBillboard:null|Cesium.Billboard=null

    // 高亮匹配项
    aircraftGraphic.primitives.billboardMap.forEach((billboard, icao24) => {
      const p:AircraftBaseProperties = billboard.properties
      if (!p) return

      const match =
        (!query.icao24 || p.icao24.toLowerCase().includes(query.icao24)) &&
        (!query.callsign || p.callsign.toLowerCase().includes(query.callsign)) &&
        (!query.origin_country || p.origin_country.toLowerCase().includes(query.origin_country))

      const alpha = match ? HIGHLIGHT_ALPHA : DEFAULT_ALPHA
      if (match) {
        matchedNum++
        matchedBillboard=billboard
      }

      billboard.color = billboard.properties.originalColor.withAlpha(alpha)
      const label:Cesium.Label = aircraftGraphic.primitives.labelMap.get(icao24)
      label.fillColor = label.properties.originalFillColor.withAlpha(alpha)
    })

    if (matchedNum === 1) {
      const carto = Cesium.Cartographic.fromCartesian(matchedBillboard.position);
      // console.log("carto", carto);
      // let lat = Cesium.Math.toDegrees(carto.latitude);
      // let lng = Cesium.Math.toDegrees(carto.longitude);
      // console.log("lat", lat);
      // console.log("lng", lng);

      carto.height += 1000000;
      const destination = Cesium.Cartographic.toCartesian(carto);

      viewer.value.camera.flyTo({
        destination: destination,
        duration: 1.5
      });
    }
  }

  const highlightAircraftOnHover=(billboard:Cesium.Billboard):void=>{
    hoveredBillboard=billboard
    billboard.image=airplaneYellowSvgRawDataUrl

    highlightBillboard(billboard, airplaneYellowSvgRawDataUrl)
  }
  const resetAircraftHighlight=():void=>{
    if (hoveredBillboard !== null) {
      hoveredBillboard.image=hoveredBillboard.properties.originalImage
      hoveredBillboard=null
    }
  }

  const resetHighlight = ():void => {}

  return {
    initAircrafts,
    loadAndDrawAircrafts,

    showAircraftTooltip,
    hideAircraftTooltip,
    tooltip,

    filterAircrafts,
    resetHighlight,

    highlightAircraftOnHover,
    resetAircraftHighlight
  }
}
