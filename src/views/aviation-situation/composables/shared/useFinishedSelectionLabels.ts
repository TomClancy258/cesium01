import { useSpatialSelectionStore } from '@/stores/spatialSelection'
import { ShallowRef } from 'vue'
import Cesium from 'cesium'

/** 更新各 finished 选区的 label 文字（飞机数量部分） */
export const updateFinishedSelectionLabels = (viewer: ShallowRef<Cesium.Viewer>) => {
  const spatialSelectionStore = useSpatialSelectionStore()

  for (const [dataSourceName, selectionRegion] of spatialSelectionStore.finishedGraphicMap) {
    if (selectionRegion.sourceType === 'polygonSpatialSelection'){
      const dataSources = viewer.value.dataSources.getByName(dataSourceName)
      if (!dataSources.length) continue

      const values = dataSources[0].entities.values
      const metricsLabelEntity = values[1]
      const props = metricsLabelEntity.properties.getValue() as EntityProperties

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
      const props = entity.properties.getValue() as EntityProperties
      const base = `周长：${props.label.perimeterInfo.formattedPerimeterStr}\n面积：${props.label.areaInfo.formattedAreaStr}\n半径：${props.label.radiusInfo.formattedRadiusStr}`

      const target = selectionRegion.spatialSelectionTarget
      if (target === 'aircraft') {
        entity.label.text = `飞机：${selectionRegion.aircraft.aircraftMap.size} 架\n${base}`
      } else if (target === 'all') {
        entity.label.text = `飞机：${selectionRegion.aircraft.aircraftMap.size} 架\n机场：${selectionRegion.airport.airportMap.size} 个\n${base}`
      }
    }


    // airport-only 的 label 由 useAirportSpatialSelection 负责
  }
}
