//src/views/aviation-situation/composables/cesium-events/event-handlers/distanceSurvey-interaction.ts
import * as Cesium from 'cesium'
import type { EntityProperties } from '@/views/aviation-situation/types/entity'
import {
  highlightEntityOnHover,
  clearHoveredEntityHighlight,
  highlightEntityAndSetSelected
} from '@/views/aviation-situation/composables/useEntityHighlightManager.ts'
import { ShallowRef } from 'vue'
// 处理机场 hover
let showEntities:Cesium.Entity[]=[]

/**
 * 显示距离测量相关的实体（测量点和分段长度标签）
 * @param viewer Cesium Viewer 实例
 * @param properties 实体属性
 * @returns 显示的实体数组
 */
const showDistanceSurveyEntities = (
  viewer: ShallowRef<Cesium.Viewer | null>,
  properties: EntityProperties
): Cesium.Entity[] => {
  // 重置显示的实体数组
  showEntities = []

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
    const entityProperties = values[i].properties.getValue() as EntityProperties

    // 根据实体类型显示对应的组件
    if (entityProperties.type === 'surveyPoint') {
      values[i].label.show = true
      values[i].point.show = true
    } else if (entityProperties.type === 'segmentLengthLabel') {
      values[i].label.show = true
    }

    // 存储显示的实体（调整索引从0开始）
    showEntities[i - 2] = values[i]
  }

  return showEntities
}

export const handleDistanceSurveyHover = ( viewer:ShallowRef<Cesium.Viewer|null>,entity:Cesium.Entity,properties:EntityProperties) => {
  showDistanceSurveyEntities(viewer, properties)

  highlightEntityOnHover(entity, {
    components: [
      { type: 'polyline', prop: 'material', value: Cesium.Color.fromCssColorString('#A5F3FC') }
    ]
  })
}

export const handleDistanceSurveyLeave = ():void => {
  clearHoveredEntityHighlight()
  for (let i:number = 0; i < showEntities.length; i++) {
    // showEntities[i].show=false

    const properties = showEntities[i].properties.getValue() as EntityProperties
    if (properties.type === 'surveyPoint') {
      showEntities[i].label.show=false
      showEntities[i].point.show=false
    }else if(properties.type === 'segmentLengthLabel') {
      showEntities[i].label.show=false
    }
  }
}
// 处理机场左键点击
export const handleDistanceSurveyLeftClick = ( viewer:ShallowRef<Cesium.Viewer|null>,entity:Cesium.Entity,properties:EntityProperties):void => {
  showDistanceSurveyEntities(viewer, properties)

  highlightEntityAndSetSelected(entity, {
    components: [
      { type: 'polyline', prop: 'material', value: Cesium.Color.fromCssColorString('#06B6D4') }
    ]
  })
}
