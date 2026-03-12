//src/views/aviation-situation/composables/cesium-events/event-handlers/distanceSurvey-interaction.ts
import * as Cesium from 'cesium'
import type { EntityProperties } from '@/views/aviation-situation/types/entity'
import {
  highlightEntityOnHover,
  highlightEntityAndSetSelected
} from '@/views/aviation-situation/composables/useEntityHighlightManager.ts'
import { ShallowRef } from 'vue'
import type { MeasurementSelectedData } from '@/views/aviation-situation/types/shared'
import {useMeasurementSelectionStore} from "@/stores/measurementSelection.ts"
const measurementSelectionStore=useMeasurementSelectionStore()

import {getShowEntitiesAndHighlightEntity} from "@/utils/cesiumUtils"


export const handleDistanceSurveyHover = ( viewer:ShallowRef<Cesium.Viewer|null>,entity:Cesium.Entity,properties:EntityProperties) => {
  const {showEntities,highlightEntity,dataSourceName}=getShowEntitiesAndHighlightEntity(viewer, properties,2)
  if (
    measurementSelectionStore.drawingDataSource &&
    measurementSelectionStore.drawingDataSource.name === dataSourceName
  ) {
    return
  }
  highlightEntityOnHover(highlightEntity, {
    components: [
      { type: 'polyline', prop: 'material', value: Cesium.Color.fromCssColorString('#A5F3FC') }
    ]
  },showEntities)
}

// 处理机场左键点击
export const handleDistanceSurveyLeftClick = ( viewer:ShallowRef<Cesium.Viewer|null>,entity:Cesium.Entity,properties:EntityProperties):void => {
  const {showEntities,highlightEntity,dataSourceName}=getShowEntitiesAndHighlightEntity(viewer, properties,2)
  if (
    measurementSelectionStore.drawingDataSource &&
    measurementSelectionStore.drawingDataSource.name === dataSourceName
  ) {
    return
  }
  highlightEntityAndSetSelected(highlightEntity, {
    components: [
      { type: 'polyline', prop: 'material', value: Cesium.Color.fromCssColorString('#06B6D4') }
    ]
  },showEntities)
  const selected:MeasurementSelectedData={
    id:entity.id,
    type:properties.type,
    sourceType:properties.sourceType,
    operationType:properties.operationType,
    dataSourceName:properties.dataSourceName,
  }
  measurementSelectionStore.setSelected(selected)
}
