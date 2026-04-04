import { onUnmounted, ShallowRef, watch } from 'vue'
import * as Cesium from 'cesium'
import { onCesiumEvent } from '@/views/aviation-situation/composables/mittBus'
import { flyToLngLatAlt } from '@/utils/geoUtils'
import { EntityProperties } from '@/views/aviation-situation/types/entity'
import {
  SpatialSelectionTableRowOperation,
  SpatialSelectionTableRowDetail,
  SpatialSelectionTableRowDelete,
} from '@/views/aviation-situation/types/draw-tools'
import { handleSpatialSelectionLeftClick } from '@/views/aviation-situation/composables/cesium-events/event-handlers/interaction/spatial-selection'
import { emitCesiumEvent } from '@/views/aviation-situation/composables/mittBus'
import { useSpatialSelectStore } from '@/stores/spatialSelect'

export function useSpatialSelection(viewer: ShallowRef<Cesium.Viewer>) {
  const spatialSelectStore = useSpatialSelectStore()

  const initSpatialSelection = () => {
    subscribeSpatialSelectionEvents()
  }

  let unsubSpatialSelectionTableDetailClicked: () => void
  const subscribeSpatialSelectionEvents = () => {
    unsubSpatialSelectionTableDetailClicked = onCesiumEvent(
      'spatialSelectionTableOperationClicked',
      (spatialSelectionTableRowOperation: SpatialSelectionTableRowOperation) => {
        if (spatialSelectionTableRowOperation.operationType === 'detail') {
          const spatialSelectionTableRowDetail =
            spatialSelectionTableRowOperation as SpatialSelectionTableRowDetail
          let entity:Cesium.Entity|null=null
          let properties:EntityProperties|null=null
          const dataSourceName=spatialSelectionTableRowDetail.dataSourceName
          if (
            spatialSelectionTableRowDetail.sourceType === 'polygonSpatialSelection' ||
            spatialSelectionTableRowDetail.sourceType === 'distanceMeasurement'
          ) {
            const dataSource = viewer.value.dataSources.getByName(dataSourceName)[0]
            const values: Cesium.Entity[] = dataSource.entities.values
            entity = values[0]

          }else if(spatialSelectionTableRowDetail.sourceType === 'circleSpatialSelection'||
            spatialSelectionTableRowDetail.sourceType === 'hemisphereSpatialSelection') {
            entity=viewer.value.entities.getById(dataSourceName)
          }
          if (entity) {
            properties = entity.properties.getValue() as EntityProperties
            handleSpatialSelectionLeftClick(viewer, entity, properties)
            flyToLngLatAlt(viewer, spatialSelectionTableRowDetail.centroidLngLatAlt, 1000000)
          }
        } else if (spatialSelectionTableRowOperation.operationType === 'delete') {
          const spatialSelectionTableRowDelete =
            spatialSelectionTableRowOperation as SpatialSelectionTableRowDelete
          const dataSourceName = spatialSelectionTableRowDelete.dataSourceName
          spatialSelectStore.removeFinishedSelection(dataSourceName)
          console.log("spatialSelectionTableRowDelete", spatialSelectionTableRowDelete);
          if (
            spatialSelectionTableRowDelete.sourceType === 'polygonSpatialSelection' ||
            spatialSelectionTableRowDelete.sourceType === 'distanceMeasurement'
          ) {
            const dataSource = viewer.value.dataSources.getByName(dataSourceName)[0]
            viewer.value.dataSources.remove(dataSource, true)
          }else if(spatialSelectionTableRowDelete.sourceType === 'circleSpatialSelection'||
            spatialSelectionTableRowDelete.sourceType === 'hemisphereSpatialSelection') {
            viewer.value.entities.removeById(dataSourceName)
          }

          if (spatialSelectionTableRowDelete.sourceType != 'distanceMeasurement') {
            if (spatialSelectionTableRowDelete.spatialSelectionTarget === 'aircraft') {
              emitCesiumEvent('clearAircraftSpatialSelection', {
                isActive:false,
                dataSourceName,
                aircraft:{...spatialSelectionTableRowDelete.aircraft},
              })
            }else if (spatialSelectionTableRowDelete.spatialSelectionTarget === 'airport') {
              emitCesiumEvent('clearAirportSpatialSelection', {
                isActive:false,
                dataSourceName,
                airport:{...spatialSelectionTableRowDelete.airport},
              })
            }else if (spatialSelectionTableRowDelete.spatialSelectionTarget === 'all') {
              emitCesiumEvent('clearAircraftSpatialSelection', {
                isActive:false,
                dataSourceName,
                aircraft:{...spatialSelectionTableRowDelete.aircraft},
              })
              emitCesiumEvent('clearAirportSpatialSelection', {
                isActive:false,
                dataSourceName,
                airport:{...spatialSelectionTableRowDelete.airport},
              })
            }
          }

          ElMessage({
            message: '删除成功',
            type: 'success',
          })
        }
      },
    )
  }

  onUnmounted(() => {
    unsubSpatialSelectionTableDetailClicked()
  })

  return {
    initSpatialSelection,
  }
}
