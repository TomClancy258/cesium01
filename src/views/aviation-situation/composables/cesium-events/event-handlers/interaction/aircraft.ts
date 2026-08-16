// src/views/aviation-situation/composables/cesium-events/event-handlers/interaction/aircraft.ts
import { emitCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import type { AircraftBillboardProperties } from '@/views/aviation-situation/types/aircraft'
import * as Cesium from 'cesium'

/**
 * 飞机 hover / click：用 mitt（emitCesiumEvent）。
 *
 * - 这里是「鼠标拾取层 → 飞机业务」的输入事件，不是飞机 hook 内部互调。
 * - 跨业务、组装时已知的协作（如卫星锥扫 → 飞机/机场）走 useAviationWiring 构造参数回调，不用 mitt。
 *
 * pick 后只转发图元身份；业务字段由 useAircraftInteractions 从 renderMap 组装。
 */
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
