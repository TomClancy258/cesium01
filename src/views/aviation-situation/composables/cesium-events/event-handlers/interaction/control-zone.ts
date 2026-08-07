import { emitCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import type { ControlZoneProperties } from '@/network/control-zone/type'
import type { ControlZoneHighlightConfig } from '@/views/aviation-situation/types/control-zone'
import { highlightControlZoneOnHover } from '@/views/aviation-situation/composables/highlight-manager/control-zone-highlight-manager'
import * as Cesium from 'cesium'
import { CONTROL_ZONE_INTERACTION_OUTLINE } from '@/views/aviation-situation/composables/control-zone/control-zone-constants'

/** pick 后只转发图元身份；业务字段由 useControlZone 从 renderMap 组装 */
export const handleControlZoneHover = (
  properties: ControlZoneProperties,
  screenPosition: Cesium.Cartesian2,
  entity: Cesium.Entity,
) => {
  const highlightConfig: ControlZoneHighlightConfig = {
    polygon: {
      outlineColor: CONTROL_ZONE_INTERACTION_OUTLINE.hover,
    },
  }
  highlightControlZoneOnHover(entity, highlightConfig)
  emitCesiumEvent('controlZoneHover', properties, screenPosition, entity)
}

export const handleControlZoneLeftClick = (
  properties: ControlZoneProperties,
  entity: Cesium.Entity,
): void => {
  emitCesiumEvent('controlZoneLeftClick', properties, entity)
}
