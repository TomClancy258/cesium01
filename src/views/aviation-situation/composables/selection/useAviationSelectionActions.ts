import * as Cesium from 'cesium'
import { useAviationSelectionStore } from '@/stores/aviation-selection'
import type { AircraftSelectedData } from '@/views/aviation-situation/types/aircraft'
import type { AirportSelectedData } from '@/views/aviation-situation/types/airport'
import type { SatelliteHoveredProperties } from '@/views/aviation-situation/types/satellite'
import type { AviationSelectedData } from '@/views/aviation-situation/types/shared'
import {
  highlightBillboardOnSelect,
  clearSelectedBillboardHighlight,
} from '@/views/aviation-situation/composables/highlight-manager/billboard-highlight-manager'
import {
  highlightSatelliteOnSelect,
  clearSelectedSatelliteHighlight,
} from '@/views/aviation-situation/composables/highlight-manager/satellite-highlight-manager'
import {
  SATELLITE_SELECTED_COLOR,
  SATELLITE_SELECTED_SILHOUETTE_SIZE,
  SATELLITE_HOVER_SELECTED_PATH_SHOW,
} from '@/views/aviation-situation/composables/satellite/satellite-constants'

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
  data: SatelliteHoveredProperties,
): boolean => {
  return selected !== null && selected.sourceType === 'satellite' && selected.id === data.id
}

export const selectBillboard = (
  billboard: Cesium.Billboard,
  highlightImage: string,
  data: BillboardSelectedData,
): void => {
  clearSelectedSatelliteHighlight()
  highlightBillboardOnSelect(billboard, highlightImage)

  const aviationSelectionStore = useAviationSelectionStore()
  if (!isSameBillboardSelection(aviationSelectionStore.selected, data)) {
    aviationSelectionStore.setSelected(data)
  }
}

export const selectSatellite = (
  entity: Cesium.Entity,
  data: SatelliteHoveredProperties,
): void => {
  clearSelectedBillboardHighlight()
  highlightSatelliteOnSelect(entity, {
    sourceType: 'satellite',
    modelStyle: {
      silhouetteColor: SATELLITE_SELECTED_COLOR,
      silhouetteSize: SATELLITE_SELECTED_SILHOUETTE_SIZE,
    },
    pathStyle: {
      show: SATELLITE_HOVER_SELECTED_PATH_SHOW,
    },
  } as Parameters<typeof highlightSatelliteOnSelect>[1])

  const aviationSelectionStore = useAviationSelectionStore()
  if (!isSameSatelliteSelection(aviationSelectionStore.selected, data)) {
    aviationSelectionStore.setSelected(data)
  }
}

export const clearSelectedAviation = (): void => {
  const aviationSelectionStore = useAviationSelectionStore()
  const selected = aviationSelectionStore.selected

  if (selected?.sourceType === 'aircraft' || selected?.sourceType === 'airport') {
    clearSelectedBillboardHighlight()
  } else if (selected?.sourceType === 'satellite') {
    clearSelectedSatelliteHighlight()
  }

  aviationSelectionStore.clearSelected()
  aviationSelectionStore.clearLastSelectedIcao24()
}
