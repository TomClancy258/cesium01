import * as Cesium from 'cesium'
import type { EntityProperties, EntityHighlightConfig, EntityComponent } from '@/views/aviation-situation/types/entity'
import {showEntities,hideEntities} from "@/utils/cesiumUtils"

interface EntityHighlightData{
  entity:Cesium.Entity|null,
  measurementEntities: Cesium.Entity[],
}

// 仅存储Entity实例（模块单例，非响应式）
const hovered:EntityHighlightData={
  entity: null,
  measurementEntities:[]
}
const selected:EntityHighlightData={
  entity: null,
  measurementEntities:[]
}

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

  if(props.sourceType==='distanceMeasurement') {
    entity.polyline.material=props.polyline.originalMaterial
  }else if(props.sourceType==='polygonSpatialSelection') {
    entity.polygon.material=props.polygon.originalMaterial
  } else if(props.sourceType==='circleSpatialSelection') {
    entity.ellipse.material=props.ellipse.originalMaterial
  }
}

/**
 * 核心工具：设置Entity子组件的高亮样式
 */
const setEntityHighlightStyle = (entity: Cesium.Entity, config: EntityHighlightConfig) => {
  if (!entity.properties) return
  const props = entity.properties.getValue() as EntityProperties

  // 1. 设置整体显隐
  // if (config.show !== undefined) {
  //   // 首次设置时保存原始显隐状态
  //   if (props.originalShow === undefined) {
  //     props.originalShow = entity.show
  //   }
  //   entity.show = config.show
  // }
  if(props.sourceType==='distanceMeasurement') {
    entity.polyline.material=config.value
  }else if(props.sourceType==='polygonSpatialSelection') {
    entity.polygon.material=config.value
  } else if(props.sourceType==='circleSpatialSelection') {
    entity.ellipse.material=config.value
  }

}

/**
 * Entity hover高亮：通用化支持多组件
 * @param entity 目标Entity
 * @param highlightConfig 高亮配置（支持多组件+显隐）
 */
export function highlightEntityOnHover(
  entity: Cesium.Entity,
  highlightConfig: EntityHighlightConfig,
  entities:Cesium.Entity[]
): void {
  // 如果当前有选中的 Billboard，hover 不生效（选中优先级更高）
  if (selected.entity === entity) return

  if (hovered.entity === entity) return

  // 还原上一个 hover 项
  if (hovered.entity) {
    // 若上一个 hover 项未被选中，才恢复默认
    if (hovered.entity !== selected.entity) {
      restoreEntityOriginalState(hovered.entity)
      hideEntities(hovered.measurementEntities)
    }
  }

  // 设置新hover高亮
  hovered.entity = entity
  setEntityHighlightStyle(entity, highlightConfig)
  hovered.measurementEntities=entities
  showEntities(hovered.measurementEntities)
}

/**
 * Entity选中高亮：通用化支持多组件
 */
export function highlightEntityAndSetSelected(
  entity: Cesium.Entity,
  highlightConfig: EntityHighlightConfig,
  entities:Cesium.Entity[]
): void {
  // 恢复上一个选中的Entity
  if (selected.entity && selected.entity !== entity) {
    restoreEntityOriginalState(selected.entity)
    hideEntities(selected.measurementEntities)
  }

  // 清除当前hover
  if (hovered.entity === entity) {
    hovered.entity = null
    hovered.measurementEntities=[]
  }

  // 设置选中高亮
  selected.entity = entity
  setEntityHighlightStyle(entity, highlightConfig)

  selected.measurementEntities=entities
  showEntities(selected.measurementEntities)
}

/**
 * 清除Entity hover高亮
 */
export function clearHoveredEntityHighlight(): void {
  if (hovered.entity && hovered.entity !== selected.entity) {
    restoreEntityOriginalState(hovered.entity)
    hovered.entity = null
    hideEntities(hovered.measurementEntities)
    hovered.measurementEntities=[]
  }
}

/**
 * 清除Entity选中高亮
 */
export function clearSelectedEntityHighlight(): void {
  if (selected.entity) {
    restoreEntityOriginalState(selected.entity)
    selected.entity = null

    hideEntities(selected.measurementEntities)
    selected.measurementEntities=[]
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
  return hovered.entity
}

export function getSelectedEntity(): Cesium.Entity | null {
  return selected.entity
}
