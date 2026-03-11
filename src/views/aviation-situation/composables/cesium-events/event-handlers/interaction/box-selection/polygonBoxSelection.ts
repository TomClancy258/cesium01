//src/views/aviation-situation/composables/cesium-events/event-handlers/interaction/box-selection/polygonBoxSelection.ts
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

export const handlePolygonBoxSelectionHover = ( viewer:ShallowRef<Cesium.Viewer|null>,entity:Cesium.Entity,properties:EntityProperties) => {
  const {showEntities,highlightEntity}=getShowEntitiesAndHighlightEntity(viewer, properties,1)

  highlightEntityOnHover(highlightEntity, {
    components: [
      { type: 'polygon', prop: 'material', value: Cesium.Color.fromCssColorString('rgba(165, 243, 252, 0.25)') }
    ]
  },showEntities)
}

export const handlePolygonBoxSelectionLeftClick = ( viewer:ShallowRef<Cesium.Viewer|null>,entity:Cesium.Entity,properties:EntityProperties):void => {
  const {showEntities,highlightEntity}=getShowEntitiesAndHighlightEntity(viewer, properties,1)
  highlightEntityAndSetSelected(highlightEntity, {
    components: [
      { type: 'polygon', prop: 'material', value: Cesium.Color.fromCssColorString('rgba(6, 182, 212, 0.25)') }
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
