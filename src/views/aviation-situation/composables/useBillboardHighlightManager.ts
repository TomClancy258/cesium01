// src/views/aviation-situation/composables/useHighlightManager.ts
import * as Cesium from 'cesium'
import { useHighlightStore } from '@/stores/highlight'
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
  // 第一步：先恢复上一个hover的图片（无论当前目标是不是选中态，都要清旧hover）
  if (hoveredBillboard && hoveredBillboard !== selectedBillboard) {
    restoreBillboardImage(hoveredBillboard)
    hoveredBillboard = null // 清空旧hover实例
  }

  // 第二步：判断选中态/重复hover，直接返回（无需设置新hover）
  if (selectedBillboard === billboard || hoveredBillboard === billboard) {
    // 同步清空Pinia的hover状态（如果用了的话）
    // highlightStore.clearHovered()
    return
  }

  // 第三步：设置新hover（只有非选中、非重复hover才执行）
  hoveredBillboard = billboard
  billboard.image = highlightImage
  // 同步Pinia（如果UI需要hover响应式）
  // highlightStore.setHovered(hoverData)
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
