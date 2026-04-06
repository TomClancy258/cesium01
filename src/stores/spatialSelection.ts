//src/stores/spatialSelection.ts
import { defineStore } from 'pinia'
import { reactive, shallowRef,computed,triggerRef } from 'vue'
import type { SelectionRegionBase } from '@/views/aviation-situation/types/shared'

export const useSpatialSelectionStore = defineStore('spatialSelection', () => {

  const activeSpatialSelection=reactive({
    aircraft:{
      icao24Set:new Set<string>()
    },
    airport:{
      icaoSet:new Set<string>()
    },
  })

  const finishedGraphicMap = shallowRef(new Map<string, SelectionRegionBase>())
  const finishedGraphicsArray = computed(() => Array.from(finishedGraphicMap.value.values()))

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

  const addFinishedSelection=(region: SelectionRegionBase) =>{
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
    for (const [, selectionRegion] of finishedGraphicMap.value) {
      // selectionRegion.aircraft.icao24Set.clear()
      // 创建新对象引用，确保 prop 变化被 Vue 检测到
      selectionRegion.aircraft = { icao24Set: new Set() }
    }
  }

  const addAircraftToFinishedSelection = (dataSourceName: string, icao24: string) => {
    const region = finishedGraphicMap.value.get(dataSourceName)
    if (!region) return
    // region.aircraft.icao24Set.add(icao24)
    // 创建新 Set 引用而非原地 .add()，确保 prop 变化被 Vue 检测到
    region.aircraft = { icao24Set: new Set([...region.aircraft.icao24Set, icao24]) }
    // 注意：不在这里 triggerRef，由调用方批量完成后统一触发
  }

  const triggerFinishedGraphicMapUpdate = () => {
    triggerRef(finishedGraphicMap)
  }

  // 在 spatialSelection.ts 里补充（对应飞机侧的 addAircraftToFinishedSelection）
  const clearFinishedSelectionAirportIcaoSets = () => {
    for (const [, selectionRegion] of finishedGraphicMap.value) {
      // selectionRegion.airport.icaoSet.clear()
      selectionRegion.airport = { icaoSet: new Set() }
    }
  }

  const addAirportToFinishedSelection = (dataSourceName: string, icao: string) => {
    const region = finishedGraphicMap.value.get(dataSourceName)
    if (!region) return
    // region.airport.icaoSet.add(icao)
    region.airport = { icaoSet: new Set([...region.airport.icaoSet, icao]) }
  }

  const clearActiveAviationSpatialSelection=()=>{
    clearActiveAircraftSpatialSelection()
    clearActiveAirportSpatialSelection()
  }

  return {
    activeSpatialSelection,

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
    addAircraftToFinishedSelection,
    triggerFinishedGraphicMapUpdate,
    clearFinishedSelectionAirportIcaoSets,
    addAirportToFinishedSelection,

    clearActiveAviationSpatialSelection,
  }
})
