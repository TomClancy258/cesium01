//src/stores/spatial-selection.ts
import { defineStore } from 'pinia'
import { reactive, shallowRef, computed, triggerRef } from 'vue'
import type { SelectionRegionBase } from '@/views/aviation-situation/types/shared'
import type { Aircraft } from '@/network/aircraft/types/aircraft'
import type { Airport } from '@/network/airport/type'

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


  const clearFinishedSelectionAircraftMaps = () => {
    for (const [, selectionRegion] of finishedGraphicMap.value) {
      selectionRegion.aircraft = { aircraftMap: new Map() }
    }
  }

  const addAircraftToFinishedSelection = (dataSourceName: string, aircraft: Aircraft) => {
    const region = finishedGraphicMap.value.get(dataSourceName)
    if (!region) return
    region.aircraft.aircraftMap.set(aircraft.icao24, aircraft)
  }

  const commitFinishedAircraftMaps = () => {
    for (const [, region] of finishedGraphicMap.value) {
      region.aircraft = { aircraftMap: new Map(region.aircraft.aircraftMap) }
    }
    triggerRef(finishedGraphicMap)
  }

  const triggerFinishedGraphicMapUpdate = () => {
    triggerRef(finishedGraphicMap)
  }

  const clearFinishedSelectionAirportMaps = () => {
    for (const [, selectionRegion] of finishedGraphicMap.value) {
      selectionRegion.airport = { airportMap: new Map() }
    }
  }

  const addAirportToFinishedSelection = (dataSourceName: string, airport: Airport) => {
    const region = finishedGraphicMap.value.get(dataSourceName)
    if (!region) return
    region.airport.airportMap.set(airport.icao, airport)
  }

  const commitFinishedAirportMaps = () => {
    for (const [, region] of finishedGraphicMap.value) {
      region.airport = { airportMap: new Map(region.airport.airportMap) }
    }
    triggerRef(finishedGraphicMap)
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
    clearFinishedSelectionAircraftMaps,
    addAircraftToFinishedSelection,
    commitFinishedAircraftMaps,
    triggerFinishedGraphicMapUpdate,
    clearFinishedSelectionAirportMaps,
    addAirportToFinishedSelection,
    commitFinishedAirportMaps,

    clearActiveAviationSpatialSelection,
  }
})
