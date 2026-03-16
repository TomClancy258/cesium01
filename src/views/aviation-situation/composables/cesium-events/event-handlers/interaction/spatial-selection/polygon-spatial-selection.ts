//src/views/aviation-situation/composables/cesium-events/event-handlers/interaction/spatial-selection/polygonSpatialSelection.ts
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

export const handlePolygonSpatialSelectionHover = ( viewer:ShallowRef<Cesium.Viewer|null>,entity:Cesium.Entity,properties:EntityProperties) => {
  const dataSourceName:string=properties.dataSourceName
  if (
    measurementSelectionStore.drawingDataSource &&
    measurementSelectionStore.drawingDataSource.name === dataSourceName
  ) {
    return
  }
  const result:MeasurementEntitiesResult | undefined=getMeasurementEntitiesAndHighlightEntity(viewer, properties,1)
  highlightEntityOnHover(result.highlightEntity, {
    components: [
      { type: 'polygon', prop: 'material', value: Cesium.Color.fromCssColorString('rgba(165, 243, 252, 0.25)') }
    ]
  },result.measurementEntities)
}

export const handlePolygonSpatialSelectionLeftClick = ( viewer:ShallowRef<Cesium.Viewer|null>,entity:Cesium.Entity,properties:EntityProperties):void => {
  const dataSourceName:string=properties.dataSourceName
  if (
    measurementSelectionStore.drawingDataSource &&
    measurementSelectionStore.drawingDataSource.name === dataSourceName
  ) {
    return
  }
  const result:MeasurementEntitiesResult | undefined=getMeasurementEntitiesAndHighlightEntity(viewer, properties,1)
  highlightEntityAndSetSelected(result.highlightEntity, {
    components: [
      { type: 'polygon', prop: 'material', value: Cesium.Color.fromCssColorString('rgba(6, 182, 212, 0.25)') }
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
