import { onUnmounted, ShallowRef, watch } from 'vue'
import * as Cesium from "cesium"
import { onCesiumEvent } from '@/views/aviation-situation/composables/mittBus'
import type { LngLatAlt } from '@/views/aviation-situation/types/shared'
import { flyToLngLatAlt } from '@/utils/geoUtils'
import {
  SpatialSelectionTableRowOperation,
  SpatialSelectionTableRowDetail,
  SpatialSelectionTableRowDelete,
} from '@/views/aviation-situation/types/spatial-selection'

export function useSpatialSelection(viewer:ShallowRef<Cesium.Viewer>) {
  const initSpatialSelection=()=>{
    subscribeSpatialSelectionEvents()
  }

  let unsubSpatialSelectionTableDetailClicked:()=>void
  const subscribeSpatialSelectionEvents = () => {
    unsubSpatialSelectionTableDetailClicked = onCesiumEvent('spatialSelectionTableOperationClicked', (spatialSelectionTableRowOperation:SpatialSelectionTableRowOperation) => {
      if (spatialSelectionTableRowOperation.type === 'detail') {
        const spatialSelectionTableRowDetail= spatialSelectionTableRowOperation as SpatialSelectionTableRowDetail
        flyToLngLatAlt(viewer,spatialSelectionTableRowDetail.centroidLngLatAlt,1000000)
      }if (spatialSelectionTableRowOperation.type === 'delete') {
        const spatialSelectionTableRowDelete= spatialSelectionTableRowOperation as SpatialSelectionTableRowDelete

        if (spatialSelectionTableRowDelete.sourceType === 'polygonSpatialSelection') {
          const dataSourceName=spatialSelectionTableRowDelete.dataSourceName
          const dataSource=viewer.value.dataSources.getByName(dataSourceName)[0]
          viewer.value.dataSources.remove(dataSource,true)
          ElMessage({
            message: '删除成功',
            type: 'success',
          })
        }
      }
    });
  }

  onUnmounted(() => {
    unsubSpatialSelectionTableDetailClicked()
  })

  return{
    initSpatialSelection
  }
}
