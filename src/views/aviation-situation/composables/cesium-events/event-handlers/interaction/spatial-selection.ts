import * as Cesium from 'cesium'
import type { EntityProperties } from '@/views/aviation-situation/types/entity'
import {
  highlightEntityOnHover,
  highlightEntityAndSetSelected
} from '@/views/aviation-situation/composables/highlight-manager/drawing-tool-highlight-manager.ts'
import { ShallowRef } from 'vue'
import type { DrawingToolSelectedData, DrawingToolEntitiesResult } from '@/views/aviation-situation/types/shared'
import { useDrawingToolStore } from "@/stores/drawing-tool.ts"
import { getDrawingToolEntitiesAndHighlightEntity } from "@/utils/cesiumUtils"

const drawingToolStore = useDrawingToolStore()

// ---- 颜色配置表 ----
const HOVER_COLORS: Partial<Record<string, string>> = {
  distanceMeasurement:      '#A5F3FC',
  polygonSpatialSelection:  'rgba(165, 243, 252, 0.25)',
  circleSpatialSelection:   'rgba(165, 243, 252, 0.25)',
  hemisphereSpatialSelection:   'rgba(165, 243, 252, 0.25)',
  // hemisphereSpatialSelection:   'rgba(135, 206, 235, 0.25)',

}
const CLICK_COLORS: Partial<Record<string, string>> = {
  distanceMeasurement:      '#06B6D4',
  polygonSpatialSelection:  'rgba(6, 182, 212, 0.25)',
  circleSpatialSelection:   'rgba(6, 182, 212, 0.25)',
  hemisphereSpatialSelection:   'rgba(165, 243, 252, 0.25)',
  // hemisphereSpatialSelection:   'rgba(135, 206, 235, 0.25)',
}

// ---- 公共：解析实体结果 ----
function resolveSelectionResult(
  viewer: ShallowRef<Cesium.Viewer | null>,
  entity: Cesium.Entity,
  properties: EntityProperties,
): DrawingToolEntitiesResult | undefined {
  const { sourceType } = properties
  if (sourceType === 'distanceMeasurement') {
    return getDrawingToolEntitiesAndHighlightEntity(viewer, properties, 2)
  }
  if (sourceType === 'polygonSpatialSelection') {
    return getDrawingToolEntitiesAndHighlightEntity(viewer, properties, 1)
  }
  if (sourceType === 'circleSpatialSelection'||sourceType === 'hemisphereSpatialSelection') {
    return { highlightEntity: entity, measurementEntities: [entity] }
  }
  return undefined
}

// ---- 公共：绘制中则跳过 ----
function isDrawing(dataSourceName: string): boolean {
  return (
    !!drawingToolStore.drawingDataSource &&
    drawingToolStore.drawingDataSource.name === dataSourceName
  )
}

// ---- Hover ----
export const handleSpatialSelectionHover = (
  viewer: ShallowRef<Cesium.Viewer | null>,
  entity: Cesium.Entity,
  properties: EntityProperties,
): void => {
  if (isDrawing(properties.dataSourceName)) return
  const result = resolveSelectionResult(viewer, entity, properties)
  const color = HOVER_COLORS[properties.sourceType]
  if (!result || !color) return
  highlightEntityOnHover(
    result.highlightEntity,
    { sourceType: properties.sourceType, value: Cesium.Color.fromCssColorString(color) },
    result.measurementEntities,
  )
}

// ---- Left Click ----
export const handleSpatialSelectionLeftClick = (
  viewer: ShallowRef<Cesium.Viewer | null>,
  entity: Cesium.Entity,
  properties: EntityProperties,
): void => {
  if (isDrawing(properties.dataSourceName)) return

  const result = resolveSelectionResult(viewer, entity, properties)
  const color = CLICK_COLORS[properties.sourceType]
  if (!result || !color) return

  highlightEntityAndSetSelected(
    result.highlightEntity,
    { sourceType: properties.sourceType, value: Cesium.Color.fromCssColorString(color) },
    result.measurementEntities,
  )

  const selected: DrawingToolSelectedData = {
    id:              entity.id,
    type:            properties.type,
    sourceType:      properties.sourceType,
    operationType:   properties.operationType,
    dataSourceName:  properties.dataSourceName,
    isDraft:  properties.isDraft,
  }
  drawingToolStore.setSelected(selected)
}
