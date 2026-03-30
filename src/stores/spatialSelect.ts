//src/stores/spatialSelect.ts
import { defineStore } from 'pinia'
import { reactive, shallowRef,computed,triggerRef } from 'vue'
import {
  SelectionRegion,
} from '@/views/aviation-situation/types/shared'
// 定义筛选表单类型
export interface SpatialSelectForm {
  operationType: string,
  spatialSelectionSubtype: string,
  spatialSelectionTarget: string,
}

export const useSpatialSelectStore = defineStore('spatialSelect', () => {
  // 仅存储筛选表单数据
  const spatialSelectForm = reactive<SpatialSelectForm>({
    operationType: 'none',
    spatialSelectionSubtype: 'none',
    spatialSelectionTarget: 'measurement',
  })

  const activeSpatialSelection=reactive({
    aircraft:{
      icao24Set:new Set<string>()
    },
    airport:{
      icaoSet:new Set<string>()
    },
  })

  //TODO ts类型
  const finishedGraphicMap = shallowRef(new Map<string, any>())
  const finishedGraphicsArray = computed(() => Array.from(finishedGraphicMap.value.values()))



  // 仅提供数据重置方法（纯数据操作）
  const resetAirportFilterForm = () => {
    spatialSelectForm.operationType = 'none'
    spatialSelectForm.spatialSelectionSubtype = 'none'
    spatialSelectForm.spatialSelectionTarget = 'measurement'
  }

  const setOperationType = (type: string) => {
    // 可以在这里加一些逻辑，比如如果 type 是 'none'，自动清空其他子类型
    // if (type === 'none') {
    //   spatialSelectForm.spatialSelectionSubtype = 'none'
    //   spatialSelectForm.spatialSelectionTarget = 'all'
    // }
    spatialSelectForm.operationType = type
  }
  const setSpatialSelectionSubtype = (type: string) => {
    spatialSelectForm.spatialSelectionSubtype = type
  }

  const addAircraftToActiveSpatialSelection = (icao24: string) => {
    activeSpatialSelection.aircraft.icao24Set.add(icao24)
  }

  const removeAircraftFromActiveSpatialSelection = (icao24: string) => {
    activeSpatialSelection.aircraft.icao24Set.delete(icao24)
  }

  const clearActiveAircraftSpatialSelection = () => {
    activeSpatialSelection.aircraft.icao24Set.clear()
  }

  const addAirportToActiveSpatialSelection = (icao: string) => {
    activeSpatialSelection.airport.icaoSet.add(icao)
  }

  const removeAirportFromActiveSpatialSelection = (icao: string) => {
    activeSpatialSelection.airport.icaoSet.delete(icao)
  }

  const clearActiveAirportSpatialSelection = () => {
    activeSpatialSelection.airport.icaoSet.clear()
  }

  const addFinishedSelection=(region: SelectionRegion) =>{
    // 注意：确保 region 是 plain object（特别是 Set 要转 Array，否则 Vue 无法响应式）
    finishedGraphicMap.value.set(region.dataSourceName, region)
    triggerRef(finishedGraphicMap)
  }

  const removeFinishedSelection=(dataSourceName: string)=> {
    finishedGraphicMap.value.delete(dataSourceName)
    triggerRef(finishedGraphicMap)
  }

  const clearAllFinishedSelections=()=> {
    finishedGraphicMap.value.clear()
    triggerRef(finishedGraphicMap)
  }

  const clearFinishedSelectionAircraftIcao24Sets=()=> {
    for (const [dataSourceName, selectionRegion] of finishedGraphicMap.value) {
      selectionRegion.aircraft.icao24Set.clear()
    }
    triggerRef(finishedGraphicMap)
  }

  return {
    spatialSelectForm,
    activeSpatialSelection,

    setOperationType,
    setSpatialSelectionSubtype,
    resetAirportFilterForm,
    addAircraftToActiveSpatialSelection,
    removeAircraftFromActiveSpatialSelection,
    clearActiveAircraftSpatialSelection,
    addAirportToActiveSpatialSelection,
    removeAirportFromActiveSpatialSelection,
    clearActiveAirportSpatialSelection,

    finishedGraphicMap,
    finishedGraphicsArray,
    addFinishedSelection,
    removeFinishedSelection,
    clearAllFinishedSelections,
    clearFinishedSelectionAircraftIcao24Sets,
  }
})
