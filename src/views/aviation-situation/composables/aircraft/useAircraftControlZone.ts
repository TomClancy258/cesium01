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
  clearSpatialSelectedHighlight, highlightBillboardOnControlZone, clearControlZoneHighlight
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
import { useControlZoneStore } from '@/stores/control-zone'
import { isPointInControlZoneRegion } from '@/views/aviation-situation/utils/control-zone-utils'

interface Options {
  viewer: ShallowRef<Cesium.Viewer>
  renderMap: Map<string, AviationRenderItem<Aircraft>>
  dangerControlZoneImageUrl: string
  warningControlZoneImageUrl: string
}

export function useAircraftControlZone({
  renderMap,
  dangerControlZoneImageUrl,
  warningControlZoneImageUrl,
}: Options) {
  const controlZoneStore = useControlZoneStore()
  const aircraftStore = useAircraftStore()

  /**
   * 按当前 matched（且 danger/warning）管控区，重算飞机进入高亮 / 飞出恢复。
   * 已不在 matched 里的管控区也会清掉其遗留高亮（不必再存全量管控区）。
   */
  const highlightAircraftByControlZone = () => {
    controlZoneStore.clearControlZoneAircraftMaps()

    // 当前允许参与高亮的管控区 id（筛选匹配 + 危险/警戒）
    const activeHighlightZoneIds = new Set<string>()
    for (const [controlZoneId, controlZoneRegion] of controlZoneStore.matchedControlZoneMap) {
      if (controlZoneRegion.level === 'danger' || controlZoneRegion.level === 'warning') {
        activeHighlightZoneIds.add(controlZoneId)
      }
    }

    // 1. 先清掉已不匹配 / 已不参与高亮的管控区遗留高亮
    for (const icao24 of aircraftStore.matchedAircraftMap.keys()) {
      const item = renderMap.get(icao24)
      if (!item?.sets?.controlZoneId) continue
      //步骤 1（清遗留高亮）第一次执行highlightAircraftByControlZone
      // controlZoneId 全是空 Set，内层循环：
      for (const zoneId of [...item.sets.controlZoneId]) {
        if (!activeHighlightZoneIds.has(zoneId)) {
          //若该飞机.sets.controlZoneId里没有包含上面的危险/警戒管控区，则恢复该飞机图标
          clearControlZoneHighlight(zoneId, item.billboard, item.sets)
        }
      }
    }

    // 2. 再按当前 matched 管控区做进出检测
    for (const [controlZoneId, controlZoneRegion] of controlZoneStore.matchedControlZoneMap) {
      if (controlZoneRegion.level === 'info' || controlZoneRegion.level === 'normal') continue

      const controlZoneImage =
        controlZoneRegion.level === 'danger'
          ? dangerControlZoneImageUrl
          : controlZoneRegion.level === 'warning'
            ? warningControlZoneImageUrl
            : null
      if (!controlZoneImage) continue

      for (const icao24 of aircraftStore.matchedAircraftMap.keys()) {
        const item = renderMap.get(icao24)
        if (!item?.sets) continue

        const lngLat: [number, number] = [item.data.longitude, item.data.latitude]
        const inGraphic = isPointInControlZoneRegion(lngLat, controlZoneRegion)

        if (inGraphic) {
          controlZoneStore.addAircraftToControlZone(controlZoneId, item.data)
          highlightBillboardOnControlZone(controlZoneId, item.billboard, controlZoneImage, item.sets)
        } else {
          clearControlZoneHighlight(controlZoneId, item.billboard, item.sets)
        }
      }
    }

    controlZoneStore.commitControlZoneAircraftMaps()
  }

  return {
    highlightAircraftByControlZone,
  }
}
