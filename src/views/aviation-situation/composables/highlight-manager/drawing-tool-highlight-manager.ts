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
 * 核心工具：恢复Entity所有子组件的原始状态 + 整体显隐
 */
const restoreEntityOriginalState = (entity: Cesium.Entity) => {
  if (!entity.properties) return
  const props = entity.properties.getValue() as EntityProperties

  if(props.sourceType==='distanceMeasurement') {
    entity.polyline.material=props.polyline.originalMaterial
  }else if(props.sourceType==='polygonSpatialSelection') {
    entity.polygon.material=props.polygon.originalMaterial
    // entity.polygon.outline=props.polygon.originalOutline
    entity.polygon.outline=false
  } else if(props.sourceType==='circleSpatialSelection') {
    entity.ellipse.material=props.ellipse.originalMaterial
    entity.ellipse.outline=false
  } else if(props.sourceType==='hemisphereSpatialSelection') {
    // entity.ellipsoid.material=props.ellipsoid.originalMaterial
    entity.ellipsoid.outline=false
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
    entity.polygon.outline=true
  } else if(props.sourceType==='circleSpatialSelection') {
    entity.ellipse.material=config.value
    entity.ellipse.outline=true
  }else if(props.sourceType==='hemisphereSpatialSelection') {
    // entity.ellipsoid.material=config.value
    entity.ellipsoid.outline=true
  }

}

/**
 * Entity hover高亮：通用化支持多组件
 * @param entity 目标Entity
 * @param highlightConfig 高亮配置（支持多组件+显隐）
 */
export function highlightDrawingToolOnHover(
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
export function highlightDrawingToolOnSelect(
  entity: Cesium.Entity,
  highlightConfig: EntityHighlightConfig,
  entities:Cesium.Entity[]
): void {
  if (selected.entity === entity) return

  // 恢复上一个选中的Entity
  if (selected.entity) {
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
export function clearHoveredDrawingToolHighlight(): void {
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
export function clearSelectedDrawingToolHighlight(): void {
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
export function clearAllDrawingToolHighlight(): void {
  clearHoveredDrawingToolHighlight()
  clearSelectedDrawingToolHighlight()
}

// 暴露实例供外部校验
export function getHoveredEntity(): Cesium.Entity | null {
  return hovered.entity
}

export function getSelectedEntity(): Cesium.Entity | null {
  return selected.entity
}
