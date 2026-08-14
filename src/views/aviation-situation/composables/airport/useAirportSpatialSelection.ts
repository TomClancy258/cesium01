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
} from '@/views/aviation-situation/composables/highlight-manager/billboard-highlight-manager.ts'
import { onCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus.ts'
import { useSpatialSelectionStore } from '@/stores/spatial-selection'
import { buildRegionFromData, isPointInSelectionRegion } from '@/views/aviation-situation/utils/spatial-selection-utils.ts'
import type { SelectionRegionBase,ClearAirportSpatialSelectionData } from '@/views/aviation-situation/types/shared.ts'
import {useAirportStore} from '@/stores/airport'
import {updateFinishedSelectionLabels} from "@/views/aviation-situation/utils/spatial-selection-utils.ts"
import { useThrottleFn } from '@vueuse/core'
import * as turf from '@turf/turf'

interface Options {
  viewer: ShallowRef<Cesium.Viewer>
  renderMap: Map<string, AviationRenderItem<Airport>>
  spatialSelectedImageUrl: string
}

export function useAirportSpatialSelection({
  viewer,
  renderMap,
  spatialSelectedImageUrl,
}: Options) {
  const spatialSelectionStore = useSpatialSelectionStore()
  const airportStore = useAirportStore()

  // ---- active 选区 ----
  // const activeIdSet = new Set<string>()
  let activeDataSourceName = ''

  const activateSpatialSelection =useThrottleFn( (data: SpatialSelectionData) => {
    activeDataSourceName = data.dataSourceName
    const hitIcaos: string[] = []

    // 提前计算 polygon bbox，避免循环内重复计算
    let bbox: turf.BBox | undefined = undefined
    if (data.sourceType === 'polygonSpatialSelection') {
      const graphicData:turf.Feature<turf.Polygon> = data.graphic
      if (graphicData) {
        bbox = turf.bbox(graphicData)
      }
    }

    airportStore.matchedAirportMap.keys().forEach((icao) => {
      const item = renderMap.get(icao)
      if (!item?.sets) return

      const lngLat: [number, number] = [item.data.longitude, item.data.latitude]
      const inGraphic = isPointInSelectionRegion(lngLat, data, bbox)

      if (inGraphic) {
        hitIcaos.push(icao)
        highlightBillboardOnSpatialSelection(
          data.dataSourceName,
          item.billboard,
          spatialSelectedImageUrl,
          item.sets,
        )
      } else {
        clearSpatialSelectedHighlight(data.dataSourceName, item.billboard, item.sets)
      }
    })

    spatialSelectionStore.batchSetAirportSpatialSelection(hitIcaos)
  },200,
    true,
    false
  )

  const clearActiveSpatialSelection = () => {
    spatialSelectionStore.activeSpatialSelection.airport.icaoSet.forEach((id) => {
      const item = renderMap.get(id)
      if (!item?.sets) return
      clearSpatialSelectedHighlight(activeDataSourceName, item.billboard, item.sets)
    })
    spatialSelectionStore.clearActiveAirportSpatialSelection()
  }

  // ---- finished 选区 ----
  const finishedSpatialSelection = () => {
    // 注意：机场侧不调用 clearFinishedSelectionAircraftMaps
    // 那是飞机侧的职责，避免两侧互相清空
    spatialSelectionStore.clearFinishedSelectionAirportMaps()

    for (const [dataSourceName, selectionRegion] of spatialSelectionStore.finishedGraphicMap) {
      if (selectionRegion.spatialSelectionTarget === 'measurement') continue

      // 该选区不关心机场，跳过
      if (selectionRegion.spatialSelectionTarget === 'aircraft') continue

      airportStore.matchedAirportMap.keys().forEach((icao) => {
        const item = renderMap.get(icao)
        if (!item?.sets) return

        const lngLat: [number, number] = [item.data.longitude, item.data.latitude]
        const inGraphic = isPointInSelectionRegion(lngLat, selectionRegion)

        if (inGraphic) {
          spatialSelectionStore.addAirportToFinishedSelection(dataSourceName, item.data)
          highlightBillboardOnSpatialSelection(
            dataSourceName,
            item.billboard,
            spatialSelectedImageUrl,
            item.sets,
          )
        } else {
          clearSpatialSelectedHighlight(dataSourceName, item.billboard, item.sets)
        }
      })
    }

    spatialSelectionStore.commitFinishedAirportMaps()
    updateFinishedSelectionLabels(viewer)
  }

  // ---- 事件订阅 ----
  let unsubSpatialSelect: () => void
  let unsubClearActive: () => void

  const subscribeSpatialSelectionEvents = () => {
    unsubSpatialSelect = onCesiumEvent('airportSpatialSelect', (data: SpatialSelectionData) => {
      if (data.isActive) {
        activateSpatialSelection(data)
      } else {
        // finished 选区已由飞机侧写入 store（两者共用同一 finishedGraphicMap）
        // 机场侧只需触发自己的 finishedSpatialSelection 即可
        const region: SelectionRegionBase = buildRegionFromData(data)
        spatialSelectionStore.addFinishedSelection(region)
        if (data.spatialSelectionTarget !== 'measurement') {
          finishedSpatialSelection()
        }
      }
    })

    unsubClearActive = onCesiumEvent('clearAirportSpatialSelection', (clearAirportSpatialSelectionData:ClearAirportSpatialSelectionData|undefined) => {
      if (clearAirportSpatialSelectionData===undefined||clearAirportSpatialSelectionData.isActive) {
        clearActiveSpatialSelection()
      }else{
        for (const icao of clearAirportSpatialSelectionData.airport.airportMap.keys()) {
          const item = renderMap.get(icao)
          if (!item?.sets) return
          clearSpatialSelectedHighlight(
            clearAirportSpatialSelectionData.dataSourceName,
            item.billboard,
            item.sets,
          )
        }
      }
    })
  }

  onUnmounted(() => {
    unsubSpatialSelect?.()
    unsubClearActive?.()
  })

  return {
    finishedSpatialSelection,
    subscribeSpatialSelectionEvents,
  }
}
