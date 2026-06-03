import type { ShallowRef } from 'vue'
import * as Cesium from 'cesium'
import type { AviationRenderItem } from '@/views/aviation-situation/types/shared.ts'
import type { Airport } from '@/network/airport/type'
import {
  highlightBillboardOnSatelliteConeScan,
  clearSatelliteConeScanSelectedHighlight,
} from '@/views/aviation-situation/composables/highlight-manager/billboard-highlight-manager.ts'
import { useAirportStore } from '@/stores/airport'
import type { ConeSnapshot } from '@/views/aviation-situation/types/satellite'
import { isPointInCone } from '@/views/aviation-situation/utils/satellite-cone-utils'

interface Options {
  viewer: ShallowRef<Cesium.Viewer>
  renderMap: Map<string, AviationRenderItem<Airport>>
  satelliteConeScannedImageUrl: string
}

export function useAirportConeScannedBySatellite({
  renderMap,
  satelliteConeScannedImageUrl,
}: Options) {
  const airportStore = useAirportStore()

  const refreshSatelliteConeScan = (coneSnapshots: ConeSnapshot[]) => {
    const airportBySatelliteId = new Map<string, Map<string, Airport>>()

    for (const coneSnapshot of coneSnapshots) {
      const airportMap = new Map<string, Airport>()
      for (const icao of airportStore.matchedAirports.keys()) {
        const item = renderMap.get(icao)
        if (!item) continue

        const position: Cesium.Cartesian3 = item.billboard.position
        const inGraphic = isPointInCone(position, coneSnapshot, true)

        //高亮优先级：框选>卫星扫描
        if (inGraphic) {
          highlightBillboardOnSatelliteConeScan(
            coneSnapshot.id,
            item.billboard,
            satelliteConeScannedImageUrl,
          )
          airportMap.set(icao, item.data)
        } else {
          clearSatelliteConeScanSelectedHighlight(coneSnapshot.id, item.billboard)
        }
      }
      airportBySatelliteId.set(coneSnapshot.id, airportMap)
    }

    return airportBySatelliteId
  }

  return {
    refreshSatelliteConeScan,
  }
}
