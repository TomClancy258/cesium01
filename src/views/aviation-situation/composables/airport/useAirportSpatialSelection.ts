import type { AirportRenderItem } from './useAirports'
import type { SpatialSelectionData } from '../types/shared'
import * as turf from '@turf/turf'
import { highlightBillboardOnSpatialSelection, clearSpatialSelectedHighlight } from '../useBillboardHighlightManager'
import airportSpatialSelectedSvgRawDataUrl from '@/assets/img/airport/svg/airport-spatial-selected.svg?raw'

// 提前处理 SVG DataURL（和原文件保持一致）
const airportSpatialSelectedSvgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(airportSpatialSelectedSvgRawDataUrl)}`

/**
 * 机场空间框选状态类型（和主 Hook 共享）
 */
export interface SpatialSelectionActive {
  type: string
  dataSourceName: string
  graphic: any // 替换为实际的 Graphic 类型
  icaoSet: Set<string>
}

export interface SelectionRegion {
  type: string
  graphic: any // 替换为实际的 Graphic 类型
  billboards: Array<any>
  icaoSet: Set<string>
}

export interface SpatialSelection {
  active: SpatialSelectionActive
  finishedGraphicMap: Map<string, SelectionRegion>
}

/**
 * 机场空间框选核心 Hook
 * @param airportRenderMap 机场渲染映射表（来自 useAirports）
 * @param matchedIcaoSet 匹配的机场ICAO集合（来自 useAirports）
 * @param spatialSelection 框选状态（来自 useAirports）
 */
export function useAirportSpatialSelection(
  airportRenderMap: Map<string, AirportRenderItem>,
  matchedIcaoSet: Set<string>,
  spatialSelection: SpatialSelection
) {
  /**
   * 清空激活态的空间框选高亮
   */
  const clearAirportActiveSpatialSelection = () => {
    spatialSelection.active.icaoSet.forEach((icao) => {
      const airportRenderItem = airportRenderMap.get(icao)
      if (!airportRenderItem) return
      const { billboard } = airportRenderItem
      clearSpatialSelectedHighlight(spatialSelection.active.dataSourceName, billboard)
    })
    spatialSelection.active.icaoSet.clear()
  }

  /**
   * 激活空间框选（动态框选过程中）
   * @param spatialSelectionData 框选数据
   */
  const activateSpatialSelection = (spatialSelectionData: SpatialSelectionData): void => {
    spatialSelection.active.type = spatialSelectionData.type
    spatialSelection.active.dataSourceName = spatialSelectionData.dataSourceName
    spatialSelection.active.graphic = spatialSelectionData.graphic
    spatialSelection.active.icaoSet.clear()

    // 只遍历当前匹配筛选条件的机场
    matchedIcaoSet.forEach((icao) => {
      const airportRenderItem = airportRenderMap.get(icao)
      if (!airportRenderItem) return

      const { airport, billboard } = airportRenderItem
      const turfPoint = turf.point([airport.longitude, airport.latitude])
      let isInPolygon = false

      if (spatialSelectionData.type === 'polygon') {
        isInPolygon = turf.booleanPointInPolygon(turfPoint, spatialSelectionData.graphic)
      }

      if (isInPolygon) {
        spatialSelection.active.icaoSet.add(icao)
        highlightBillboardOnSpatialSelection(
          spatialSelectionData.dataSourceName,
          billboard,
          airportSpatialSelectedSvgDataUrl
        )
      } else {
        clearSpatialSelectedHighlight(spatialSelectionData.dataSourceName, billboard)
      }
    })
  }

  /**
   * 完成空间框选（确认框选后）
   */
  const finishedSpatialSelection = (): void => {
    matchedIcaoSet.forEach((icao) => {
      const airportRenderItem = airportRenderMap.get(icao)
      if (!airportRenderItem) return
      const { airport, billboard } = airportRenderItem

      // 构建 Turf 点
      const turfPoint: turf.Feature<turf.Point> = turf.point([
        airport.longitude,
        airport.latitude,
      ])

      for (const [dataSourceName, selectionRegion] of spatialSelection.finishedGraphicMap) {
        let isInGraphic = false
        if (selectionRegion.type === 'polygon') {
          isInGraphic = turf.booleanPointInPolygon(turfPoint, selectionRegion.graphic)
        }

        if (isInGraphic) {
          highlightBillboardOnSpatialSelection(dataSourceName, billboard, airportSpatialSelectedSvgDataUrl)
        } else {
          clearSpatialSelectedHighlight(dataSourceName, billboard)
        }
      }
    })
  }

  return {
    clearAirportActiveSpatialSelection,
    activateSpatialSelection,
    finishedSpatialSelection
  }
}
