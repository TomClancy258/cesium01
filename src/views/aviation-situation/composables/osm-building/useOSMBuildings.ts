import { onUnmounted } from 'vue'
import * as Cesium from 'cesium'
import { useAviationTooltip } from '@/views/aviation-situation/composables/useAviationTooltip'
import { onCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import type {
  OSMBuildingHoveredProperties,
  OSMBuildingSelectedProperties,
} from '@/views/aviation-situation/types/osm-building'
import { selectOSMBuilding } from '@/views/aviation-situation/composables/selection/useAviationSelectionActions'

export function useOSMBuildings(viewer) {
  const {
    tooltip,
    showTooltip: showOSMBuildingTooltip,
    hideTooltip: hideOSMBuildingTooltip,
  } = useAviationTooltip<OSMBuildingHoveredProperties>({
    name: '',
    type: {
      shop: '',
      building: '',
    },
    addr: {
      housenumber: '',
      street: '',
      city: '',
      state: '',
    },
    estimatedHeight: 0,
    lngLatAlt: {
      longitude: 0,
      latitude: 0,
      height: 0,
    },
  })

  const initOSMBuildings = () => {
    addOSMBuildings()
    subscribeOSMBuildingEvents()
  }

  const addOSMBuildings = async () => {
    const tileset = viewer.value.scene.primitives.add(
      await Cesium.Cesium3DTileset.fromIonAssetId(96188),
    )
    tileset.sourceType = 'OSMBuilding'
  }

  let unsubOSMBuildingHover: () => void
  let unsubOSMBuildingLeave: () => void
  let unsubOSMBuildingLeftClick: () => void

  const subscribeOSMBuildingEvents = () => {
    unsubOSMBuildingHover = onCesiumEvent(
      'osmBuildingHover',
      (properties: OSMBuildingHoveredProperties, screenPosition: Cesium.Cartesian2) => {
        showOSMBuildingTooltip(screenPosition, properties)
      },
    )

    unsubOSMBuildingLeave = onCesiumEvent('osmBuildingLeave', () => {
      hideOSMBuildingTooltip()
    })

    unsubOSMBuildingLeftClick = onCesiumEvent(
      'osmBuildingLeftClick',
      (properties: OSMBuildingSelectedProperties, feature: Cesium.Cesium3DTileFeature) => {
        selectOSMBuilding(feature, properties)
      },
    )
  }

  onUnmounted(() => {
    unsubOSMBuildingHover()
    unsubOSMBuildingLeave()
    unsubOSMBuildingLeftClick()
  })

  return {
    initOSMBuildings,
    tooltip,
  }
}
