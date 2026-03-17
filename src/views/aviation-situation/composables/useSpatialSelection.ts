// src/views/aviation-situation/composables/useSpatialSelection.ts

import * as turf from '@turf/turf'
import type { SpatialSelectionData, SelectionRegion, SpatialSelection } from '../types/shared'
import {
  highlightBillboardOnSpatialSelection,
  clearSpatialSelectedHighlight,
} from './useBillboardHighlightManager'
import { onCesiumEvent } from './mittBus'

interface UseSpatialSelectionOptions<T> {
  /** 当前筛选匹配的 id 集合（引用，保持响应式） */
  matchedIdSet: Set<string>
  /** 完整渲染 Map，key 为 id */
  renderMap: Map<string, { data: T; billboard: any; label: any }>
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
      const turfPoint = turf.point([lng, lat])
      let isInPolygon = false

      if (spatialSelectionData.type === 'polygon') {
        isInPolygon = turf.booleanPointInPolygon(turfPoint, spatialSelectionData.graphic)
      }

      if (isInPolygon) {
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
      const turfPoint = turf.point([lng, lat])

      for (const [dataSourceName, selectionRegion] of spatialSelection.finishedGraphicMap) {
        let isInGraphic = false
        if (selectionRegion.type === 'polygon') {
          isInGraphic = turf.booleanPointInPolygon(turfPoint, selectionRegion.graphic)
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

  return {
    spatialSelection,
    finishedSpatialSelection,
    dispose,
    subscribeSpatialSelectionEvents,
  }
}
