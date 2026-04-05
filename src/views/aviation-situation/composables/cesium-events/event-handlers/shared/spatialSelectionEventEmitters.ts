import type {
  ClearAviationSpatialSelectionData,
  SelectionRegionBase,
  SpatialSelectionData
} from '@/views/aviation-situation/types/shared'
import { emitCesiumEvent } from '@/views/aviation-situation/composables/mittBus'
import { buildRegionFromData } from '@/utils/geoUtils'
import {useSpatialSelectionStore} from "@/stores/spatialSelection"

export const emitSpatialSelectByTarget = (
  target: string,
  data: SpatialSelectionData,
): void => {
  if (target === 'aircraft') {
    emitCesiumEvent('aircraftSpatialSelect', data)
  } else if (target === 'airport') {
    emitCesiumEvent('airportSpatialSelect', data)
  } else if (target === 'all') {
    emitCesiumEvent('aircraftSpatialSelect', data)
    emitCesiumEvent('airportSpatialSelect', data)
  } else if (target === 'measurement') {
    if (!data.isActive) {
      const region: SelectionRegionBase = buildRegionFromData(data)
      const spatialSelectionStore=useSpatialSelectionStore()
      spatialSelectionStore.addFinishedSelection(region)
    }
  }
}

export const emitClearSpatialSelectionByTarget = (
  target: string,
  data?: ClearAviationSpatialSelectionData,
): void => {
  if (target === 'aircraft') {
    emitCesiumEvent('clearAircraftSpatialSelection', data)
  } else if (target === 'airport') {
    emitCesiumEvent('clearAirportSpatialSelection', data)
  } else if (target === 'all') {
    emitCesiumEvent('clearAircraftSpatialSelection', data)
    emitCesiumEvent('clearAirportSpatialSelection', data)
  }
}
