//src/views/aviation-situation/composables/cesium-events/event-handlers/aircraft-interaction.ts
import {emitCesiumEvent} from "../../useCesiumMouseEvents"
import {
  AircraftBaseProperties,
  AircraftBillboardProperties, AircraftSelectedData
} from '@/views/aviation-situation/types/aircraft'

// 处理飞机 hover
export const handleAircraftHover = (properties: AircraftBillboardProperties, screenPosition: Cesium.Cartesian2, pickedObject: Cesium.PickedObject) => {
  const baseProperties:AircraftBaseProperties = {
    type: properties.type,
    sourceType: properties.sourceType,
    icao24: properties.icao24,
    originCountry: properties.originCountry,
    callsign: properties.callsign,
    longitude: properties.longitude,
    latitude: properties.latitude,
    baroAltitude: properties.baroAltitude,
    heading: properties.heading,
  }
  emitCesiumEvent('aircraftHover', baseProperties, screenPosition, pickedObject.primitive)
}

// 处理飞机左键点击
export const handleAircraftLeftClick = (properties: AircraftBillboardProperties, pickedObject: Cesium.PickedObject):void => {
  const aircraftSelectedData:AircraftSelectedData = {
    sourceType: properties.sourceType,
    icao24: properties.icao24,
    position: {
      latitude: properties.latitude,
      longitude: properties.longitude,
      baroAltitude: properties.baroAltitude
    }
  }
  emitCesiumEvent('aircraftLeftClick', aircraftSelectedData, pickedObject.primitive)
}
