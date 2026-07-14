import { emitCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import type { ControlZoneProperties } from '@/network/control-zone/type'
import type { ControlZoneHighlightConfig } from '@/views/aviation-situation/types/control-zone'
import { highlightControlZoneOnHover } from '@/views/aviation-situation/composables/highlight-manager/control-zone-highlight-manager'
import { selectControlZoneRegion } from '@/views/aviation-situation/composables/selection/useRegionSelectionActions'
import type { ControlZoneRegionSelectedData } from '@/views/aviation-situation/types/region-selection'
import * as Cesium from 'cesium'
import { CONTROL_ZONE_INTERACTION_OUTLINE } from '@/views/aviation-situation/composables/control-zone/control-zone-constants'

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
  const selected: ControlZoneRegionSelectedData = {
    sourceType: 'controlZone',
    id: properties.id,
    name: properties.name,
    level: properties.level,
    minAltitude: properties.minAltitude,
    maxAltitude: properties.maxAltitude,
  }
  selectControlZoneRegion(entity, selected)
}
