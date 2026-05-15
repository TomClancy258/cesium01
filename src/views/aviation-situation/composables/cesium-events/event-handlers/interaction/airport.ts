//src/views/aviation-situation/composables/cesium-events/event-handlers/airport-interaction.ts
import {emitCesiumEvent} from "@/views/aviation-situation/composables/mitt-bus"
import {
  AirportBaseProperties,
  AirportBillboardProperties, AirportSelectedData
} from '@/views/aviation-situation/types/airport'

import * as Cesium from "cesium"

// 处理机场 hover
export const handleAirportHover = (properties: AirportBillboardProperties, screenPosition: Cesium.Cartesian2, billboard: Cesium.Billboard) => {
  const baseProperties:AirportBaseProperties = {
    type: properties.type,
    sourceType: properties.sourceType,
    icao: properties.icao,
    country: properties.country,
    name: properties.name,
    lngLatAlt: { ...properties.lngLatAlt },
  }
  emitCesiumEvent('airportHover', baseProperties, screenPosition, billboard)
}

// 处理机场左键点击
export const handleAirportLeftClick = (properties: AirportBillboardProperties, billboard: Cesium.Billboard):void => {
  const airportSelectedData:AirportSelectedData = {
    sourceType: properties.sourceType,
    icao: properties.icao,
    country: properties.country,
    lngLatAlt: { ...properties.lngLatAlt },
    name: properties.name,
  }
  emitCesiumEvent('airportLeftClick', airportSelectedData, billboard)
}
