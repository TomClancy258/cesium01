import * as Cesium from 'cesium'
import type { EntityProperties, EntityHighlightConfig } from '@/views/aviation-situation/types/entity'
import type { SatelliteHighlightConfig } from '@/views/aviation-situation/types/satellite'
import { useAviationSelectionStore } from '@/stores/aviation-selection'

// 仅存储Entity实例（模块单例，非响应式）
let hoveredSatellite:Cesium.Entity=null
let selectedSatellite:Cesium.Entity=null

/**
 * 核心工具：恢复Entity所有子组件的原始状态 + 整体显隐
 */
const restoreEntityOriginalState = (entity: Cesium.Entity) => {
  if (!entity.properties) return
  const props = entity.properties.getValue() as EntityProperties

  if(props.sourceType==='satellite') {
    entity.model.silhouetteColor = props.model.silhouetteColor
    entity.model.silhouetteSize = props.model.silhouetteSize
  }
}

/**
 * 核心工具：设置Entity子组件的高亮样式
 */
const setEntityHighlightStyle = (entity: Cesium.Entity, config: SatelliteHighlightConfig) => {
  if (!entity.properties) return
  const props = entity.properties.getValue() as EntityProperties
  if(props.sourceType==='satellite') {
    entity.model.silhouetteColor=config.modelStyle.silhouetteColor
    entity.model.silhouetteSize =config.modelStyle.silhouetteSize
  }

}

/**
 * Entity hover高亮：通用化支持多组件
 * @param entity 目标Entity
 * @param highlightConfig 高亮配置（支持多组件+显隐）
 */
export function highlightSatelliteOnHover(
  entity: Cesium.Entity,
  highlightConfig:SatelliteHighlightConfig
): void {
  // 如果当前有选中的 Billboard，hover 不生效（选中优先级更高）
  if (selectedSatellite === entity) return

  if (hoveredSatellite === entity) return

  // 还原上一个 hover 项
  if (hoveredSatellite) {
    // 若上一个 hover 项未被选中，才恢复默认
    if (hoveredSatellite !== selectedSatellite) {
      restoreEntityOriginalState(hoveredSatellite)
    }
  }

  // 设置新hover高亮
  hoveredSatellite = entity
  setEntityHighlightStyle(entity, highlightConfig)

  // const aviationSelectionStore = useAviationSelectionStore()
  // aviationSelectionStore.setHovered(hoverData)
}

/**
 * Entity选中高亮：通用化支持多组件
 */
export function highlightSatelliteAndSetSelected(
  entity: Cesium.Entity,
  highlightConfig: EntityHighlightConfig,
): void {
  // 恢复上一个选中的Entity
  if (selectedSatellite && selectedSatellite !== entity) {
    restoreEntityOriginalState(selectedSatellite)
  }

  // 清除当前hover
  if (hoveredSatellite === entity) {
    hoveredSatellite = null
  }

  // 设置选中高亮
  selectedSatellite = entity
  setEntityHighlightStyle(entity, highlightConfig)
}

/**
 * 清除Entity hover高亮
 */
export function clearHoveredSatelliteHighlight(): void {
  if (hoveredSatellite && hoveredSatellite !== selectedSatellite) {
    restoreEntityOriginalState(hoveredSatellite)
    hoveredSatellite = null
  }
}

/**
 * 清除Entity选中高亮
 */
export function clearSelectedSatelliteHighlight(): void {
  if (selectedSatellite) {
    restoreEntityOriginalState(selectedSatellite)
    selectedSatellite = null
  }
}

/**
 * 清除所有Entity高亮
 */
export function clearAllEntityHighlight(): void {
  clearHoveredSatelliteHighlight()
  clearSelectedSatelliteHighlight()
}

// 暴露实例供外部校验
export function getHoveredEntity(): Cesium.Entity | null {
  return hoveredSatellite
}

export function getSelectedEntity(): Cesium.Entity | null {
  return selectedSatellite
}
