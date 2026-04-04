// src/views/aviation-situation/composables/useAircraftSpatialSelection.ts
import * as Cesium from 'cesium'
import { onUnmounted, ShallowRef } from 'vue'
import type { AviationRenderItem, SpatialSelectionData } from '@/views/aviation-situation/types/shared.ts'
import type { Aircraft } from '@/network/aircraft/type'
import {
  highlightBillboardOnSpatialSelection,
  clearSpatialSelectedHighlight,
} from '@/views/aviation-situation/composables/useBillboardHighlightManager.ts'
import { onCesiumEvent } from '@/views/aviation-situation/composables/mittBus.ts'
import { useSpatialSelectStore } from '@/stores/spatialSelect'
import { isPointInSelectionRegion } from '@/utils/geoUtils.ts'
import type { SelectionRegionBase,ClearAviationSpatialSelectionData } from '@/views/aviation-situation/types/shared.ts'
import type { EntityProperties } from '@/views/aviation-situation/types/entity.ts'
import {buildRegionFromData} from "@/utils/geoUtils.ts"
import { ClearAircraftSpatialSelectionData } from '@/views/aviation-situation/types/aircraft'

interface Options {
  viewer: ShallowRef<Cesium.Viewer>
  matchedIcao24Set: Set<string>
  renderMap: Map<string, AviationRenderItem<Aircraft>>
  spatialSelectedImageUrl: string
}

export function useAircraftSpatialSelection({
  viewer,
  matchedIcao24Set,
  renderMap,
  spatialSelectedImageUrl,
}: Options) {
  const spatialSelectStore = useSpatialSelectStore()

  // ---- active 选区 ----
  // const activeIdSet = new Set<string>()
  let activeDataSourceName = ''

  const activateSpatialSelection = (data: SpatialSelectionData) => {
    activeDataSourceName = data.dataSourceName
    // activeIdSet.clear()
    spatialSelectStore.clearActiveAircraftSpatialSelection()

    matchedIcao24Set.forEach((icao24) => {
      const item = renderMap.get(icao24)
      if (!item) return

      const lngLat: [number, number] = [item.data.longitude, item.data.latitude]
      const inGraphic = isPointInSelectionRegion(lngLat, data as any)

      if (inGraphic) {
        // activeIdSet.add(icao24)
        spatialSelectStore.addAircraftToActiveSpatialSelection(icao24)
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
    spatialSelectStore.activeSpatialSelection.aircraft.icao24Set.forEach((id) => {
      const item = renderMap.get(id)
      if (!item) return
      clearSpatialSelectedHighlight(activeDataSourceName, item.billboard)
    })
    spatialSelectStore.clearActiveAircraftSpatialSelection()
  }

  // ---- finished 选区 ----
  /**
   * 重新计算所有 finished 选区内的飞机，并更新高亮 + label
   * 当 filterAircrafts 或新增 finished 选区时调用
   */
  const finishedSpatialSelection = () => {
    // 1. 清空所有 finished 选区的飞机 icao24 集合
    spatialSelectStore.clearFinishedSelectionAircraftIcao24Sets()

    // 2. 遍历所有匹配飞机，判断是否在各 finished 选区内
    matchedIcao24Set.forEach((icao24) => {
      const item = renderMap.get(icao24)
      if (!item) return

      const lngLat: [number, number] = [item.data.longitude, item.data.latitude]

      for (const [dataSourceName, selectionRegion] of spatialSelectStore.finishedGraphicMap) {
        // measurement 类型不参与实体统计
        if (selectionRegion.spatialSelectionTarget === 'measurement') continue

        // 该选区不关心飞机，跳过
        if (selectionRegion.spatialSelectionTarget === 'airport') continue

        const inGraphic = isPointInSelectionRegion(lngLat, selectionRegion)

        if (inGraphic) {
          spatialSelectStore.addAircraftToFinishedSelection(dataSourceName, icao24)
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

    // 3. 触发响应式更新，并刷新各选区 label
    spatialSelectStore.triggerFinishedGraphicMapUpdate()
    updateFinishedSelectionLabels()
  }

  /** 更新各 finished 选区的 label 文字（飞机数量部分） */
  const updateFinishedSelectionLabels = () => {
    for (const [dataSourceName, selectionRegion] of spatialSelectStore.finishedGraphicMap) {
      if (selectionRegion.sourceType === 'polygonSpatialSelection'){
        const dataSources = viewer.value.dataSources.getByName(dataSourceName)
        if (!dataSources.length) continue

        const values = dataSources[0].entities.values
        const metricsLabelEntity = values[1]
        const props = metricsLabelEntity.properties.getValue() as EntityProperties

        const base = `周长：${props.label.perimeterInfo.formattedPerimeterStr}\n面积：${props.label.areaInfo.formattedAreaStr}`

        const target = selectionRegion.spatialSelectionTarget
        if (target === 'aircraft') {
          metricsLabelEntity.label.text = `飞机：${selectionRegion.aircraft.icao24Set.size} 架\n${base}`
        } else if (target === 'all') {
          metricsLabelEntity.label.text = `飞机：${selectionRegion.aircraft.icao24Set.size} 架\n机场：${selectionRegion.airport.icaoSet.size} 个\n${base}`
        }
      }else if(selectionRegion.sourceType === 'circleSpatialSelection'||
        selectionRegion.sourceType === 'hemisphereSpatialSelection'){
        const entity = viewer.value.entities.getById(dataSourceName)
        const props = entity.properties.getValue() as EntityProperties
        const base = `周长：${props.label.perimeterInfo.formattedPerimeterStr}\n面积：${props.label.areaInfo.formattedAreaStr}\n半径：${props.label.radiusInfo.formattedRadiusStr}`

        const target = selectionRegion.spatialSelectionTarget
        if (target === 'aircraft') {
          entity.label.text = `飞机：${selectionRegion.aircraft.icao24Set.size} 架\n${base}`
        } else if (target === 'all') {
          entity.label.text = `飞机：${selectionRegion.aircraft.icao24Set.size} 架\n机场：${selectionRegion.airport.icaoSet.size} 个\n${base}`
        }
      }


      // airport-only 的 label 由 useAirportSpatialSelection 负责
    }
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
        spatialSelectStore.addFinishedSelection(region)
        if (region.spatialSelectionTarget !== 'measurement') {
          finishedSpatialSelection()
        }
      }
    })

    unsubClearActive = onCesiumEvent('clearAircraftSpatialSelection', (clearAircraftSpatialSelectionData:ClearAircraftSpatialSelectionData|undefined) => {
      if (clearAircraftSpatialSelectionData===undefined||clearAircraftSpatialSelectionData.isActive) {
        clearActiveSpatialSelection()
      }else{
        clearAircraftSpatialSelectionData.aircraft.icao24Set.forEach((icao24) => {
          const item = renderMap.get(icao24)
          if (!item) return
          clearSpatialSelectedHighlight(clearAircraftSpatialSelectionData.dataSourceName, item.billboard)
        })
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
