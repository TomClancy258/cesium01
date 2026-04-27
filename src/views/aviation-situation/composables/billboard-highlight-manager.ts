// src/views/aviation-situation/composables/useHighlightManager.ts
import * as Cesium from 'cesium'
import { useAviationSelectionStore } from '@/stores/aviation-selection'
import type { AircraftSelectedData } from '@/views/aviation-situation/types/aircraft'
import type { AirportSelectedData } from '@/views/aviation-situation/types/airport'

// 仅存储Cesium实例（非响应式，模块单例）
let hoveredBillboard: Cesium.Billboard | null = null
let selectedBillboard: Cesium.Billboard | null = null

// 工具方法：恢复原始图片
const restoreBillboardImage = (billboard: Cesium.Billboard) => {
  if (billboard.properties.spatialSelectionImage) {
    billboard.image=billboard.properties.spatialSelectionImage
  }else{
    billboard.image = billboard.properties.originalImage
  }
}


export function highlightBillboardOnSpatialSelection(
  dataSourceName:string,
  billboard: Cesium.Billboard,
  highlightImage: string,
): void {
  // 选中的Billboard不参与框选样式（优先级最高）
  if (billboard === selectedBillboard||billboard === hoveredBillboard) {
    billboard.properties.spatialSelectionImage=highlightImage
    return
  }

  const dataSourceNameSet:Set<string>=billboard.properties.dataSourceNameSet
  const wasEmpty = dataSourceNameSet.size === 0
  dataSourceNameSet.add(dataSourceName)

  // 只在第一次添加时才改图片，避免冗余赋值
  if (wasEmpty) {
    billboard.image = highlightImage
    billboard.properties.spatialSelectionImage = highlightImage
  }
}

export function clearSpatialSelectedHighlight(dataSourceName,billboard): void {
  if (
    billboard === hoveredBillboard ||
    billboard === selectedBillboard
  ) {
    return
  }
  const dataSourceNameSet:Set<string>=billboard.properties.dataSourceNameSet
  dataSourceNameSet.delete(dataSourceName)

  // 只在最后一个区域移除时才改回原始图片，避免冗余赋值
  if (dataSourceNameSet.size === 0) {
    billboard.image = billboard.properties.originalImage
    billboard.properties.spatialSelectionImage = undefined
  }
}

/**
 * hover高亮：视觉+同步Pinia（如果需要UI联动）
 */
export function highlightBillboardOnHover(
  billboard: Cesium.Billboard,
  highlightImage: string,
  hoverData: AircraftSelectedData | AirportSelectedData | null = null
): void {
  // 如果当前有选中的 Billboard，hover 不生效（选中优先级更高）
  if (selectedBillboard === billboard) return

  if (hoveredBillboard === billboard) return

  // 还原上一个 hover 项
  if (hoveredBillboard) {
    // 若上一个 hover 项未被选中，才恢复默认
    if (hoveredBillboard !== selectedBillboard) {
      restoreBillboardImage(hoveredBillboard)
    }
  }

  hoveredBillboard = billboard
  billboard.image = highlightImage
}

/**
 * 选中高亮：视觉+同步Pinia
 */
export function highlightBillboardAndSetSelected(
  selectedData: AircraftSelectedData | AirportSelectedData | null,
  billboard: Cesium.Billboard,
  highlightImage: string
): void {
  // 恢复上一个选中的图片
  if (selectedBillboard && selectedBillboard !== billboard) {
    restoreBillboardImage(selectedBillboard)
  }

  // 清除当前hover（选中优先级更高）
  if (hoveredBillboard === billboard) {
    hoveredBillboard = null
    // aviationSelectionStore.clearHovered()
  }

  // 更新选中实例+视觉
  selectedBillboard = billboard
  billboard.image = highlightImage
  // 同步Pinia（必选，支撑UI联动）
  const aviationSelectionStore = useAviationSelectionStore()
  aviationSelectionStore.setSelected(selectedData)
}

/**
 * 清除hover：视觉+同步Pinia
 */
export function clearHoveredBillboardHighlight(): void {
  if (hoveredBillboard && hoveredBillboard !== selectedBillboard) {
    restoreBillboardImage(hoveredBillboard)
    hoveredBillboard = null
    // aviationSelectionStore.clearHovered()
  }
}

/**
 * 清除选中：视觉+同步Pinia
 */
export function clearSelectedBillboardHighlight(): void {
  if (selectedBillboard) {
    restoreBillboardImage(selectedBillboard)
    selectedBillboard = null
    const aviationSelectionStore = useAviationSelectionStore()
    aviationSelectionStore.clearSelected()
  }
}

/**
 * 清除所有高亮
 */
export function clearAllBillboardHighlight(): void {
  clearHoveredBillboardHighlight()
  clearSelectedBillboardHighlight()
}

// 暴露实例获取方法（供外部校验用，如判断是否选中）
export function getSelectedBillboard(): Cesium.Billboard | null {
  return selectedBillboard
}

export function getHoveredBillboard(): Cesium.Billboard | null {
  return hoveredBillboard
}
