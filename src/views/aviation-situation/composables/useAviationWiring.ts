import type { ShallowRef } from 'vue'
import type * as Cesium from 'cesium'
import { useCesiumMouseEvents } from '@/views/aviation-situation/composables/cesium-events/useCesiumMouseEvents'
import { useAircrafts } from '@/views/aviation-situation/composables/aircraft/useAircrafts'
import { useAirports } from '@/views/aviation-situation/composables/airport/useAirports'
import { useSatellites } from '@/views/aviation-situation/composables/satellite/useSatellites'

export function useAviationWiring(viewerInput: ShallowRef<Cesium.Viewer | null>) {
  const viewer = viewerInput as ShallowRef<Cesium.Viewer>

  const mouseEvents = useCesiumMouseEvents(viewerInput)

  const aircraft = useAircrafts(viewer, {
    onAviationDataUpdated: mouseEvents.refreshActiveSpatialSelections,
  })

  const airport = useAirports(viewer, {
    onAviationDataUpdated: mouseEvents.refreshActiveSpatialSelections,
  })

  const satellites = useSatellites(viewer, {
    refreshSatelliteConeScanWithAircraft: aircraft.refreshSatelliteConeScan,
    refreshSatelliteConeScanWithAirport: airport.refreshSatelliteConeScan,
  })

  return {
    mouseEvents,
    aircraft,
    airport,
    satellites,
  }
}
