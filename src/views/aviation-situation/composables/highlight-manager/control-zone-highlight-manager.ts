import * as Cesium from 'cesium'
import type { ControlZoneHighlightConfig } from '@/views/aviation-situation/types/control-zone'
import type { ControlZoneProperties } from '@/network/control-zone/type'
import {
  CONTROL_ZONE_LEVEL_STYLES
} from '@/views/aviation-situation/composables/control-zone/control-zone-constants'

// 仅存储Entity实例（模块单例，非响应式）
let hoveredControlZone:Cesium.Entity=null
let selectedControlZone:Cesium.Entity=null

/**
 * 核心工具：恢复Entity所有子组件的原始状态 + 整体显隐
 */
const restoreEntityOriginalState = (entity: Cesium.Entity) => {
  if (!entity.properties) return
  const props: ControlZoneProperties = entity.properties.getValue()
  if(props.sourceType==='controlZone') {
    entity.polygon.outlineColor = props.polygon.outlineColor
  }
}

/**
 * 核心工具：设置Entity子组件的高亮样式
 */
const setEntityHighlightStyle = (entity: Cesium.Entity, config: ControlZoneHighlightConfig) => {
  if (!entity.properties) return
  const props = entity.properties.getValue()
  if(props.sourceType==='controlZone') {
    entity.polygon.outlineColor = config.polygon.outlineColor
    // entity.polygon.outlineColor = Cesium.Color.RED
  }
}

/**
 * Entity hover高亮：通用化支持多组件
 * @param entity 目标Entity
 * @param highlightConfig 高亮配置（支持多组件+显隐）
 */
export function highlightControlZoneOnHover(
  entity: Cesium.Entity,
  highlightConfig:ControlZoneHighlightConfig
): void {
  // 如果当前有选中的 Billboard，hover 不生效（选中优先级更高）
  if (selectedControlZone === entity) return

  if (hoveredControlZone === entity) return

  // 还原上一个 hover 项
  if (hoveredControlZone) {
    // 若上一个 hover 项未被选中，才恢复默认
    if (hoveredControlZone !== selectedControlZone) {
      restoreEntityOriginalState(hoveredControlZone)
    }
  }

  // 设置新hover高亮
  hoveredControlZone = entity
  setEntityHighlightStyle(entity, highlightConfig)

}

/**
 * Entity选中高亮：通用化支持多组件
 */
export function highlightControlZoneOnSelect(
  entity: Cesium.Entity,
  highlightConfig: ControlZoneHighlightConfig,
): void {
  if (selectedControlZone === entity) return

  // 恢复上一个选中的Entity
  if (selectedControlZone) {
    restoreEntityOriginalState(selectedControlZone)
  }

  // 清除当前hover
  if (hoveredControlZone === entity) {
    hoveredControlZone = null
  }

  // 设置选中高亮
  selectedControlZone = entity
  setEntityHighlightStyle(entity, highlightConfig)
}

/**
 * 清除Entity hover高亮
 */
export function clearHoveredControlZoneHighlight(): void {
  if (hoveredControlZone && hoveredControlZone !== selectedControlZone) {
    restoreEntityOriginalState(hoveredControlZone)
    hoveredControlZone = null
  }
}

/**
 * 清除Entity选中高亮
 */
export function clearSelectedControlZoneHighlight(): void {
  if (selectedControlZone) {
    restoreEntityOriginalState(selectedControlZone)
    selectedControlZone = null
  }
}

/**
 * 清除所有Entity高亮
 */
export function clearAllControlZoneHighlight(): void {
  clearHoveredControlZoneHighlight()
  clearSelectedControlZoneHighlight()
}

// 暴露实例供外部校验
export function getHoveredEntity(): Cesium.Entity | null {
  return hoveredControlZone
}

export function getSelectedEntity(): Cesium.Entity | null {
  return selectedControlZone
}
