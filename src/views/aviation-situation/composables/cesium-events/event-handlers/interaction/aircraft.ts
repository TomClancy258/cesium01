//src/views/aviation-situation/composables/cesium-events/event-handlers/aircraft-interaction.ts
import {emitCesiumEvent} from "@/views/aviation-situation/composables/mitt-bus"
import type { AircraftBillboardProperties } from '@/views/aviation-situation/types/aircraft'
import * as Cesium from 'cesium'

/** pick 后只转发图元身份；业务字段由 useAircraftInteractions 从 renderMap 组装 */
export const handleAircraftHover = (
  properties: AircraftBillboardProperties,
  screenPosition: Cesium.Cartesian2,
  billboard: Cesium.Billboard,
) => {
  emitCesiumEvent('aircraftHover', properties, screenPosition, billboard)
}

export const handleAircraftLeftClick = (
  properties: AircraftBillboardProperties,
  billboard: Cesium.Billboard,
): void => {
  emitCesiumEvent('aircraftLeftClick', properties, billboard)
}
