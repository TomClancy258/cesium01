import * as Cesium from 'cesium'
import type { EntityProperties, EntityHighlightConfig, EntityComponent } from '@/views/aviation-situation/types/entity'

// 仅存储Entity实例（模块单例，非响应式）
let hoveredEntity: Cesium.Entity | null = null
let selectedEntity: Cesium.Entity | null = null

/**
 * 工具方法：生成原始属性的键名（如 polyline+material → originalPolylineMaterial）
 */
const getOriginalPropKey = (component: EntityComponent): string => {
  return `original${component.type.charAt(0).toUpperCase() + component.type.slice(1)}${component.prop.charAt(0).toUpperCase() + component.prop.slice(1)}`
}

/**
 * 通用工具：保存单个组件的原始状态
 */
const saveComponentOriginalState = (entity: Cesium.Entity, component: EntityComponent) => {
  if (!entity.properties) return
  const props = entity.properties.getValue() as EntityProperties
  const originalKey = getOriginalPropKey(component)

  // 仅首次保存原始值（避免覆盖）
  if (props[originalKey as keyof EntityProperties] === undefined) {
    const entityComponent = (entity as any)[component.type] // 取Entity的子组件（如entity.polyline）
    if (entityComponent) {
      props[originalKey as keyof EntityProperties] = (entityComponent as any)[component.prop]
    }
  }
}

/**
 * 通用工具：恢复单个组件的原始状态
 */
const restoreComponentOriginalState = (entity: Cesium.Entity, component: EntityComponent) => {
  if (!entity.properties) return
  const props = entity.properties.getValue() as EntityProperties
  const originalKey = getOriginalPropKey(component)
  const originalValue = props[originalKey as keyof EntityProperties]

  if (originalValue !== undefined) {
    const entityComponent = (entity as any)[component.type]
    if (entityComponent) {
      (entityComponent as any)[component.prop] = originalValue
    }
  }
}

/**
 * 核心工具：恢复Entity所有子组件的原始状态 + 整体显隐
 */
const restoreEntityOriginalState = (entity: Cesium.Entity) => {
  if (!entity.properties) return
  const props = entity.properties.getValue() as EntityProperties

  // 1. 恢复整体显隐状态
  if (props.originalShow !== undefined) {
    entity.show = props.originalShow
  }

  // 2. 恢复所有可能的子组件原始状态（按需扩展，无需频繁改代码）
  const allPossibleComponents: EntityComponent[] = [
    { type: 'polyline', prop: 'material', value: Cesium.Color.WHITE },
    { type: 'label', prop: 'fillColor', value: Cesium.Color.WHITE },
    { type: 'point', prop: 'color', value: Cesium.Color.WHITE },
    { type: 'polygon', prop: 'material', value: Cesium.Color.WHITE }
  ]

  allPossibleComponents.forEach(component => {
    restoreComponentOriginalState(entity, component)
  })
}

/**
 * 核心工具：设置Entity子组件的高亮样式
 */
const setEntityHighlightStyle = (entity: Cesium.Entity, config: EntityHighlightConfig) => {
  if (!entity.properties) return
  const props = entity.properties.getValue() as EntityProperties

  // 1. 设置整体显隐
  if (config.show !== undefined) {
    // 首次设置时保存原始显隐状态
    if (props.originalShow === undefined) {
      props.originalShow = entity.show
    }
    entity.show = config.show
  }

  // 2. 设置子组件高亮样式（逐个处理）
  if (config.components && config.components.length > 0) {
    config.components.forEach(component => {
      // 先保存原始状态（首次高亮时）
      saveComponentOriginalState(entity, component)
      // 设置高亮值
      const entityComponent = (entity as any)[component.type]
      if (entityComponent) {
        (entityComponent as any)[component.prop] = component.value
      }
    })
  }
}

/**
 * Entity hover高亮：通用化支持多组件
 * @param entity 目标Entity
 * @param highlightConfig 高亮配置（支持多组件+显隐）
 */
export function highlightEntityOnHover(
  entity: Cesium.Entity,
  highlightConfig: EntityHighlightConfig
): void {
  // 恢复上一个hover的Entity
  if (hoveredEntity && hoveredEntity !== selectedEntity) {
    restoreEntityOriginalState(hoveredEntity)
    hoveredEntity = null
  }

  // 选中态/重复hover，直接返回
  if (selectedEntity === entity || hoveredEntity === entity) {
    return
  }

  // 设置新hover高亮
  hoveredEntity = entity
  setEntityHighlightStyle(entity, highlightConfig)
}

/**
 * Entity选中高亮：通用化支持多组件
 */
export function highlightEntityAndSetSelected(
  entity: Cesium.Entity,
  highlightConfig: EntityHighlightConfig
): void {
  // 恢复上一个选中的Entity
  if (selectedEntity && selectedEntity !== entity) {
    restoreEntityOriginalState(selectedEntity)
  }

  // 清除当前hover
  if (hoveredEntity === entity) {
    hoveredEntity = null
  }

  // 设置选中高亮
  selectedEntity = entity
  setEntityHighlightStyle(entity, highlightConfig)
}

/**
 * 清除Entity hover高亮
 */
export function clearHoveredEntityHighlight(): void {
  if (hoveredEntity && hoveredEntity !== selectedEntity) {
    restoreEntityOriginalState(hoveredEntity)
    hoveredEntity = null
  }
}

/**
 * 清除Entity选中高亮
 */
export function clearSelectedEntityHighlight(): void {
  if (selectedEntity) {
    restoreEntityOriginalState(selectedEntity)
    selectedEntity = null
  }
}

/**
 * 清除所有Entity高亮
 */
export function clearAllEntityHighlight(): void {
  clearHoveredEntityHighlight()
  clearSelectedEntityHighlight()
}

// 暴露实例供外部校验
export function getHoveredEntity(): Cesium.Entity | null {
  return hoveredEntity
}

export function getSelectedEntity(): Cesium.Entity | null {
  return selectedEntity
}
