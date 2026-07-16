import { defineStore } from 'pinia'
import { reactive, shallowRef, computed, triggerRef } from 'vue'
import type{
  SatelliteFilterForm,
  MatchedSatellite,
} from '@/views/aviation-situation/types/satellite'
import type { Aircraft } from '@/network/aircraft/types/aircraft'
import type { Airport } from '@/network/airport/type'
import {
  selectedSatelliteContinentCountryValues
} from '@/views/aviation-situation/constants/satellite-filter-data'
// interface MatchedSatelliteRenderItem{
//   data:Satellite,
//   properties:SatelliteHoveredProperties
// }

export const useSatelliteStore = defineStore('useSatelliteStore', () => {

  // 仅存储筛选表单数据
  const satelliteFilterForm = reactive<SatelliteFilterForm>({
    id: '',
    name: '',
    countries: selectedSatelliteContinentCountryValues,
    visible: true
  })


  const matchedSatelliteMap = shallowRef<Map<string, MatchedSatellite>>(new Map())
  // const matchedSatellites2 = shallowRef<Map<string, MatchedSatelliteRenderItem>>(new Map())
  const matchedSatellites = computed(() => [...matchedSatelliteMap.value.values()])

  const clearMatchedSatellites = () => {
    // matchedSatelliteMap.value = new Map()
    matchedSatelliteMap.value.clear()
  }

  //set：可能新增也可能覆盖，add：只新增不覆盖。
  const setMatchedSatellite = (satellite: MatchedSatellite) => {
    matchedSatelliteMap.value.set(satellite.id, satellite)
  }
  const commitMatchedSatellites = () => {
    triggerRef(matchedSatelliteMap)
    // matchedSatelliteMap.value = new Map(matchedSatelliteMap.value)
  }

  const updateMatchedSatellite = (newSatellite: MatchedSatellite) => {
    const satellite= matchedSatelliteMap.value.get(newSatellite.id)
    if (satellite) {
      const lngLatAlt=satellite.lngLatAlt
      lngLatAlt.longitude=newSatellite.lngLatAlt.longitude
      lngLatAlt.latitude=newSatellite.lngLatAlt.latitude
      lngLatAlt.height=newSatellite.lngLatAlt.height
    }
  }

  const applyConeScanResults = (
    aircraftBySatelliteId: Map<string, Map<string, Aircraft>>,
    airportBySatelliteId: Map<string, Map<string, Airport>>,
  ) => {
    // for (const [id, satellite] of matchedSatelliteMap.value) {
    //   satellite.aircraft = {
    //     aircraftMap: new Map(aircraftBySatelliteId.get(id) ?? []),
    //   }
    //   satellite.airport = {
    //     airportMap: new Map(airportBySatelliteId.get(id) ?? []),
    //   }
    // }
    for (const [id, aircraftMap] of aircraftBySatelliteId.entries()) {
      const matchedSatellite=matchedSatelliteMap.value.get(id)
      matchedSatellite.aircraft.aircraftMap=new Map(aircraftMap)
    }
    for (const [id, airportMap] of airportBySatelliteId.entries()) {
      const matchedSatellite=matchedSatelliteMap.value.get(id)
      matchedSatellite.airport.airportMap=new Map(airportMap)
    }
    commitMatchedSatellites()
  }

  // 仅提供数据重置方法（纯数据操作）
  const resetSatelliteFilterForm = () => {
    satelliteFilterForm.id = ''
    satelliteFilterForm.name = ''
    satelliteFilterForm.countries=selectedSatelliteContinentCountryValues
    satelliteFilterForm.visible = true
  }


  return {
    satelliteFilterForm,
    resetSatelliteFilterForm,

    matchedSatelliteMap,
    matchedSatellites,
    clearMatchedSatellites,
    setMatchedSatellite,
    commitMatchedSatellites,
    updateMatchedSatellite,
    applyConeScanResults,
  }
})
