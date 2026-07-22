//src/views/aviation-situation/composables/cesium-events/event-handlers/interaction/distance-measurement.ts
import * as Cesium from 'cesium'
import type { DrawingToolEntityProperties } from '@/views/aviation-situation/types/entity'
import {
  highlightDrawingToolOnHover,
  highlightDrawingToolOnSelect
} from '@/views/aviation-situation/composables/highlight-manager/drawing-tool-highlight-manager.ts'
import { ShallowRef } from 'vue'
import type { DrawingToolSelectedData } from '@/views/aviation-situation/types/shared'
import { useDrawingToolStore } from '@/stores/drawing-tool.ts'
import { selectDrawingToolRegion } from '@/views/aviation-situation/composables/selection/useRegionSelectionActions'
import { getDrawingToolEntitiesAndHighlightEntity } from '@/utils/cesiumUtils'

const drawingToolStore = useDrawingToolStore()


export const handleDistanceSurveyHover = ( viewer:ShallowRef<Cesium.Viewer|null>,entity:Cesium.Entity,properties:DrawingToolEntityProperties) => {
  const dataSourceName:string=properties.dataSourceName
  if (
    drawingToolStore.drawingDataSource &&
    drawingToolStore.drawingDataSource.name === dataSourceName
  ) {
    return
  }
  const result:DrawingToolEntitiesResult | undefined =getDrawingToolEntitiesAndHighlightEntity(viewer, properties,2)
  highlightDrawingToolOnHover(result.highlightEntity, {
    components: [
      { type: 'polyline', prop: 'material', value: Cesium.Color.fromCssColorString('#A5F3FC') }
    ]
  },result.measurementEntities)
}

// 处理机场左键点击
export const handleDistanceSurveyLeftClick = ( viewer:ShallowRef<Cesium.Viewer|null>,entity:Cesium.Entity,properties:DrawingToolEntityProperties):void => {
  const dataSourceName:string=properties.dataSourceName
  if (
    drawingToolStore.drawingDataSource &&
    drawingToolStore.drawingDataSource.name === dataSourceName
  ) {
    return
  }
  const result:DrawingToolEntitiesResult | undefined =getDrawingToolEntitiesAndHighlightEntity(viewer, properties,2)
  highlightDrawingToolOnSelect(result.highlightEntity, {
    components: [
      { type: 'polyline', prop: 'material', value: Cesium.Color.fromCssColorString('#06B6D4') }
    ]
  },result.measurementEntities)
  const selected: DrawingToolSelectedData = {
    id: entity.id,
    type: properties.type,
    sourceType: properties.sourceType,
    operationType: properties.operationType,
    dataSourceName: properties.dataSourceName,
    isDraft: properties.isDraft,
  }
  selectDrawingToolRegion(selected)
}
