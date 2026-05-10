//src/views/aviation-situation/composables/cesium-events/event-handlers/aircraft-interaction.ts
import {emitCesiumEvent} from "@/views/aviation-situation/composables/mitt-bus"
import {
  AircraftBaseProperties,
  AircraftBillboardProperties, AircraftSelectedData
} from '@/views/aviation-situation/types/aircraft'
import { useAviationSelectionStore } from '@/stores/aviation-selection'
import * as Cesium from 'cesium'

// 处理飞机 hover
export const handleAircraftHover = (properties: AircraftBillboardProperties, screenPosition: Cesium.Cartesian2, billboard: Cesium.Billboard) => {
  const baseProperties:AircraftBaseProperties = {
    type: properties.type,
    sourceType: properties.sourceType,
    icao24: properties.icao24,
    originCountry: properties.originCountry,
    callsign: properties.callsign,
    heading: properties.heading,
    lngLatAlt: {
      latitude: properties.lngLatAlt.latitude,
      longitude: properties.lngLatAlt.longitude,
      baroAltitude: properties.lngLatAlt.baroAltitude
    },
    // screenPosition
  }
  // const aviationSelectionStore=useAviationSelectionStore()
  // aviationSelectionStore.setHovered(baseProperties)
  emitCesiumEvent('aircraftHover', baseProperties, screenPosition, billboard)
}

// 处理飞机左键点击
export const handleAircraftLeftClick = (properties: AircraftBillboardProperties, billboard: Cesium.Billboard):void => {
  const aircraftSelectedData:AircraftSelectedData = {
    sourceType: properties.sourceType,
    icao24: properties.icao24,
    originCountry: properties.originCountry,
    callsign: properties.callsign,
    heading: properties.heading,
    lngLatAlt: {
      latitude: properties.lngLatAlt.latitude,
      longitude: properties.lngLatAlt.longitude,
      baroAltitude: properties.lngLatAlt.baroAltitude
    }
  }
  emitCesiumEvent('aircraftLeftClick', aircraftSelectedData, billboard)
}
