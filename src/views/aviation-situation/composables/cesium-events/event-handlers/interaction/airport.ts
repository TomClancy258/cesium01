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
  //若加 clearSelectedSatelliteHighlight()：
  //
  // handler 要依赖 satellite-highlight-manager
  // 从「数据 + 发事件」变成「还管跨域视觉状态」
  // 飞机、机场、卫星三个 handler 各写一行 clear，互斥规则仍散在 3 个文件
  
  emitCesiumEvent('airportLeftClick', airportSelectedData, billboard)
}
