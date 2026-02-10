import * as Cesium from 'cesium'

// 全局状态：hover 高亮（临时）、select 选中（持久）
let currentHoveredBillboard: Cesium.Billboard | null = null
let currentSelectedBillboard: Cesium.Billboard | null = null

/**
 * 高亮 hover 状态（临时，鼠标离开重置）
 * @param billboard 目标 Billboard
 * @param highlightImage hover 图片
 */
export function highlightBillboardHover(
  billboard: Cesium.Billboard,
  highlightImage: string
): void {
  // 如果当前有选中的 Billboard，hover 不生效（选中优先级更高）
  if (currentSelectedBillboard === billboard) return

  if (currentHoveredBillboard === billboard) return
  // 还原上一个 hover 项
  if (currentHoveredBillboard) {
    // 若上一个 hover 项未被选中，才恢复默认
    if (currentHoveredBillboard !== currentSelectedBillboard) {
      currentHoveredBillboard.image = currentHoveredBillboard.properties.originalImage
    }
  }
  currentHoveredBillboard = billboard
  billboard.image = highlightImage
}

/**
 * 高亮 select 状态（持久，直到主动清除）
 * @param billboard 目标 Billboard
 * @param highlightImage 选中图片
 */
export function highlightBillboardSelect(
  billboard: Cesium.Billboard,
  highlightImage: string
): void {
  // 还原上一个选中项
  if (currentSelectedBillboard && currentSelectedBillboard !== billboard) {
    currentSelectedBillboard.image = currentSelectedBillboard.properties.originalImage
  }
  // 清除当前 hover 状态（选中优先级更高）
  if (currentHoveredBillboard === billboard) {
    currentHoveredBillboard = null
  }
  currentSelectedBillboard = billboard
  billboard.image = highlightImage
}

/**
 * 清除 hover 高亮（鼠标离开时调用）
 */
export function clearHoveredHighlight(): void {
  if (currentHoveredBillboard && currentHoveredBillboard !== currentSelectedBillboard) {
    currentHoveredBillboard.image = currentHoveredBillboard.properties.originalImage
    currentHoveredBillboard = null
  }
}

/**
 * 清除 select 高亮（关闭抽屉/切换选中项时调用）
 */
export function clearSelectedHighlight(): void {
  if (currentSelectedBillboard) {
    currentSelectedBillboard.image = currentSelectedBillboard.properties.originalImage
    currentSelectedBillboard = null
  }
}

/**
 * 清除所有高亮（兜底）
 */
export function clearAllHighlight(): void {
  clearHoveredHighlight()
  clearSelectedHighlight()
}
