import {emitCesiumEvent} from "@/views/aviation-situation/composables/mitt-bus"
import type {
  SatelliteProperties,
  SatelliteHighlightConfig
} from '@/views/aviation-situation/types/satellite'
import type { LngLatAlt } from '@/views/aviation-situation/types/shared'
import {
  highlightSatelliteOnHover,
} from '@/views/aviation-situation/composables/highlight-manager/satellite-highlight-manager'

import * as Cesium from "cesium"

import {
  SATELLITE_HOVER_COLOR,
  SATELLITE_HOVER_SILHOUETTE_SIZE,
  SATELLITE_HOVER_SELECTED_PATH_SHOW
} from '@/views/aviation-situation/composables/satellite/satellite-constants.ts'

/** pick 后只转发图元身份 + 实时坐标；业务字段由 useSatellite 从 renderMap 组装 */
export const handleSatelliteHover = (
  properties: SatelliteProperties,
  screenPosition: Cesium.Cartesian2,
  lngLatAlt: LngLatAlt,
  entity: Cesium.Entity,
) => {
  const highlightConfig: SatelliteHighlightConfig = {
    sourceType: 'satellite',
    modelStyle: {
      silhouetteColor: SATELLITE_HOVER_COLOR,
      silhouetteSize: SATELLITE_HOVER_SILHOUETTE_SIZE,
    },
    pathStyle: {
      show: SATELLITE_HOVER_SELECTED_PATH_SHOW,
    },
  }
  highlightSatelliteOnHover(entity, highlightConfig)
  emitCesiumEvent('satelliteHover', properties, screenPosition, lngLatAlt, entity)
}

export const handleSatelliteLeftClick = (
  properties: SatelliteProperties,
  lngLatAlt: LngLatAlt,
  entity: Cesium.Entity,
): void => {
  emitCesiumEvent('satelliteLeftClick', properties, lngLatAlt, entity)
}
