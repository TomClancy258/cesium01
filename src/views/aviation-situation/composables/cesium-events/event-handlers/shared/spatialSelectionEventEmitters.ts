import type { ClearAviationSpatialSelectionData, SpatialSelectionData } from '@/views/aviation-situation/types/shared'
import { emitCesiumEvent } from '@/views/aviation-situation/composables/mittBus'

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
    emitCesiumEvent('airportSpatialSelect', data)
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
