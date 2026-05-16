// src/views/aviation-situation/composables/useAirportSpatialSelection.ts
import * as Cesium from 'cesium'
import { onUnmounted, ShallowRef } from 'vue'
import type {
  AviationRenderItem,
  SpatialSelectionData,
} from '@/views/aviation-situation/types/shared.ts'
import type { Airport } from '@/network/airport/type'
import {
  highlightBillboardOnSpatialSelection,
  clearSpatialSelectedHighlight,
  highlightBillboardOnSatelliteConeScan,
  clearSatelliteConeScanSelectedHighlight
} from '@/views/aviation-situation/composables/highlight-manager/billboard-highlight-manager.ts'
import { onCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus.ts'
import { useSpatialSelectionStore } from '@/stores/spatial-selection'
import { buildRegionFromData, isPointInSelectionRegion } from '@/views/aviation-situation/utils/spatial-selection-utils.ts'
import type { SelectionRegionBase,ClearAirportSpatialSelectionData } from '@/views/aviation-situation/types/shared.ts'
import {useAirportStore} from '@/stores/airport'
import {updateFinishedSelectionLabels} from "@/views/aviation-situation/utils/spatial-selection-utils.ts"
import { useThrottleFn } from '@vueuse/core'
import * as turf from '@turf/turf'
import type { ConeSnapshot } from '@/views/aviation-situation/types/satellite'
import { isPointInCone } from '@/views/aviation-situation/utils/satellite-cone-utils'

interface Options {
  viewer: ShallowRef<Cesium.Viewer>
  renderMap: Map<string, AviationRenderItem<Airport>>
  satelliteConeScannedImageUrl: string
}

export function useAirportConeScannedBySatellite({
  viewer,
  renderMap,
  satelliteConeScannedImageUrl,
}: Options) {
  const airportStore = useAirportStore()

  const refreshSatelliteConeScan = (coneSnapshots:ConeSnapshot[]) => {

    for(const coneSnapshot of coneSnapshots){
      airportStore.matchedAirports.keys().forEach((icao) => {
        const item = renderMap.get(icao)
        if (!item) return

        // const lngLat: [number, number] = [item.data.longitude, item.data.latitude]
        // const pos=Cesium.Cartesian3.fromDegrees(item.data.longitude, item.data.latitude, item.data.elevation)
        const position:Cesium.Cartesian3=item.billboard.position

        const inGraphic = isPointInCone(position, coneSnapshot, true)

        //高亮优先级：框选>卫星扫描
        if (inGraphic) {
          highlightBillboardOnSatelliteConeScan(
            coneSnapshot.id,
            item.billboard,
            satelliteConeScannedImageUrl,
          )
        } else {
          clearSatelliteConeScanSelectedHighlight(coneSnapshot.id, item.billboard)
        }
      })

    }
  }

  onUnmounted(() => {
  })

  return {
    refreshSatelliteConeScan
  }
}
