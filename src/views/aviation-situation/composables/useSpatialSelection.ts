// src/views/aviation-situation/composables/useSpatialSelection.ts

import * as turf from '@turf/turf'
import * as Cesium from "cesium"
import type { SpatialSelectionData, SelectionRegion, SpatialSelection } from '../types/shared'
import {
  highlightBillboardOnSpatialSelection,
  clearSpatialSelectedHighlight,
} from './useBillboardHighlightManager'
import { onCesiumEvent } from './mittBus'
import { onUnmounted } from 'vue'
import { booleanLngLatAltArrayInCircle } from '@/utils/geoUtils'

interface UseSpatialSelectionOptions<T> {
  /** 当前筛选匹配的 id 集合（引用，保持响应式） */
  matchedIdSet: Set<string>
  /** 完整渲染 Map，key 为 id */
  renderMap: Map<string, { data: T; billboard: Cesium.Billboard; label: Cesium.Label }>
  /** 从 data 中取经纬度 */
  getCoord: (data: T) => [number, number]
  /** 框选高亮图片 URL */
  spatialSelectedImageUrl: string
  /** 事件名：如 'aircraftSpatialSelect' | 'airportSpatialSelect' */
  spatialSelectEvent: string
  /** 清除事件名：统一用 'clearAviationActiveSpatialSelection' */
  clearActiveEvent?: string
}

export function useSpatialSelection<T>(options: UseSpatialSelectionOptions<T>) {
  const {
    matchedIdSet,
    renderMap,
    getCoord,
    spatialSelectedImageUrl,
    spatialSelectEvent,
    clearActiveEvent = 'clearAviationActiveSpatialSelection',
  } = options

  const spatialSelection: SpatialSelection = {
    active: {
      type: '',
      dataSourceName: '',
      graphic: null,
      idSet: new Set<string>(),
    },
    finishedGraphicMap: new Map(),
  }

  const activateSpatialSelection = (spatialSelectionData: SpatialSelectionData): void => {
    spatialSelection.active.type = spatialSelectionData.type
    spatialSelection.active.dataSourceName = spatialSelectionData.dataSourceName
    spatialSelection.active.graphic = spatialSelectionData.graphic
    spatialSelection.active.idSet.clear()

    matchedIdSet.forEach((id) => {
      const item = renderMap.get(id)
      if (!item) return

      const [lng, lat] = getCoord(item.data)
      let isInGraphic = false

      if (spatialSelectionData.type === 'polygon') {
        const turfPoint = turf.point([lng, lat])
        isInGraphic = turf.booleanPointInPolygon(turfPoint, spatialSelectionData.graphic)
      }else if (spatialSelectionData.type === 'circle') {
        isInGraphic = booleanLngLatAltArrayInCircle([lng, lat],spatialSelectionData.centerLngLatAltArray,spatialSelectionData.radius)
      }

      if (isInGraphic) {
        spatialSelection.active.idSet.add(id)
        highlightBillboardOnSpatialSelection(
          spatialSelectionData.dataSourceName,
          item.billboard,
          spatialSelectedImageUrl,
        )
      } else {
        clearSpatialSelectedHighlight(spatialSelectionData.dataSourceName, item.billboard)
      }
    })
  }

  const finishedSpatialSelection = (): void => {
    matchedIdSet.forEach((id) => {
      const item = renderMap.get(id)
      if (!item) return

      const [lng, lat] = getCoord(item.data)

      for (const [dataSourceName, selectionRegion] of spatialSelection.finishedGraphicMap) {
        let isInGraphic = false
        if (selectionRegion.type === 'polygon') {
          const turfPoint = turf.point([lng, lat])
          isInGraphic = turf.booleanPointInPolygon(turfPoint, selectionRegion.graphic)
        }else if (selectionRegion.type === 'circle') {
          isInGraphic = booleanLngLatAltArrayInCircle([lng, lat],selectionRegion.centerLngLatAltArray,selectionRegion.radius)
        }

        if (isInGraphic) {
          highlightBillboardOnSpatialSelection(dataSourceName, item.billboard, spatialSelectedImageUrl)
        } else {
          clearSpatialSelectedHighlight(dataSourceName, item.billboard)
        }
      }
    })
  }

  const clearActiveSpatialSelection = (): void => {
    spatialSelection.active.idSet.forEach((id) => {
      const item = renderMap.get(id)
      if (!item) return
      clearSpatialSelectedHighlight(spatialSelection.active.dataSourceName, item.billboard)
    })
    spatialSelection.active.idSet.clear()
  }
  let unsubSpatialSelect: () => void
  let unsubClearActive: () => void
  const subscribeSpatialSelectionEvents = (): void => {

    unsubSpatialSelect = onCesiumEvent(spatialSelectEvent, (spatialSelectionData: SpatialSelectionData) => {
      if (spatialSelectionData.isActive) {
        activateSpatialSelection(spatialSelectionData)
      } else {
        const selectionRegion: SelectionRegion = {
          graphic: spatialSelectionData.graphic,
          type: spatialSelectionData.type,
          radius: spatialSelectionData.radius,
          centerLngLatAltArray: spatialSelectionData.centerLngLatAltArray,
          idSet: new Set<string>(matchedIdSet),
        }
        spatialSelection.finishedGraphicMap.set(spatialSelectionData.dataSourceName, selectionRegion)
        finishedSpatialSelection()
      }
    })

    unsubClearActive = onCesiumEvent(clearActiveEvent, () => {
      clearActiveSpatialSelection()
    })
  }

  const dispose = () => {
    unsubSpatialSelect?.()
    unsubClearActive?.()
  }

  onUnmounted(()=>{
    dispose()
  })

  return {
    spatialSelection,
    finishedSpatialSelection,
    subscribeSpatialSelectionEvents,
  }
}
