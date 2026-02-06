import * as Cesium from 'cesium'

// 唯一高亮状态（整个应用只能有一个高亮对象）
let currentHighlightedBillboard: Cesium.Billboard | null = null

/**
 * 高亮指定 Billboard
 * @param billboard 要高亮的对象
 * @param highlightImage 高亮时使用的图片（如黄色飞机）
 */
export function highlightBillboard(
  billboard: Cesium.Billboard,
  highlightImage: string
): void {
  // 防闪烁：如果是同一个对象，直接返回
  if (currentHighlightedBillboard === billboard) {
    return
  }
  // 还原上一个
  if (currentHighlightedBillboard) {
    currentHighlightedBillboard.image = currentHighlightedBillboard.properties.originalImage
  }

  // 高亮新对象
  billboard.image = highlightImage
  currentHighlightedBillboard = billboard
}

/**
 * 清除当前高亮（用于鼠标移出或切换场景）
 */
export function clearHighlight(): void {
  if (currentHighlightedBillboard) {
    currentHighlightedBillboard.image = currentHighlightedBillboard.properties.originalImage
    currentHighlightedBillboard = null
  }
}
