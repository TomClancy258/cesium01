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
} from '@/views/aviation-situation/composables/useBillboardHighlightManager.ts'
import { onCesiumEvent } from '@/views/aviation-situation/composables/mittBus.ts'
import { useSpatialSelectionStore } from '@/stores/spatialSelection'
import { buildRegionFromData, isPointInSelectionRegion } from '@/utils/geoUtils.ts'
import type { SelectionRegionBase,ClearAirportSpatialSelectionData } from '@/views/aviation-situation/types/shared.ts'
import type { EntityProperties } from '@/views/aviation-situation/types/entity.ts'

interface Options {
  viewer: ShallowRef<Cesium.Viewer>
  matchedIcaoSet: Set<string>
  renderMap: Map<string, AviationRenderItem<Airport>>
  spatialSelectedImageUrl: string
}

export function useAirportSpatialSelection({
  viewer,
  matchedIcaoSet,
  renderMap,
  spatialSelectedImageUrl,
}: Options) {
  const spatialSelectionStore = useSpatialSelectionStore()

  // ---- active 选区 ----
  // const activeIdSet = new Set<string>()
  let activeDataSourceName = ''

  const activateSpatialSelection = (data: SpatialSelectionData) => {
    activeDataSourceName = data.dataSourceName
    // activeIdSet.clear()
    spatialSelectionStore.clearActiveAirportSpatialSelection()

    matchedIcaoSet.forEach((icao) => {
      const item = renderMap.get(icao)
      if (!item) return

      const lngLat: [number, number] = [item.data.longitude, item.data.latitude]
      const inGraphic = isPointInSelectionRegion(lngLat, data as any)

      if (inGraphic) {
        // activeIdSet.add(icao)
        spatialSelectionStore.addAirportToActiveSpatialSelection(icao)
        highlightBillboardOnSpatialSelection(
          data.dataSourceName,
          item.billboard,
          spatialSelectedImageUrl,
        )
      } else {
        clearSpatialSelectedHighlight(data.dataSourceName, item.billboard)
      }
    })
  }

  const clearActiveSpatialSelection = () => {
    spatialSelectionStore.activeSpatialSelection.airport.icaoSet.forEach((id) => {
      const item = renderMap.get(id)
      if (!item) return
      clearSpatialSelectedHighlight(activeDataSourceName, item.billboard)
    })
    spatialSelectionStore.clearActiveAirportSpatialSelection()
  }

  // ---- finished 选区 ----
  const finishedSpatialSelection = () => {
    // 注意：机场侧不调用 clearFinishedSelectionAircraftIcao24Sets
    // 那是飞机侧的职责，避免两侧互相清空
    spatialSelectionStore.clearFinishedSelectionAirportIcaoSets()

    for (const [dataSourceName, selectionRegion] of spatialSelectionStore.finishedGraphicMap) {
      if (selectionRegion.spatialSelectionTarget === 'measurement') continue

      // 该选区不关心机场，跳过
      if (selectionRegion.spatialSelectionTarget === 'aircraft') continue
      matchedIcaoSet.forEach((icao) => {
        const item = renderMap.get(icao)
        if (!item) return

        const lngLat: [number, number] = [item.data.longitude, item.data.latitude]
        const inGraphic = isPointInSelectionRegion(lngLat, selectionRegion)

        if (inGraphic) {
          // 更新 store 里该选区的机场 icao 集合
          spatialSelectionStore.addAirportToFinishedSelection(dataSourceName, icao)
          highlightBillboardOnSpatialSelection(
            dataSourceName,
            item.billboard,
            spatialSelectedImageUrl,
          )
        } else {
          clearSpatialSelectedHighlight(dataSourceName, item.billboard)
        }
      })
    }

    spatialSelectionStore.triggerFinishedGraphicMapUpdate()
    // updateFinishedSelectionLabels()
  }

  const updateFinishedSelectionLabels = () => {
    for (const [dataSourceName, selectionRegion] of spatialSelectionStore.finishedGraphicMap) {
      if (selectionRegion.sourceType !== 'polygonSpatialSelection') continue
      if (selectionRegion.spatialSelectionTarget === 'aircraft') continue // 飞机侧负责

      const dataSources = viewer.value.dataSources.getByName(dataSourceName)
      if (!dataSources.length) continue

      const values = dataSources[0].entities.values
      const metricsLabelEntity = values[1]
      const props = metricsLabelEntity.properties.getValue() as EntityProperties

      const base = `周长：${props.label.perimeterInfo.formattedPerimeterStr}\n面积：${props.label.areaInfo.formattedAreaStr}`

      const target = selectionRegion.spatialSelectionTarget
      if (target === 'airport') {
        metricsLabelEntity.label.text = `机场：${selectionRegion.airport.icaoSet.size} 个\n${base}`
      } else if (target === 'all') {
        // all 由两侧共同写入，这里只更新机场部分不够——
        // 建议：all 的 label 由一个独立的 watcher 统一负责，
        // 监听 finishedGraphicMap 变化后重新拼接
        // 此处暂留给飞机侧（它在 all 时也写 label，机场侧跳过）
      }
    }
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
        clearAirportSpatialSelectionData.airport.icaoSet.forEach((icao) => {
          const item = renderMap.get(icao)
          if (!item) return
          clearSpatialSelectedHighlight(clearAirportSpatialSelectionData.dataSourceName, item.billboard)
        })
      }
    })
  }

  onUnmounted(() => {
    unsubSpatialSelect?.()
    unsubClearActive?.()
  })

  return {
    subscribeSpatialSelectionEvents,
  }
}
