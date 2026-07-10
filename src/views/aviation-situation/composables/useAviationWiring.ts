import type { ShallowRef } from 'vue'
import type * as Cesium from 'cesium'
import { useCesiumMouseEvents } from '@/views/aviation-situation/composables/cesium-events/useCesiumMouseEvents'
import { useAircraft } from '@/views/aviation-situation/composables/aircraft/useAircraft'
import { useAirport } from '@/views/aviation-situation/composables/airport/useAirport'
import { useSatellite } from '@/views/aviation-situation/composables/satellite/useSatellite'

export function useAviationWiring(viewerInput: ShallowRef<Cesium.Viewer | null>) {
  const viewer = viewerInput as ShallowRef<Cesium.Viewer>

  const mouseEvents = useCesiumMouseEvents(viewerInput)

  const aircraft = useAircraft(viewer, {
    onAviationDataUpdated: mouseEvents.refreshActiveSpatialSelections,
  })

  const airport = useAirport(viewer, {
    onAviationDataUpdated: mouseEvents.refreshActiveSpatialSelections,
  })

  //构造参数 代替mitt实现跨业务hook之间的事件通信，这里就是卫星hook向飞机、机场hook的通信
  const satellite = useSatellite(viewer, {
    refreshSatelliteConeScanWithAircraft: aircraft.refreshSatelliteConeScan,
    refreshSatelliteConeScanWithAirport: airport.refreshSatelliteConeScan,
  })

  return {
    mouseEvents,
    aircraft,
    airport,
    satellite,
  }
}
