//src/views/aviation-situation/composables/cesium-events/event-handlers/interaction/spatial-selection/polygonSpatialSelection.ts
import * as Cesium from 'cesium'
import type { EntityProperties } from '@/views/aviation-situation/types/entity'
import {
  highlightEntityOnHover,
  highlightEntityAndSetSelected
} from '@/views/aviation-situation/composables/useEntityHighlightManager.ts'
import { ShallowRef } from 'vue'
import type { MeasurementSelectedData,MeasurementEntitiesResult } from '@/views/aviation-situation/types/shared'
import {useMeasurementSelectionStore} from "@/stores/measurementSelection.ts"
const measurementSelectionStore=useMeasurementSelectionStore()
import {getMeasurementEntitiesAndHighlightEntity} from "@/utils/cesiumUtils"

export const handleSpatialSelectionHover = ( viewer:ShallowRef<Cesium.Viewer|null>,entity:Cesium.Entity,properties:EntityProperties) => {
  const dataSourceName:string=properties.dataSourceName
  if (
    measurementSelectionStore.drawingDataSource &&
    measurementSelectionStore.drawingDataSource.name === dataSourceName
  ) {
    return
  }
  let result:MeasurementEntitiesResult | undefined=undefined
  let highlightConfigColor:string=''
  if (properties.sourceType === 'distanceMeasurement') {
    result=getMeasurementEntitiesAndHighlightEntity(viewer, properties,2)
    highlightConfigColor='#A5F3FC'
  }
  if (properties.sourceType === 'polygonSpatialSelection') {
    result=getMeasurementEntitiesAndHighlightEntity(viewer, properties,1)
    highlightConfigColor='rgba(165, 243, 252, 0.25)'
  }else if(properties.sourceType === 'circleSpatialSelection'){
    result={
      highlightEntity:entity,
      measurementEntities:[entity]
    }
    highlightConfigColor='rgba(165, 243, 252, 0.25)'
  }
  if (!result) {
    return
  }
  highlightEntityOnHover(result.highlightEntity, {
    sourceType: properties.sourceType,
    value: Cesium.Color.fromCssColorString(highlightConfigColor)
  },result.measurementEntities)
}

export const handleSpatialSelectionLeftClick = ( viewer:ShallowRef<Cesium.Viewer|null>,entity:Cesium.Entity,properties:EntityProperties):void => {
  const dataSourceName:string=properties.dataSourceName
  if (
    measurementSelectionStore.drawingDataSource &&
    measurementSelectionStore.drawingDataSource.name === dataSourceName
  ) {
    return
  }
  let result:MeasurementEntitiesResult | undefined=undefined
  let highlightConfigColor:string=''
  if (properties.sourceType === 'distanceMeasurement') {
    result=getMeasurementEntitiesAndHighlightEntity(viewer, properties,2)
    highlightConfigColor='#06B6D4'
  }
  if (properties.sourceType === 'polygonSpatialSelection') {
    result=getMeasurementEntitiesAndHighlightEntity(viewer, properties,1)
    highlightConfigColor='rgba(6, 182, 212, 0.25)'
  }else if(properties.sourceType === 'circleSpatialSelection'){
    result={
      highlightEntity:entity,
      measurementEntities:[entity]
    }
    highlightConfigColor='rgba(6, 182, 212, 0.25)'
  }
  if (!result) {
    return
  }
  highlightEntityAndSetSelected(result.highlightEntity, {
    sourceType: properties.sourceType,
    value: Cesium.Color.fromCssColorString(highlightConfigColor)
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
