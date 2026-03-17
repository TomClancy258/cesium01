import type { Graphic, SpatialSelectionData } from '@/views/aviation-situation/types/shared'
import type { AircraftRenderItem } from './useAircrafts'
import { airplaneSpatialSelectedSvgRawDataUrl } from './aircraftConstants'
import {
  highlightBillboardOnSpatialSelection,
  clearSpatialSelectedHighlight,
} from '../useBillboardHighlightManager'
import * as turf from '@turf/turf'

// 定义类型（与原文件保持一致）
interface SelectionRegion {
  type: string
  graphic: Graphic
  billboard: Cesium.Billboard[]
  icao24Set: Set<string>
}

interface SpatialSelectionActive {
  type: string
  dataSourceName: string
  graphic: Graphic
  icao24Set: Set<string>
}

interface SpatialSelection {
  finishedGraphicMap: Map<string, SelectionRegion>
  active: SpatialSelectionActive
}

/**
 * 飞机空间选择（框选）管理
 * @param aircraftRenderMap 飞机渲染实例Map
 * @param matchedIcao24Set 筛选匹配的飞机icao24集合
 */
export function useSpatialSelection(
  aircraftRenderMap: Map<string, AircraftRenderItem>,
  matchedIcao24Set: Set<string>
) {
  // 空间选择状态
  const spatialSelection: SpatialSelection = {
    active: {
      type: '',
      dataSourceName: '',
      graphic: null,
      icao24Set: new Set<string>(),
    },
    finishedGraphicMap: new Map(),
  }

  /**
   * 清空活跃的空间选择（取消框选状态）
   */
  const clearAircraftActiveSpatialSelection = () => {
    spatialSelection.active.icao24Set.forEach((icao24) => {
      const aircraftRenderItem = aircraftRenderMap.get(icao24)
      if (!aircraftRenderItem) return
      const { billboard } = aircraftRenderItem
      clearSpatialSelectedHighlight(spatialSelection.active.dataSourceName, billboard)
    })
    spatialSelection.active.icao24Set.clear()
  }

  /**
   * 完成空间选择（框选结束后更新最终状态）
   */
  const finishedSpatialSelection = (): void => {
    matchedIcao24Set.forEach((icao24) => {
      const aircraftRenderItem = aircraftRenderMap.get(icao24)
      if (!aircraftRenderItem) return
      const { aircraft, billboard } = aircraftRenderItem

      // 构建Turf点用于空间判断
      const turfPoint: turf.Feature<turf.Point> = turf.point([
        aircraft.longitude,
        aircraft.latitude,
      ])

      // 遍历所有已完成的框选区域，更新飞机高亮状态
      for (const [dataSourceName, selectionRegion] of spatialSelection.finishedGraphicMap) {
        let isInGraphic: boolean = false
        if (selectionRegion.type === 'polygon') {
          isInGraphic = turf.booleanPointInPolygon(turfPoint, selectionRegion.graphic)
        }

        if (isInGraphic) {
          highlightBillboardOnSpatialSelection(
            dataSourceName,
            billboard,
            airplaneSpatialSelectedSvgRawDataUrl
          )
        } else {
          clearSpatialSelectedHighlight(dataSourceName, billboard)
        }
      }
    })
  }

  /**
   * 激活空间选择（框选过程中实时更新选中状态）
   * @param spatialSelectionData 框选数据
   */
  const activateSpatialSelection = (spatialSelectionData: SpatialSelectionData): void => {
    spatialSelection.active.type = spatialSelectionData.type
    spatialSelection.active.dataSourceName = spatialSelectionData.dataSourceName
    spatialSelection.active.graphic = spatialSelectionData.graphic
    spatialSelection.active.icao24Set.clear()

    // 仅遍历筛选匹配的飞机，提升性能
    matchedIcao24Set.forEach((icao24) => {
      const aircraftRenderItem = aircraftRenderMap.get(icao24)
      if (!aircraftRenderItem) return

      const { aircraft, billboard } = aircraftRenderItem
      const turfPoint = turf.point([aircraft.longitude, aircraft.latitude])
      let isInPolygon: boolean = false

      if (spatialSelectionData.type === 'polygon') {
        isInPolygon = turf.booleanPointInPolygon(turfPoint, spatialSelectionData.graphic)
      }

      if (isInPolygon) {
        spatialSelection.active.icao24Set.add(icao24)
        highlightBillboardOnSpatialSelection(
          spatialSelectionData.dataSourceName,
          billboard,
          airplaneSpatialSelectedSvgRawDataUrl
        )
      } else {
        clearSpatialSelectedHighlight(spatialSelectionData.dataSourceName, billboard)
      }
    })
  }

  /**
   * 处理空间选择事件（统一入口）
   * @param spatialSelectionData 框选数据
   */
  const handleSpatialSelect = (spatialSelectionData: SpatialSelectionData) => {
    if (spatialSelectionData.isActive) {
      activateSpatialSelection(spatialSelectionData)
    } else {
      const selectionRegion: SelectionRegion = {
        graphic: spatialSelectionData.graphic,
        type: spatialSelectionData.type,
        billboard: [],
        icao24Set: new Set<string>(matchedIcao24Set),
      }
      spatialSelection.finishedGraphicMap.set(spatialSelectionData.dataSourceName, selectionRegion)
      finishedSpatialSelection()
    }
  }

  // 暴露方法和状态
  return {
    spatialSelection,
    clearAircraftActiveSpatialSelection,
    finishedSpatialSelection,
    activateSpatialSelection,
    handleSpatialSelect,
  }
}
