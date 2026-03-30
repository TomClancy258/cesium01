// src/views/aviation-situation/composables/useSpatialSelection.ts

import * as turf from '@turf/turf'
import * as Cesium from "cesium"
import {
  SpatialSelectionData,
  SelectionRegion,
  SpatialSelection,
  AviationRenderItem
} from '../types/shared'
import {
  highlightBillboardOnSpatialSelection,
  clearSpatialSelectedHighlight,
} from './useBillboardHighlightManager'
import { emitCesiumEvent, onCesiumEvent } from './mittBus'
import { onUnmounted, ShallowRef } from 'vue'
import { isInCircle, isInsideHemisphere } from '@/utils/geoUtils'
import { useSpatialSelectStore } from '@/stores/spatialSelect'
import type { EntityProperties } from '@/views/aviation-situation/types/entity'

interface UseSpatialSelectionOptions<T> {
  viewer:ShallowRef<Cesium.Viewer>,
  /** 当前筛选匹配的 id 集合（引用，保持响应式） */
  matchedIdSet: Set<string>
  /** 完整渲染 Map，key 为 id */
  renderMap: Map<string, AviationRenderItem<T>>
  /** 从 data 中取经纬度 */
  getCoord: (data: T) => [number, number]
  /** 框选高亮图片 URL */
  spatialSelectedImageUrl: string
  /** 事件名：如 'aircraftSpatialSelect' | 'airportSpatialSelect' */
  spatialSelectEvent: string
  /** 清除事件名：统一用 'clearAviationActiveSpatialSelection' */
  clearActiveEvent?: string
}

export function useSpatialSelection<T>(options: UseSpatialSelectionOptions<T>) {
  const {
    viewer,
    matchedIdSet,
    renderMap,
    getCoord,
    spatialSelectedImageUrl,
    spatialSelectEvent,
    clearActiveEvent = 'clearAviationActiveSpatialSelection',
  } = options

  const spatialSelectStore = useSpatialSelectStore()

  const spatialSelection: SpatialSelection = {
    active: {
      type: '',
      dataSourceName: '',
      graphic: null,
      idSet: new Set<string>(),
    },
    // finishedGraphicMap: new Map(),
  }

  const activateSpatialSelection = (spatialSelectionData: SpatialSelectionData): void => {
    spatialSelection.active.type = spatialSelectionData.type
    spatialSelection.active.dataSourceName = spatialSelectionData.dataSourceName
    spatialSelection.active.graphic = spatialSelectionData.graphic
    spatialSelection.active.idSet.clear()

    if (spatialSelectEvent === 'aircraftSpatialSelect') {
      spatialSelectStore.clearActiveAircraftSpatialSelection()
    } else if (spatialSelectEvent === 'airportSpatialSelect') {
      spatialSelectStore.clearActiveAirportSpatialSelection()
    }

    matchedIdSet.forEach((id:string) => {
      const item:AviationRenderItem<T> = renderMap.get(id)
      if (!item) return

      const [lng, lat] = getCoord(item.data)
      let isInGraphic = false

      if (spatialSelectionData.sourceType === 'polygonSpatialSelection') {
        const turfPoint = turf.point([lng, lat])
        isInGraphic = turf.booleanPointInPolygon(turfPoint, spatialSelectionData.graphic)
      }else if (spatialSelectionData.sourceType === 'circleSpatialSelection') {
        isInGraphic = isInCircle([lng, lat],spatialSelectionData.centerLngLatAltArray,spatialSelectionData.radius)
      }else if (spatialSelectionData.sourceType === 'hemisphereSpatialSelection') {
        isInGraphic = isInsideHemisphere([lng, lat],spatialSelectionData.centerLngLatAltArray,spatialSelectionData.radius)
      }
      if (isInGraphic) {
        spatialSelection.active.idSet.add(id)
        if (spatialSelectEvent === 'aircraftSpatialSelect') {
          spatialSelectStore.addAircraftToActiveSpatialSelection(id)
        } else if (spatialSelectEvent === 'airportSpatialSelect') {
          spatialSelectStore.addAirportToActiveSpatialSelection(id)
        }
        highlightBillboardOnSpatialSelection(
          spatialSelectionData.dataSourceName,
          item.billboard,
          spatialSelectedImageUrl,
        )
      } else {
        clearSpatialSelectedHighlight(spatialSelectionData.dataSourceName, item.billboard)
      }
    })
  }

  const finishedSpatialSelection = (): void => {
    // for (const [dataSourceName, selectionRegion] of spatialSelection.finishedGraphicMap) {
    for (const [dataSourceName, selectionRegion] of spatialSelectStore.finishedGraphicMap) {
      selectionRegion.aircraft.icao24Set.clear()
      // selectionRegion.airport.icaoSet.clear()
    }
    matchedIdSet.forEach((id) => {
      const item = renderMap.get(id)
      if (!item) return

      const [lng, lat] = getCoord(item.data)

      // for (const [dataSourceName, selectionRegion] of spatialSelection.finishedGraphicMap) {
      for (const [dataSourceName, selectionRegion] of spatialSelectStore.finishedGraphicMap) {
        let isInGraphic = false
        if (selectionRegion.sourceType === 'polygonSpatialSelection') {
          const turfPoint = turf.point([lng, lat])
          isInGraphic = turf.booleanPointInPolygon(turfPoint, selectionRegion.graphic)
        }else if (selectionRegion.sourceType === 'circleSpatialSelection') {
          isInGraphic = isInCircle([lng, lat],selectionRegion.centerLngLatAltArray,selectionRegion.radius)
        }else if (selectionRegion.sourceType === 'hemisphereSpatialSelection') {
          isInGraphic = isInsideHemisphere([lng, lat],selectionRegion.centerLngLatAltArray,selectionRegion.radius)
        }

        if (isInGraphic) {
          if (spatialSelectEvent === 'aircraftSpatialSelect') {
            selectionRegion.aircraft.icao24Set.add(item.data.icao24)
          } else if (spatialSelectEvent === 'airportSpatialSelect') {
            // selectionRegion.airport.icaoSet.add(item.data.icao)
          }

          highlightBillboardOnSpatialSelection(dataSourceName, item.billboard, spatialSelectedImageUrl)
        } else {
          clearSpatialSelectedHighlight(dataSourceName, item.billboard)
        }
      }
    })

    // for (const [dataSourceName, selectionRegion] of spatialSelection.finishedGraphicMap) {
    for (const [dataSourceName, selectionRegion] of spatialSelectStore.finishedGraphicMap) {
      if(selectionRegion.sourceType==='polygonSpatialSelection'){
        const dataSources: Cesium.CustomDataSource[] = viewer.value.dataSources.getByName(dataSourceName)
        if (dataSources.length === 0) {
          return
        }
        const dataSource: Cesium.CustomDataSource = dataSources[0]
        const values: Cesium.Entity[] = dataSource.entities.values

        const metricsLabelEntity=values[1]
        const props = metricsLabelEntity.properties.getValue() as EntityProperties

        let staticText:string = `周长：${props.label.perimeterInfo.formattedPerimeterStr}\n面积：${props.label.areaInfo.formattedAreaStr}`;

        if(selectionRegion.spatialSelectionTarget==='aircraft') {
          staticText=`飞机：${selectionRegion.aircraft.icao24Set.size} 架\n`+staticText

        }else if(selectionRegion.spatialSelectionTarget==='airport') {
          staticText=`机场：${selectionRegion.airport.icaoSet.size} 个\n`+staticText

        }else if(selectionRegion.spatialSelectionTarget==='all') {
          staticText=`飞机：${selectionRegion.aircraft.icao24Set.size} 架\n机场：${selectionRegion.airport.icaoSet.size} 个\n`+staticText
        }
        metricsLabelEntity.label.text=staticText
      }
    }
  }

  const clearActiveSpatialSelection = (): void => {
    spatialSelection.active.idSet.forEach((id) => {
      const item = renderMap.get(id)
      if (!item) return
      clearSpatialSelectedHighlight(spatialSelection.active.dataSourceName, item.billboard)
    })
    spatialSelection.active.idSet.clear()
  }
  let unsubSpatialSelect: () => void
  let unsubClearActive: () => void
  const subscribeSpatialSelectionEvents = (): void => {

    unsubSpatialSelect = onCesiumEvent(spatialSelectEvent, (spatialSelectionData: SpatialSelectionData) => {
      if (spatialSelectionData.isActive) {
        activateSpatialSelection(spatialSelectionData)
      } else {
        const selectionRegion: SelectionRegion = {
          dataSourceName: spatialSelectionData.dataSourceName,
          graphic: spatialSelectionData.graphic,
          type: spatialSelectionData.type,
          radius: spatialSelectionData.radius,
          sourceType:spatialSelectionData.sourceType,
          centerLngLatAltArray: spatialSelectionData.centerLngLatAltArray,
          aircraft:{
            icao24Set:new Set<string>(spatialSelectionData.aircraft.icao24Set)
          },
          airport:{
            icaoSet:new Set<string>(spatialSelectionData.airport.icaoSet)
          },
          spatialSelectionTarget:spatialSelectionData.spatialSelectionTarget,
          label:{
            perimeterInfo:{
              perimeter:spatialSelectionData.label.perimeterInfo.perimeter,
              formattedPerimeterStr:spatialSelectionData.label.perimeterInfo.formattedPerimeterStr
            },
            areaInfo:{
              area:spatialSelectionData.label.areaInfo.area,
              formattedAreaStr:spatialSelectionData.label.areaInfo.formattedAreaStr
            },
            radiusInfo:{
              radius:spatialSelectionData.label.radiusInfo?.radius,
              formattedRadiusStr:spatialSelectionData.label.radiusInfo?.formattedRadiusStr
            },
          },
          polygonState:{
            lngLatAltArray: spatialSelectionData.polygonState?.lngLatAltArray,
            pointCount: spatialSelectionData.polygonState?.pointCount,
          },
          segmentDistancesState:spatialSelectionData.segmentDistancesState
          // idSet: new Set<string>(matchedIdSet), //似乎可以去掉
        }

        spatialSelectStore.addFinishedSelection(selectionRegion)
        // spatialSelection.finishedGraphicMap.set(spatialSelectionData.dataSourceName, selectionRegion)
        finishedSpatialSelection()
      }
    })

    unsubClearActive = onCesiumEvent(clearActiveEvent, () => {
      clearActiveSpatialSelection()
    })
  }

  const dispose = () => {
    unsubSpatialSelect?.()
    unsubClearActive?.()
  }

  onUnmounted(()=>{
    dispose()
  })

  return {
    spatialSelection,
    finishedSpatialSelection,
    subscribeSpatialSelectionEvents,
  }
}
