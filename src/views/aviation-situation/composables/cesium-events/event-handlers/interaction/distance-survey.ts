//src/views/aviation-situation/composables/cesium-events/event-handlers/interaction/distanceMeasurement.ts
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

import {getMeasurementEntitiesAndHighlightEntity} from "@/utils/cesiumUtils"


export const handleDistanceSurveyHover = ( viewer:ShallowRef<Cesium.Viewer|null>,entity:Cesium.Entity,properties:EntityProperties) => {
  const dataSourceName:string=properties.dataSourceName
  if (
    measurementSelectionStore.drawingDataSource &&
    measurementSelectionStore.drawingDataSource.name === dataSourceName
  ) {
    return
  }
  const result:MeasurementEntitiesResult | undefined =getMeasurementEntitiesAndHighlightEntity(viewer, properties,2)
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
    measurementSelectionStore.drawingDataSource &&
    measurementSelectionStore.drawingDataSource.name === dataSourceName
  ) {
    return
  }
  const result:MeasurementEntitiesResult | undefined =getMeasurementEntitiesAndHighlightEntity(viewer, properties,2)
  highlightEntityAndSetSelected(result.highlightEntity, {
    components: [
      { type: 'polyline', prop: 'material', value: Cesium.Color.fromCssColorString('#06B6D4') }
    ]
  },result.measurementEntities)
  const selected:MeasurementSelectedData={
    id:entity.id,
    type:properties.type,
    sourceType:properties.sourceType,
    operationType:properties.operationType,
    dataSourceName:properties.dataSourceName,
  }
  measurementSelectionStore.setSelected(selected)
}
