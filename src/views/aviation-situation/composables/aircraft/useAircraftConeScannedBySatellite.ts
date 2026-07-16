import type { ShallowRef } from 'vue'
import * as Cesium from 'cesium'
import type { AviationRenderItem } from '@/views/aviation-situation/types/shared.ts'
import type { Aircraft } from '@/network/aircraft/types/aircraft'
import {
  highlightBillboardOnSatelliteConeScan,
  clearSatelliteConeScanSelectedHighlight, clearControlZoneHighlight
} from '@/views/aviation-situation/composables/highlight-manager/billboard-highlight-manager.ts'
import { useAircraftStore } from '@/stores/aircraft'
import type { ConeSnapshot } from '@/views/aviation-situation/types/satellite'
import {
  createConeQueryContext,
  isPointInConeWithContext,
} from '@/views/aviation-situation/utils/satellite-cone-utils'

interface Options {
  viewer: ShallowRef<Cesium.Viewer>
  renderMap: Map<string, AviationRenderItem<Aircraft>>
  satelliteConeScannedImageUrl: string
}

export function useAircraftConeScannedBySatellite({
  renderMap,
  satelliteConeScannedImageUrl,
}: Options) {
  const aircraftStore = useAircraftStore()

  const refreshSatelliteConeScan = (coneSnapshots: ConeSnapshot[]):Map<string, Map<string, Aircraft>> => {
    const aircraftBySatelliteId = new Map<string, Map<string, Aircraft>>()

    const coneScanIds=coneSnapshots.map((item,i)=>{
      return item.id
    })
    const coneScanIdSet = new Set<string>(coneScanIds)

    for (const icao24 of aircraftStore.matchedAircraftMap.keys()) {
      const item = renderMap.get(icao24)
      if (!item) continue
      const properties=item.billboard.properties
      for (const coneId of [...properties.sets.coneScanSatelliteId]) {
        if (!coneScanIdSet.has(coneId)) {
          clearSatelliteConeScanSelectedHighlight(coneId, item.billboard)
        }
      }
    }

    for (const coneSnapshot of coneSnapshots) {
      const coneCtx = createConeQueryContext(coneSnapshot)
      const aircraftMap = new Map<string, Aircraft>()
      for (const icao24 of aircraftStore.matchedAircraftMap.keys()) {
        const item = renderMap.get(icao24)
        if (!item) continue

        const position: Cesium.Cartesian3 = item.billboard.position
        const inGraphic = isPointInConeWithContext(position, coneCtx)

        //高亮优先级：框选>卫星扫描
        if (inGraphic) {
          highlightBillboardOnSatelliteConeScan(
            coneSnapshot.id,
            item.billboard,
            satelliteConeScannedImageUrl,
          )
          aircraftMap.set(icao24, item.data)
        } else {
          clearSatelliteConeScanSelectedHighlight(coneSnapshot.id, item.billboard)
        }
      }
      aircraftBySatelliteId.set(coneSnapshot.id, aircraftMap)
    }

    return aircraftBySatelliteId
  }

  return {
    refreshSatelliteConeScan,
  }
}
