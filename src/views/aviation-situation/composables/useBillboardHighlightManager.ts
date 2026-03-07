// src/views/aviation-situation/composables/useHighlightManager.ts
import * as Cesium from 'cesium'
import { useHighlightStore } from '@/stores/aviationSelection'
import type { AircraftSelectedData } from '@/views/aviation-situation/types/aircraft'
import type { AirportSelectedData } from '@/views/aviation-situation/types/airport'

// 仅存储Cesium实例（非响应式，模块单例）
let hoveredBillboard: Cesium.Billboard | null = null
let selectedBillboard: Cesium.Billboard | null = null

const highlightStore = useHighlightStore()

// 工具方法：恢复原始图片
const restoreBillboardImage = (billboard: Cesium.Billboard) => {
  if (billboard.properties?.originalImage) {
    billboard.image = billboard.properties.originalImage
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
    // highlightStore.clearHovered()
  }

  // 更新选中实例+视觉
  selectedBillboard = billboard
  billboard.image = highlightImage
  // 同步Pinia（必选，支撑UI联动）
  highlightStore.setSelected(selectedData)
}

/**
 * 清除hover：视觉+同步Pinia
 */
export function clearHoveredHighlight(): void {
  if (hoveredBillboard && hoveredBillboard !== selectedBillboard) {
    restoreBillboardImage(hoveredBillboard)
    hoveredBillboard = null
    // highlightStore.clearHovered()
  }
}

/**
 * 清除选中：视觉+同步Pinia
 */
export function clearSelectedHighlight(): void {
  if (selectedBillboard) {
    restoreBillboardImage(selectedBillboard)
    selectedBillboard = null
    highlightStore.clearSelected()
  }
}

/**
 * 清除所有高亮
 */
export function clearAllHighlight(): void {
  clearHoveredHighlight()
  clearSelectedHighlight()
}

// 暴露实例获取方法（供外部校验用，如判断是否选中）
export function getSelectedBillboard(): Cesium.Billboard | null {
  return selectedBillboard
}

export function getHoveredBillboard(): Cesium.Billboard | null {
  return hoveredBillboard
}
