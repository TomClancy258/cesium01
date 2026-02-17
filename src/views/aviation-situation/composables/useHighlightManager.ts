import * as Cesium from 'cesium'
import { useHighlightStore } from '@/stores/highlight'

// 全局状态：hover 高亮（临时）、select 选中（持久）
let hoveredBillboard: Cesium.Billboard | null = null
let selectedBillboard: Cesium.Billboard | null = null

const highlightStore=useHighlightStore()
/**
 * 高亮 hover 状态（临时，鼠标离开重置）
 * @param billboard 目标 Billboard
 * @param highlightImage hover 图片
 */
export function highlightBillboardOnHover(
  billboard: Cesium.Billboard,
  highlightImage: string
): void {
  // 如果当前有选中的 Billboard，hover 不生效（选中优先级更高）
  if (selectedBillboard === billboard) return

  if (hoveredBillboard === billboard) return
  // 还原上一个 hover 项
  if (hoveredBillboard) {
    // 若上一个 hover 项未被选中，才恢复默认
    if (hoveredBillboard !== selectedBillboard) {
      hoveredBillboard.image = hoveredBillboard.properties.originalImage
    }
  }
  hoveredBillboard = billboard
  billboard.image = highlightImage
}

/**
 * 高亮 select 状态（持久，直到主动清除）
 * @param billboard 目标 Billboard
 * @param highlightImage 选中图片
 */
export function highlightBillboardAndSetSelected(
  selectedData: AircraftSelectedData | AirportSelectedData | null,
  billboard: Cesium.Billboard,
  highlightImage: string
): void {
  // 还原上一个选中项
  if (selectedBillboard && selectedBillboard !== billboard) {
    selectedBillboard.image = selectedBillboard.properties.originalImage
  }
  // 清除当前 hover 状态（选中优先级更高）
  if (hoveredBillboard === billboard) {
    hoveredBillboard = null
  }
  selectedBillboard = billboard
  billboard.image = highlightImage

  highlightStore.setSelected(selectedData)
}

/**
 * 清除 hover 高亮（鼠标离开时调用）
 */
export function clearHoveredHighlight(): void {
  if (hoveredBillboard && hoveredBillboard !== selectedBillboard) {
    hoveredBillboard.image = hoveredBillboard.properties.originalImage
    hoveredBillboard = null
  }
}

/**
 * 清除 select 高亮（关闭抽屉/切换选中项时调用）
 */
export function clearSelectedHighlight(): void {
  if (selectedBillboard) {
    selectedBillboard.image = selectedBillboard.properties.originalImage
    selectedBillboard = null
    highlightStore.clearSelected()
  }
}

/**
 * 清除所有高亮（兜底）
 */
export function clearAllHighlight(): void {
  clearHoveredHighlight()
  clearSelectedHighlight()
}
