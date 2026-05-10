//src/views/aviation-situation/composables/cesium-events/event-handlers/interaction/distance-measurement.ts
import * as Cesium from 'cesium'
import type { EntityProperties } from '@/views/aviation-situation/types/entity'
import {
  highlightEntityOnHover,
  highlightEntityAndSetSelected
} from '@/views/aviation-situation/composables/highlight-manager/drawing-tool-highlight-manager.ts'
import { ShallowRef } from 'vue'
import type { DrawingToolSelectedData } from '@/views/aviation-situation/types/shared'
import {useDrawingToolStore} from "@/stores/drawing-tool.ts"
const drawingToolStore=useDrawingToolStore()

import {getDrawingToolEntitiesAndHighlightEntity} from "@/utils/cesiumUtils"


export const handleDistanceSurveyHover = ( viewer:ShallowRef<Cesium.Viewer|null>,entity:Cesium.Entity,properties:EntityProperties) => {
  const dataSourceName:string=properties.dataSourceName
  if (
    drawingToolStore.drawingDataSource &&
    drawingToolStore.drawingDataSource.name === dataSourceName
  ) {
    return
  }
  const result:DrawingToolEntitiesResult | undefined =getDrawingToolEntitiesAndHighlightEntity(viewer, properties,2)
  highlightEntityOnHover(result.highlightEntity, {
    components: [
      { type: 'polyline', prop: 'material', value: Cesium.Color.fromCssColorString('#A5F3FC') }
    ]
  },result.measurementEntities)
}

// 处理机场左键点击
export const handleDistanceSurveyLeftClick = ( viewer:ShallowRef<Cesium.Viewer|null>,entity:Cesium.Entity,properties:EntityProperties):void => {
  const dataSourceName:string=properties.dataSourceName
  if (
    drawingToolStore.drawingDataSource &&
    drawingToolStore.drawingDataSource.name === dataSourceName
  ) {
    return
  }
  const result:DrawingToolEntitiesResult | undefined =getDrawingToolEntitiesAndHighlightEntity(viewer, properties,2)
  highlightEntityAndSetSelected(result.highlightEntity, {
    components: [
      { type: 'polyline', prop: 'material', value: Cesium.Color.fromCssColorString('#06B6D4') }
    ]
  },result.measurementEntities)
  const selected:DrawingToolSelectedData={
    id:entity.id,
    type:properties.type,
    sourceType:properties.sourceType,
    operationType:properties.operationType,
    dataSourceName:properties.dataSourceName,
    isDraft:  properties.isDraft,
  }
  drawingToolStore.setSelected(selected)
}
