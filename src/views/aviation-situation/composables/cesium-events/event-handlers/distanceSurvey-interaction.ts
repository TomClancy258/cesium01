//src/views/aviation-situation/composables/cesium-events/event-handlers/distanceSurvey-interaction.ts
import * as Cesium from 'cesium'
import type { EntityProperties } from '@/views/aviation-situation/types/entity'
import {
  highlightEntityOnHover,
  clearHoveredEntityHighlight,
  highlightEntityAndSetSelected, clearSelectedEntityHighlight
} from '@/views/aviation-situation/composables/useEntityHighlightManager.ts'
import { ShallowRef } from 'vue'
import type { MeasurementSelectedData } from '@/views/aviation-situation/types/shared'
import {useMeasurementSelectionStore} from "@/stores/measurementSelection.ts"
const measurementSelectionStore=useMeasurementSelectionStore()

/**
 * 显示距离测量相关的实体（测量点和分段长度标签）
 * @param viewer Cesium Viewer 实例
 * @param properties 实体属性
 * @returns 显示的实体数组
 */
const getShowEntities = (
  viewer: ShallowRef<Cesium.Viewer | null>,
  properties: EntityProperties,
): Cesium.Entity[] => {
  // 重置显示的实体数组
  const showEntities:Cesium.Entity[]=[]

  if (!viewer.value) return showEntities

  const dataSourceName: string = properties.dataSourceName
  const dataSources: Cesium.CustomDataSource[] = viewer.value.dataSources.getByName(dataSourceName)

  if (dataSources.length === 0) {
    return showEntities
  }

  const dataSource: Cesium.CustomDataSource = dataSources[0]
  const values: Cesium.Entity[] = dataSource.entities.values

  // 从第3个实体开始遍历（索引2），显示测量相关元素
  for (let i: number = 2; i < values.length; i++) {
    // 存储显示的实体（调整索引从0开始）
    showEntities[i - 2] = values[i]

    // const entityProperties = values[i].properties.getValue() as EntityProperties
    // 根据实体类型显示对应的组件
    // if (entityProperties.type === 'surveyPoint') {
    //   values[i].label.show = true
    //   values[i].point.show = true
    // } else if (entityProperties.type === 'segmentLengthLabel') {
    //   values[i].label.show = true
    // }
  }

  return showEntities
}

export const handleDistanceSurveyHover = ( viewer:ShallowRef<Cesium.Viewer|null>,entity:Cesium.Entity,properties:EntityProperties) => {
  const showEntities:Cesium.Entity[]=getShowEntities(viewer, properties)

  highlightEntityOnHover(entity, {
    components: [
      { type: 'polyline', prop: 'material', value: Cesium.Color.fromCssColorString('#A5F3FC') }
    ]
  },showEntities)
}

// 处理机场左键点击
export const handleDistanceSurveyLeftClick = ( viewer:ShallowRef<Cesium.Viewer|null>,entity:Cesium.Entity,properties:EntityProperties):void => {
  const showEntities:Cesium.Entity[]=getShowEntities(viewer, properties)
  highlightEntityAndSetSelected(entity, {
    components: [
      { type: 'polyline', prop: 'material', value: Cesium.Color.fromCssColorString('#06B6D4') }
    ]
  },showEntities)
  const selected:MeasurementSelectedData={
    id:entity.id,
    type:properties.type,
    sourceType:properties.sourceType,
  }
  measurementSelectionStore.setSelected(selected)
}
