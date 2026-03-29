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
import { isInCircle, isInsideHemisphere } from '@/utils/geoUtils'
import { useSpatialSelectStore } from '@/stores/spatialSelect'

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

  const spatialSelectStore = useSpatialSelectStore()

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

    // 重置对应计数
    if (spatialSelectEvent === 'aircraftSpatialSelect') {
      spatialSelectStore.setActiveAircraftNum(0)
    } else if (spatialSelectEvent === 'airportSpatialSelect') {
      spatialSelectStore.setActiveAirportNum(0)
    }

    matchedIdSet.forEach((id) => {
      const item = renderMap.get(id)
      if (!item) return

      const [lng, lat] = getCoord(item.data)
      let isInGraphic = false

      if (spatialSelectionData.sourceType === 'polygonSpatialSelection') {
        const turfPoint = turf.point([lng, lat])
        isInGraphic = turf.booleanPointInPolygon(turfPoint, spatialSelectionData.graphic)
      }else if (spatialSelectionData.sourceType === 'circleSpatialSelection') {
        isInGraphic = isInCircle([lng, lat],spatialSelectionData.centerLngLatAltArray,spatialSelectionData.radius)
      }else if (spatialSelectionData.sourceType === 'hemisphereSpatialSelection') {
        isInGraphic = isInsideHemisphere([lng, lat],spatialSelectionData.centerLngLatAltArray,spatialSelectionData.radius)
      }
      if (isInGraphic) {
        spatialSelection.active.idSet.add(id)
        // 累加对应计数
        if (spatialSelectEvent === 'aircraftSpatialSelect') {
          spatialSelectStore.setActiveAircraftNum(spatialSelectStore.spatialSelection.active.aircraftNum + 1)
        } else if (spatialSelectEvent === 'airportSpatialSelect') {
          spatialSelectStore.setActiveAirportNum(spatialSelectStore.spatialSelection.active.airportNum + 1)
        }
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
        if (selectionRegion.sourceType === 'polygonSpatialSelection') {
          const turfPoint = turf.point([lng, lat])
          isInGraphic = turf.booleanPointInPolygon(turfPoint, selectionRegion.graphic)
        }else if (selectionRegion.sourceType === 'circleSpatialSelection') {
          isInGraphic = isInCircle([lng, lat],selectionRegion.centerLngLatAltArray,selectionRegion.radius)
        }else if (selectionRegion.sourceType === 'hemisphereSpatialSelection') {
          isInGraphic = isInsideHemisphere([lng, lat],selectionRegion.centerLngLatAltArray,selectionRegion.radius)
        }

        if (isInGraphic) {
          // console.log("dataSourceName", dataSourceName);
          // console.log("selectionRegion", selectionRegion);
          if (spatialSelectEvent === 'aircraftSpatialSelect') {

          } else if (spatialSelectEvent === 'airportSpatialSelect') {

          }
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
          sourceType:spatialSelectionData.sourceType,
          centerLngLatAltArray: spatialSelectionData.centerLngLatAltArray,
          // metricsEntity:spatialSelectionData.metricsEntity
          // idSet: new Set<string>(matchedIdSet), //似乎可以去掉

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
