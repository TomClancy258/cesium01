//src/views/aviation-situation/composables/cesium-events/event-handlers/airport-interaction.ts
import {emitCesiumEvent} from "@/views/aviation-situation/composables/mitt-bus"
import type { AirportBillboardProperties } from '@/views/aviation-situation/types/airport'
import * as Cesium from "cesium"

/** pick 后只转发图元身份；业务字段由 useAirport 从 renderMap 组装 */
export const handleAirportHover = (
  properties: AirportBillboardProperties,
  screenPosition: Cesium.Cartesian2,
  billboard: Cesium.Billboard,
) => {
  emitCesiumEvent('airportHover', properties, screenPosition, billboard)
}

export const handleAirportLeftClick = (
  properties: AirportBillboardProperties,
  billboard: Cesium.Billboard,
): void => {
  emitCesiumEvent('airportLeftClick', properties, billboard)
}
