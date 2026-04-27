// src/views/aviation-situation/composables/useAircraftSpatialSelection.ts
import * as Cesium from 'cesium'
import { onUnmounted, ShallowRef } from 'vue'
import type { AviationRenderItem, SpatialSelectionData } from '@/views/aviation-situation/types/shared.ts'
import type { Aircraft } from '@/network/aircraft/type'
import {
  highlightBillboardOnSpatialSelection,
  clearSpatialSelectedHighlight,
} from '@/views/aviation-situation/composables/billboard-highlight-manager.ts'
import { onCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus.ts'
import { useSpatialSelectionStore } from '@/stores/spatial-selection'
import type { SelectionRegionBase } from '@/views/aviation-situation/types/shared.ts'
import {buildRegionFromData,isPointInSelectionRegion} from "@/views/aviation-situation/utils/spatial-selection-utils.ts"
import { ClearAircraftSpatialSelectionData } from '@/views/aviation-situation/types/aircraft'
import {useAircraftStore} from '@/stores/aircraft'
import {updateFinishedSelectionLabels} from "@/views/aviation-situation/utils/spatial-selection-utils.ts"
import { useThrottleFn } from '@vueuse/core'
import * as turf from '@turf/turf'

interface Options {
  viewer: ShallowRef<Cesium.Viewer>
  renderMap: Map<string, AviationRenderItem<Aircraft>>
  spatialSelectedImageUrl: string
}

export function useAircraftSpatialSelection({
  viewer,
  renderMap,
  spatialSelectedImageUrl,
}: Options) {
  const spatialSelectionStore = useSpatialSelectionStore()
  const aircraftStore = useAircraftStore()

  // ---- active 选区 ----
  // const activeIdSet = new Set<string>()
  let activeDataSourceName = ''

  const activateSpatialSelection = useThrottleFn((data: SpatialSelectionData) => {
    activeDataSourceName = data.dataSourceName
    const hitIcao24s: string[] = []

    // 提前计算 polygon bbox，避免循环内重复计算
    let bbox: turf.BBox | undefined = undefined
    if (data.sourceType === 'polygonSpatialSelection') {
      const graphicData:turf.Feature<turf.Polygon> = data.graphic
      if (graphicData) {
        bbox = turf.bbox(graphicData)
      }
    }

    aircraftStore.matchedAircrafts.keys().forEach((icao24) => {
      const item = renderMap.get(icao24)
      if (!item) return

      const lngLat: [number, number] = [item.data.longitude, item.data.latitude]
      const inGraphic = isPointInSelectionRegion(lngLat, data, bbox)

      if (inGraphic) {
        hitIcao24s.push(icao24)
        highlightBillboardOnSpatialSelection(
          data.dataSourceName,
          item.billboard,
          spatialSelectedImageUrl,
        )
      } else {
        clearSpatialSelectedHighlight(data.dataSourceName, item.billboard)
      }
    })

    spatialSelectionStore.batchSetAircraftSpatialSelection(hitIcao24s)
  },200,true,true)
  // },100,true,true)
// },500,true,true)

  const clearActiveSpatialSelection = () => {
    spatialSelectionStore.activeSpatialSelection.aircraft.icao24Set.forEach((id) => {
      const item = renderMap.get(id)
      if (!item) return
      clearSpatialSelectedHighlight(activeDataSourceName, item.billboard)
    })
    spatialSelectionStore.clearActiveAircraftSpatialSelection()
  }

  // ---- finished 选区 ----
  /**
   * 重新计算所有 finished 选区内的飞机，并更新高亮 + label
   * 当 filterAircrafts 或新增 finished 选区时调用
   */
  const finishedSpatialSelection = () => {
    // 1. 清空所有 finished 选区的飞机 Map
    spatialSelectionStore.clearFinishedSelectionAircraftMaps()

    // 2. 遍历所有匹配飞机，判断是否在各 finished 选区内
    aircraftStore.matchedAircrafts.keys().forEach((icao24) => {
      const item = renderMap.get(icao24)
      if (!item) return

      const lngLat: [number, number] = [item.data.longitude, item.data.latitude]

      for (const [dataSourceName, selectionRegion] of spatialSelectionStore.finishedGraphicMap) {
        // measurement 类型不参与实体统计
        if (selectionRegion.spatialSelectionTarget === 'measurement') continue

        // 该选区不关心飞机，跳过
        if (selectionRegion.spatialSelectionTarget === 'airport') continue

        // 提前计算 polygon bbox，避免循环内重复计算
        let bbox: turf.BBox | undefined = undefined
        if (selectionRegion.sourceType === 'polygonSpatialSelection' && selectionRegion.graphic) {
          bbox = turf.bbox(selectionRegion.graphic)
        }

        const inGraphic = isPointInSelectionRegion(lngLat, selectionRegion, bbox)

        if (inGraphic) {
          spatialSelectionStore.addAircraftToFinishedSelection(dataSourceName, item.data)
          highlightBillboardOnSpatialSelection(
            dataSourceName,
            item.billboard,
            spatialSelectedImageUrl,
          )
        } else {
          clearSpatialSelectedHighlight(dataSourceName, item.billboard)
        }
      }
    })

    // 3. 提交新 Map 引用 + 触发响应式更新，并刷新各选区 label
    spatialSelectionStore.commitFinishedAircraftMaps()
    updateFinishedSelectionLabels(viewer)
  }


  // ---- 事件订阅 ----
  let unsubSpatialSelect: () => void
  let unsubClearActive: () => void

  const subscribeSpatialSelectionEvents = () => {
    unsubSpatialSelect = onCesiumEvent('aircraftSpatialSelect', (data: SpatialSelectionData) => {
      if (data.isActive) {
        activateSpatialSelection(data)
      } else {
        const region: SelectionRegionBase = buildRegionFromData(data)
        spatialSelectionStore.addFinishedSelection(region)
        if (region.spatialSelectionTarget !== 'measurement') {
          finishedSpatialSelection()
        }
      }
    })

    unsubClearActive = onCesiumEvent('clearAircraftSpatialSelection', (clearAircraftSpatialSelectionData:ClearAircraftSpatialSelectionData|undefined) => {
      if (clearAircraftSpatialSelectionData===undefined||clearAircraftSpatialSelectionData.isActive) {
        clearActiveSpatialSelection()
      }else{
        for (const icao24 of clearAircraftSpatialSelectionData.aircraft.aircraftMap.keys()) {
          const item = renderMap.get(icao24)
          if (!item) return
          clearSpatialSelectedHighlight(clearAircraftSpatialSelectionData.dataSourceName, item.billboard)
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
