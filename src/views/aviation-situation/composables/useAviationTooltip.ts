import { reactive } from 'vue'
import type { Cartesian2 } from 'cesium'
import { updateTooltip } from '@/views/aviation-situation/utils/spatial-selection-utils.ts'

// 通用Tooltip基础属性（适配飞机/机场等航空气象要素）
export interface AviationTooltipBaseProperties {
  type?: string
  sourceType: string // 区分aircraft/airport/satellite
  [key: string]: any // 扩展字段（适配不同要素的个性化属性）
}

// 通用Tooltip状态类型
export interface AviationTooltipState<T extends AviationTooltipBaseProperties> {
  visible: boolean
  position: { left: number; top: number }
  properties: T
}

/**
 * 创建通用航空气象Tooltip
 * @param defaultProperties 默认属性（区分飞机/机场）
 * @returns tooltip状态 + 显隐方法
 */
export function useAviationTooltip<T extends AviationTooltipBaseProperties>(
  defaultProperties: T
) {
  // 初始化Tooltip状态
  const tooltip = reactive<AviationTooltipState<T>>({
    visible: false,
    position: { left: 0, top: 0 },
    properties: { ...defaultProperties }
  })

  /**
   * 显示Tooltip
   * @param screenPosition 屏幕坐标（Cesium.Cartesian2）
   * @param properties 要展示的属性
   */
  const showTooltip = (screenPosition: Cartesian2, properties: T) => {
    updateTooltip<T>(tooltip, screenPosition, properties)
  }

  /** 隐藏Tooltip */
  const hideTooltip = () => {
    tooltip.visible = false
  }

  return {
    tooltip,
    showTooltip,
    hideTooltip
  }
}
