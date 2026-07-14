import { emitCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import * as Cesium from 'cesium'
import { highlightOSMBuildingOnHover } from '@/views/aviation-situation/composables/highlight-manager/osm-building-highlight-manager'
import { OSM_BUILDING_HOVER_COLOR } from '@/views/aviation-situation/composables/osm-building/osm-building-constants'
import type {
  OSMBuildingHoveredProperties,
  OSMBuildingSelectedProperties,
} from '@/views/aviation-situation/types/osm-building'

export const handleOSMBuildingHover = (
  properties: OSMBuildingHoveredProperties,
  screenPosition: Cesium.Cartesian2,
  osmBuilding: Cesium.Cesium3DTileFeature,
) => {
  highlightOSMBuildingOnHover(osmBuilding, { color: OSM_BUILDING_HOVER_COLOR })
  emitCesiumEvent('osmBuildingHover', properties, screenPosition)
}

export const handleOSMBuildingLeftClick = (
  properties: OSMBuildingSelectedProperties,
  osmBuilding: Cesium.Cesium3DTileFeature,
): void => {
  emitCesiumEvent('osmBuildingLeftClick', properties, osmBuilding)
}
