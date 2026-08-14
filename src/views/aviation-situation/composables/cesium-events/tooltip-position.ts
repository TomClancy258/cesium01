import { reactive } from 'vue'
import type { AviationHoveredScreenPosition } from '@/views/aviation-situation/types/shared'

/** 地图 tooltip 屏幕坐标（对齐泵站 tooltipPosition；与 selection 身份分离） */
export const tooltipPosition = reactive<AviationHoveredScreenPosition>({
  left: 0,
  top: 0,
})

export function setTooltipPosition(left: number, top: number): void {
  tooltipPosition.left = left
  tooltipPosition.top = top
}

/** Cesium 窗口坐标 → tooltip 左上（右下偏移） */
export function setTooltipPositionFromWindow(x: number, y: number, offsetX = 10, offsetY = 0): void {
  setTooltipPosition(x + offsetX, y + offsetY)
}
