import { defineStore } from 'pinia'
import { reactive, shallowRef, computed, triggerRef } from 'vue'
import {
  SatelliteFilterForm,
  SatelliteHoveredProperties
} from '@/views/aviation-situation/types/satellite'
import type { Satellite } from '@/network/satellite/index'
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


  const matchedSatellites = shallowRef<Map<string, Satellite>>(new Map())
  // const matchedSatellites2 = shallowRef<Map<string, MatchedSatelliteRenderItem>>(new Map())
  const matchedSatellitesArray = computed(() => [...matchedSatellites.value.values()])

  const clearMatchedSatellites = () => {
    // matchedSatellites.value = new Map()
    matchedSatellites.value.clear()
  }

  //set：可能新增也可能覆盖，add：只新增不覆盖。
  const setMatchedSatellite = (satellite: Satellite) => {
    matchedSatellites.value.set(satellite.id, satellite)
  }
  const commitMatchedSatellites = () => {
    triggerRef(matchedSatellites)
    // matchedSatellites.value = new Map(matchedSatellites.value)
  }

  const updateMatchedSatellite = (newSatellite:Satellite) => {
    const satellite= matchedSatellites.value.get(newSatellite.id)
    if (satellite) {
      const lngLatAlt=satellite.lngLatAlt
      lngLatAlt.longitude=newSatellite.lngLatAlt.longitude
      lngLatAlt.latitude=newSatellite.lngLatAlt.latitude
      lngLatAlt.height=newSatellite.lngLatAlt.height
    }
  }

  // 仅提供数据重置方法（纯数据操作）
  const resetSatelliteFilterForm = () => {
    satelliteFilterForm.id = ''
    satelliteFilterForm.name = ''
    satelliteFilterForm.countries=[]
    satelliteFilterForm.visible = true
  }


  return {
    satelliteFilterForm,
    resetSatelliteFilterForm,

    matchedSatellites,
    matchedSatellitesArray,
    clearMatchedSatellites,
    setMatchedSatellite,
    commitMatchedSatellites,
    updateMatchedSatellite,
  }
})
