import * as Cesium from 'cesium'
import { useAviationSelectionStore } from '@/stores/aviation-selection'
import type { AircraftSelectedData } from '@/views/aviation-situation/types/aircraft'
import type { AirportSelectedData } from '@/views/aviation-situation/types/airport'
import type { SatelliteSelectedData } from '@/views/aviation-situation/types/satellite'
import type { AviationSelectedData } from '@/views/aviation-situation/types/shared'
import type { OSMBuildingSelectedProperties } from '@/views/aviation-situation/types/osm-building'
import type { PhotogrammetryBuildingSelectedProperties } from '@/views/aviation-situation/types/photogrammetry'
import {
  highlightBillboardOnSelect,
  clearSelectedBillboardHighlight,
} from '@/views/aviation-situation/composables/highlight-manager/billboard-highlight-manager'
import {
  highlightSatelliteOnSelect,
  clearSelectedSatelliteHighlight,
} from '@/views/aviation-situation/composables/highlight-manager/satellite-highlight-manager'
import {
  highlightOSMBuildingOnSelect,
  clearSelectedOSMBuildingHighlight,
} from '@/views/aviation-situation/composables/highlight-manager/osm-building-highlight-manager'
import {
  highlightPhotogrammetryBuildingOnSelect,
  clearSelectedPhotogrammetryBuildingHighlight,
} from '@/views/aviation-situation/composables/highlight-manager/photogrammetry-building-highlight-manager'
import {
  SATELLITE_SELECTED_COLOR,
  SATELLITE_SELECTED_SILHOUETTE_SIZE,
  SATELLITE_HOVER_SELECTED_PATH_SHOW,
} from '@/views/aviation-situation/composables/satellite/satellite-constants'
import { OSM_BUILDING_SELECTED_COLOR } from '@/views/aviation-situation/composables/osm-building/osm-building-constants'
import { PHOTOGRAMMETRY_BUILDING_SELECTED_COLOR } from '@/views/aviation-situation/composables/photogrammetry/photogrammetry-constants'

type BillboardSelectedData = AircraftSelectedData | AirportSelectedData

const isSameBillboardSelection = (
  selected: AviationSelectedData,
  data: BillboardSelectedData,
): boolean => {
  if (selected === null) return false
  if (data.sourceType === 'aircraft' && selected.sourceType === 'aircraft') {
    return selected.icao24 === data.icao24
  }
  if (data.sourceType === 'airport' && selected.sourceType === 'airport') {
    return selected.icao === data.icao
  }
  return false
}

const isSameSatelliteSelection = (
  selected: AviationSelectedData,
  data: SatelliteSelectedData,
): boolean => {
  return selected !== null && selected.sourceType === 'satellite' && selected.id === data.id
}

const isSameOSMBuildingSelection = (
  selected: AviationSelectedData,
  data: OSMBuildingSelectedProperties,
): boolean => {
  return (
    selected !== null &&
    selected.sourceType === 'osmBuilding' &&
    selected.elementType === data.elementType &&
    selected.elementId === data.elementId
  )
}

const isSamePhotogrammetryBuildingSelection = (
  selected: AviationSelectedData,
  data: PhotogrammetryBuildingSelectedProperties,
): boolean => {
  return (
    selected !== null &&
    selected.sourceType === 'photogrammetryBuilding' &&
    selected.id === data.id
  )
}

export const selectBillboard = (
  billboard: Cesium.Billboard,
  highlightImage: string,
  data: BillboardSelectedData,
): void => {
  clearSelectedSatelliteHighlight()
  clearSelectedOSMBuildingHighlight()
  clearSelectedPhotogrammetryBuildingHighlight()
  highlightBillboardOnSelect(billboard, highlightImage)

  const aviationSelectionStore = useAviationSelectionStore()
  if (!isSameBillboardSelection(aviationSelectionStore.selected, data)) {
    aviationSelectionStore.setSelected(data)
  }
}

export const selectSatellite = (
  entity: Cesium.Entity,
  data: SatelliteSelectedData,
): void => {
  clearSelectedBillboardHighlight()
  clearSelectedOSMBuildingHighlight()
  clearSelectedPhotogrammetryBuildingHighlight()
  highlightSatelliteOnSelect(entity, {
    sourceType: 'satellite',
    modelStyle: {
      silhouetteColor: SATELLITE_SELECTED_COLOR,
      silhouetteSize: SATELLITE_SELECTED_SILHOUETTE_SIZE,
    },
    pathStyle: {
      show: SATELLITE_HOVER_SELECTED_PATH_SHOW,
    },
  })

  const aviationSelectionStore = useAviationSelectionStore()
  if (!isSameSatelliteSelection(aviationSelectionStore.selected, data)) {
    aviationSelectionStore.setSelected(data)
  }
}

export const selectOSMBuilding = (
  feature: Cesium.Cesium3DTileFeature,
  data: OSMBuildingSelectedProperties,
): void => {
  clearSelectedBillboardHighlight()
  clearSelectedSatelliteHighlight()
  clearSelectedPhotogrammetryBuildingHighlight()
  highlightOSMBuildingOnSelect(feature, { color: OSM_BUILDING_SELECTED_COLOR })

  const store = useAviationSelectionStore()
  if (!isSameOSMBuildingSelection(store.selected, data)) {
    store.setSelected(data)
  }
}

export const selectPhotogrammetryBuilding = (
  data: PhotogrammetryBuildingSelectedProperties,
): void => {
  clearSelectedBillboardHighlight()
  clearSelectedSatelliteHighlight()
  clearSelectedOSMBuildingHighlight()
  highlightPhotogrammetryBuildingOnSelect(data.id, PHOTOGRAMMETRY_BUILDING_SELECTED_COLOR)

  const store = useAviationSelectionStore()
  if (!isSamePhotogrammetryBuildingSelection(store.selected, data)) {
    store.setSelected(data)
  }
}

export const clearSelectedAviation = (): void => {
  const aviationSelectionStore = useAviationSelectionStore()
  const selected = aviationSelectionStore.selected

  if (selected?.sourceType === 'aircraft' || selected?.sourceType === 'airport') {
    clearSelectedBillboardHighlight()
  } else if (selected?.sourceType === 'satellite') {
    clearSelectedSatelliteHighlight()
  } else if (selected?.sourceType === 'osmBuilding') {
    clearSelectedOSMBuildingHighlight()
  } else if (selected?.sourceType === 'photogrammetryBuilding') {
    clearSelectedPhotogrammetryBuildingHighlight()
  }

  aviationSelectionStore.clearSelected()
  aviationSelectionStore.clearLastSelectedIcao24()
}
