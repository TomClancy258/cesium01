import {emitCesiumEvent} from "@/views/aviation-situation/composables/mitt-bus"
import type {
  SatelliteProperties,
  SatelliteHoveredProperties,
  SatelliteHighlightConfig
} from '@/views/aviation-situation/types/satellite'
import { LngLatAlt } from '@/views/aviation-situation/types/shared'
import {
  highlightSatelliteOnHover, highlightSatelliteOnSelect
} from '@/views/aviation-situation/composables/highlight-manager/satellite-highlight-manager'

import * as Cesium from "cesium"

import {
  SATELLITE_HOVER_COLOR,
  SATELLITE_SELECTED_COLOR,
  SATELLITE_HOVER_SILHOUETTE_SIZE,
  SATELLITE_SELECTED_SILHOUETTE_SIZE,
} from '@/views/aviation-situation/composables/satellite/satellite-constants.ts'

export const handleSatelliteHover = (properties: SatelliteProperties, screenPosition: Cesium.Cartesian2, lngLatAlt:LngLatAlt, entity: Cesium.Entity) => {
  const hoveredProperties:SatelliteHoveredProperties = {
    id:properties.id,
    name: properties.name,
    description: properties.description,
    sourceType:properties.sourceType,
    lngLatAlt: {
      latitude: lngLatAlt.latitude,
      longitude: lngLatAlt.longitude,
      height: lngLatAlt.height
    }
  }
  const highlightConfig:SatelliteHighlightConfig={
    sourceType:'satellite',
    modelStyle:{
      silhouetteColor : SATELLITE_HOVER_COLOR,
      silhouetteSize : SATELLITE_HOVER_SILHOUETTE_SIZE
    }
  }
  highlightSatelliteOnHover(entity,highlightConfig)
  emitCesiumEvent('satelliteHover', hoveredProperties, screenPosition, entity)
}

export const handleSatelliteLeftClick = (properties: SatelliteProperties,lngLatAlt:LngLatAlt, entity: Cesium.Entity):void => {
  const selectedProperties:SatelliteHoveredProperties = {
    id:properties.id,
    name: properties.name,
    description: properties.description,
    sourceType:properties.sourceType,
    lngLatAlt: {
      latitude: lngLatAlt.latitude,
      longitude: lngLatAlt.longitude,
      height: lngLatAlt.height
    }
  }
  const highlightConfig:SatelliteHighlightConfig={
    sourceType:'satellite',
    modelStyle:{
      silhouetteColor : SATELLITE_SELECTED_COLOR,
      silhouetteSize : SATELLITE_SELECTED_SILHOUETTE_SIZE
    }
  }
  highlightSatelliteOnSelect(entity,highlightConfig)
  emitCesiumEvent('satelliteLeftClick', selectedProperties, entity)
}
