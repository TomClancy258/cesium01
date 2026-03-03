import {emitCesiumEvent} from "../useCesiumMouseEvents"
import {
  AirportBaseProperties,
  AirportBillboardProperties, AirportSelectedData
} from '@/views/aviation-situation/types/airport'

// 处理机场 hover
export const handleAirportHover = (properties: AirportBillboardProperties, screenPosition: Cesium.Cartesian2, pickedObject: Cesium.PickedObject) => {
  const baseProperties:AirportBaseProperties = {
    type: properties.type,
    sourceType: properties.sourceType,
    icao: properties.icao,
    country: properties.country,
    name: properties.name,
    longitude: properties.longitude,
    latitude: properties.latitude,
  }
  emitCesiumEvent('airportHover', baseProperties, screenPosition, pickedObject.primitive)
}

// 处理机场左键点击
export const handleAirportLeftClick = (properties: AirportBillboardProperties, pickedObject: Cesium.PickedObject):void => {
  const airportSelectedData:AirportSelectedData = {
    sourceType: properties.sourceType,
    icao: properties.icao
  }
  emitCesiumEvent('airportLeftClick', airportSelectedData, pickedObject.primitive)
}
