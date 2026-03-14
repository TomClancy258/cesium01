import * as Cesium from 'cesium'
import { useAviationSelectionStore } from '@/stores/aviationSelection'
import type { AircraftSelectedData } from '@/views/aviation-situation/types/aircraft'
import type { AirportSelectedData } from '@/views/aviation-situation/types/airport'

interface HighlightState {
  hoveredBillboard: Cesium.Billboard | null
  selectedBillboard: Cesium.Billboard | null
  boxSelectedBillboards: Cesium.Billboard[] // 存储框选的Billboard
}

// 高亮状态管理（单例）
const highlightState: HighlightState = {
  hoveredBillboard: null,
  selectedBillboard: null,
  boxSelectedBillboards: [], // 存储框选的Billboard
}

const aviationSelectionStore = useAviationSelectionStore()

// 工具方法：恢复原始图片
const restoreBillboardImage = (billboard: Cesium.Billboard) => {
  if (billboard.properties?.originalImage) {
    billboard.image = billboard.properties.originalImage
  }
}

// ========== 框选高亮相关 ==========
/**
 * 批量设置框选高亮
 * @param billboards 目标Billboard数组
 * @param isInBox 是否在框选范围内（true=高亮，false=恢复）
 * @param boxSelectImage 框选高亮图片地址（外部传入）
 */
export function setBoxSelectionHighlight(
  billboards: Cesium.Billboard[],
  isInBox: boolean,
  boxSelectImage: string,
): void {
  billboards.forEach((billboard) => {
    // 选中的Billboard不参与框选样式（优先级最高）
    if (billboard === highlightState.selectedBillboard) return

    if (isInBox) {
      highlightState.boxSelectedBillboards.add(billboard)
      billboard.image = boxSelectImage
    } else {
      highlightState.boxSelectedBillboards.delete(billboard)
      // 若不在框选且不是hover状态，恢复原始样式；否则保留hover样式
      if (billboard !== highlightState.hoveredBillboard) {
        restoreBillboardImage(billboard)
      }
    }
  })
}

export function highlightBillboardOnBoxSelection(
  billboard: Cesium.Billboard,
  highlightImage: string,
): void {
  // 选中的Billboard不参与框选样式（优先级最高）
  if (billboard === highlightState.selectedBillboard) return
  else if (billboard === highlightState.hoveredBillboard) return

  billboard.image = highlightImage
  billboard.properties.isBoxSelected = true
  billboard.properties.boxSelectionImage = highlightImage
  // highlightState.boxSelectedBillboards.push(billboard)
}

export function clearBoxSelectedHighlight(billboard): void {
  if (
    billboard !== highlightState.hoveredBillboard &&
    billboard !== highlightState.selectedBillboard
  ) {
    billboard.image = billboard.properties.originalImage
    billboard.properties.boxSelectionImage = undefined
  }
}

// ========== Hover高亮 ==========
/**
 * Billboard鼠标悬浮高亮
 * @param billboard 目标Billboard
 * @param highlightImage hover高亮图片地址
 * @param hoverData 悬浮关联数据
 */
export function highlightBillboardOnHover(
  billboard: Cesium.Billboard,
  highlightImage: string,
  hoverData: AircraftSelectedData | AirportSelectedData | null = null,
): void {
  // 选中/框选的Billboard，hover不生效（优先级更低）
  if (
    billboard === highlightState.selectedBillboard ||
    highlightState.boxSelectedBillboards.has(billboard)
  ) {
    return
  }

  if (highlightState.hoveredBillboard === billboard) return

  // 还原上一个hover项
  if (highlightState.hoveredBillboard) {
    if (
      highlightState.hoveredBillboard !== highlightState.selectedBillboard &&
      !highlightState.boxSelectedBillboards.has(highlightState.hoveredBillboard)
    ) {
      restoreBillboardImage(highlightState.hoveredBillboard)
    }
  }

  highlightState.hoveredBillboard = billboard
  billboard.image = highlightImage
}

// ========== 选中高亮 ==========
/**
 * 选中Billboard并设置高亮
 * @param selectedData 选中关联数据
 * @param billboard 目标Billboard
 * @param highlightImage 选中高亮图片地址
 * @param boxSelectImage 框选样式图片地址（用于恢复上一个选中项的框选样式）
 */
export function highlightBillboardAndSetSelected(
  selectedData: AircraftSelectedData | AirportSelectedData | null,
  billboard: Cesium.Billboard,
  highlightImage: string,
  boxSelectImage: string,
): void {
  // 恢复上一个选中项
  if (highlightState.selectedBillboard && highlightState.selectedBillboard !== billboard) {
    // 若上一个选中项在框选范围内，恢复为框选样式；否则恢复原始
    if (highlightState.boxSelectedBillboards.has(highlightState.selectedBillboard)) {
      highlightState.selectedBillboard.image = boxSelectImage
    } else {
      restoreBillboardImage(highlightState.selectedBillboard)
    }
  }

  // 清除当前hover
  if (highlightState.hoveredBillboard === billboard) {
    highlightState.hoveredBillboard = null
  }

  // 更新选中状态+样式
  highlightState.selectedBillboard = billboard
  billboard.image = highlightImage
  aviationSelectionStore.setSelected(selectedData)
}

// ========== 清除高亮 ==========
/**
 * 清除悬浮高亮
 * @param boxSelectImage 框选样式图片地址（用于恢复框选项的样式）
 */
export function clearHoveredHighlight(boxSelectImage: string): void {
  if (
    highlightState.hoveredBillboard &&
    highlightState.hoveredBillboard !== highlightState.selectedBillboard
  ) {
    // 若hover项在框选范围内，恢复为框选样式；否则恢复原始
    if (highlightState.boxSelectedBillboards.has(highlightState.hoveredBillboard)) {
      highlightState.hoveredBillboard.image = boxSelectImage
    } else {
      restoreBillboardImage(highlightState.hoveredBillboard)
    }
    highlightState.hoveredBillboard = null
  }
}

/**
 * 清除选中高亮
 * @param boxSelectImage 框选样式图片地址（用于恢复框选项的样式）
 */
export function clearSelectedHighlight(boxSelectImage: string): void {
  if (highlightState.selectedBillboard) {
    // 若选中项在框选范围内，恢复为框选样式；否则恢复原始
    if (highlightState.boxSelectedBillboards.has(highlightState.selectedBillboard)) {
      highlightState.selectedBillboard.image = boxSelectImage
    } else {
      restoreBillboardImage(highlightState.selectedBillboard)
    }
    highlightState.selectedBillboard = null
    aviationSelectionStore.clearSelected()
  }
}

/**
 * 清除所有高亮
 * @param hoverImage hover样式图片地址
 * @param boxSelectImage 框选样式图片地址
 */
export function clearAllHighlight(hoverImage: string, boxSelectImage: string): void {
  clearHoveredHighlight(boxSelectImage)
  clearSelectedHighlight(boxSelectImage)
  clearBoxSelectionHighlight(hoverImage)
}

// 暴露状态查询方法（供外部校验）
export function getHighlightState() {
  return {
    hoveredBillboard: highlightState.hoveredBillboard,
    selectedBillboard: highlightState.selectedBillboard,
    boxSelectedBillboards: [...highlightState.boxSelectedBillboards],
  }
}
