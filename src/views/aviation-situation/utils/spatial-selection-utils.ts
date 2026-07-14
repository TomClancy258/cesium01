import { useSpatialSelectionStore } from '@/stores/spatial-selection'
import { ShallowRef } from 'vue'
import * as Cesium from 'cesium'

import {
  TooltipState,
  SelectionRegionBase,
  FinishedSpatialSelectionData,
} from '@/views/aviation-situation/types/shared'
import * as turf from '@turf/turf'
import { isInCircle, isInsideHemisphere } from '@/utils/geoUtils'

/** 更新各 finished 选区的 label 文字（飞机数量部分） */
export const updateFinishedSelectionLabels = (viewer: ShallowRef<Cesium.Viewer>) => {
  const spatialSelectionStore = useSpatialSelectionStore()

  for (const [dataSourceName, selectionRegion] of spatialSelectionStore.finishedGraphicMap) {
    if (selectionRegion.sourceType === 'polygonSpatialSelection'){
      const dataSources = viewer.value.dataSources.getByName(dataSourceName)
      if (!dataSources.length) continue

      const values = dataSources[0].entities.values
      const metricsLabelEntity = values[1]
      const props: EntityProperties = metricsLabelEntity.properties.getValue()

      const base = `周长：${props.label.perimeterInfo.formattedPerimeterStr}\n面积：${props.label.areaInfo.formattedAreaStr}`

      const target = selectionRegion.spatialSelectionTarget
      if (target === 'aircraft') {
        metricsLabelEntity.label.text = `飞机：${selectionRegion.aircraft.aircraftMap.size} 架\n${base}`
      } else if (target === 'all') {
        metricsLabelEntity.label.text = `飞机：${selectionRegion.aircraft.aircraftMap.size} 架\n机场：${selectionRegion.airport.airportMap.size} 个\n${base}`
      }
    }else if(selectionRegion.sourceType === 'circleSpatialSelection'||
      selectionRegion.sourceType === 'hemisphereSpatialSelection'){
      const entity = viewer.value.entities.getById(dataSourceName)
      const props: EntityProperties = entity.properties.getValue()
      const base = `周长：${props.label.perimeterInfo.formattedPerimeterStr}\n面积：${props.label.areaInfo.formattedAreaStr}\n半径：${props.label.radiusInfo.formattedRadiusStr}`

      const target = selectionRegion.spatialSelectionTarget
      if (target === 'aircraft') {
        entity.label.text = `飞机：${selectionRegion.aircraft.aircraftMap.size} 架\n${base}`
      } else if (target === 'all') {
        entity.label.text = `飞机：${selectionRegion.aircraft.aircraftMap.size} 架\n机场：${selectionRegion.airport.airportMap.size} 个\n${base}`
      }
    }
  }
}

export function updateTooltip<T>(
  tooltip: TooltipState<T>,
  screenPosition: Cesium.Cartesian2,
  properties: T
): void {
  tooltip.position.left = screenPosition.x + 10
  tooltip.position.top = screenPosition.y + 50
  tooltip.properties = { ...properties }
  tooltip.visible = true
}

export function isPointInSelectionRegion(
  lngLat: [number, number],
  selectionRegion: SelectionRegionBase,
  bbox?: turf.BBox,
): boolean {
  const {
    sourceType,
    graphic,
    centerLngLatAltArray,
  } = selectionRegion

  if (sourceType === 'polygonSpatialSelection') {
    const regionBbox = bbox ?? selectionRegion.bbox
    if (!regionBbox) return false
    if (lngLat[0] < regionBbox[0] || lngLat[0] > regionBbox[2] ||
      lngLat[1] < regionBbox[1] || lngLat[1] > regionBbox[3]) return false
    return turf.booleanPointInPolygon(turf.point(lngLat), graphic)
  }
  if (sourceType === 'circleSpatialSelection') {
    const radius = selectionRegion.label.radiusInfo.radius
    return isInCircle(lngLat, centerLngLatAltArray, radius)
  }
  if (sourceType === 'hemisphereSpatialSelection') {
    const radius = selectionRegion.label.radiusInfo.radius
    return isInsideHemisphere(lngLat, centerLngLatAltArray, radius)
  }
  return false
}

// 从 FinishedSpatialSelectionData 构建 SelectionRegionBase（避免直接持有原始对象引用）
export function buildRegionFromData(data: FinishedSpatialSelectionData): SelectionRegionBase {
  // 公共字段（三种 variant 都有）
  const base = {
    dataSourceName: data.dataSourceName,
    type: data.type,
    sourceType: data.sourceType,
    centroidLngLatAlt: data.centroidLngLatAlt,
    aircraft: { aircraftMap: new Map(data.aircraft.aircraftMap) },
    airport: { airportMap: new Map(data.airport.airportMap) },
    spatialSelectionTarget: data.spatialSelectionTarget,
  }

  // early return 使 TS 在每个分支内完成判别式窄化，无需任何 as 断言
  if (data.sourceType === 'polygonSpatialSelection') {
    return {
      ...base,
      graphic: data.graphic,
      bbox: turf.bbox(data.graphic),
      label: {
        perimeterInfo: { ...data.label.perimeterInfo },
        areaInfo: { ...data.label.areaInfo },
      },
      polygonState: { ...data.polygonState },
      segments: [...data.segments],
    }
  }

  // circleSpatialSelection | hemisphereSpatialSelection
  return {
    ...base,
    centerLngLatAltArray: [...data.centerLngLatAltArray],
    label: {
      perimeterInfo: { ...data.label.perimeterInfo },
      areaInfo: { ...data.label.areaInfo },
      radiusInfo: { ...data.label.radiusInfo },
    },
  }
}
