// src/views/aviation-situation/composables/useAircraftSpatialSelection.ts
import * as Cesium from 'cesium'
import { onUnmounted, ShallowRef } from 'vue'
import type {
  AviationRenderItem,
  SpatialSelectionData,
} from '@/views/aviation-situation/types/shared.ts'
import type { Aircraft } from '@/network/aircraft/type'
import {
  highlightBillboardOnSpatialSelection,
  clearSpatialSelectedHighlight,
  highlightBillboardOnSatelliteConeScan,
  clearSatelliteConeScanSelectedHighlight,
} from '@/views/aviation-situation/composables/highlight-manager/billboard-highlight-manager.ts'
import { onCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus.ts'
import { useSpatialSelectionStore } from '@/stores/spatial-selection'
import type { SelectionRegionBase } from '@/views/aviation-situation/types/shared.ts'
import {
  buildRegionFromData,
  isPointInSelectionRegion,
} from '@/views/aviation-situation/utils/spatial-selection-utils.ts'
import { ClearAircraftSpatialSelectionData } from '@/views/aviation-situation/types/aircraft'
import { useAircraftStore } from '@/stores/aircraft'
import { updateFinishedSelectionLabels } from '@/views/aviation-situation/utils/spatial-selection-utils.ts'
import { useThrottleFn } from '@vueuse/core'
import * as turf from '@turf/turf'
import type { ConeSnapshot } from '@/views/aviation-situation/types/satellite'
import { isPointInCone } from '@/views/aviation-situation/utils/satellite-cone-utils'

interface Options {
  viewer: ShallowRef<Cesium.Viewer>
  renderMap: Map<string, AviationRenderItem<Aircraft>>
  satelliteConeScannedImageUrl: string
}

export function useAircraftConeScannedBySatellite({
  viewer,
  renderMap,
  satelliteConeScannedImageUrl,
}: Options) {
  const aircraftStore = useAircraftStore()

  const refreshSatelliteConeScan = (coneSnapshots: ConeSnapshot[]) => {
    for (const coneSnapshot of coneSnapshots) {
      aircraftStore.matchedAircrafts.keys().forEach((icao24) => {
        const item = renderMap.get(icao24)
        if (!item) return

        const lngLat: [number, number] = [item.data.longitude, item.data.latitude]
        const position: Cesium.Cartesian3 = item.billboard.position

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

  onUnmounted(() => {})

  return {
    refreshSatelliteConeScan,
  }
}
