import { defineStore } from 'pinia'
import { reactive, shallowRef, computed, triggerRef } from 'vue'
import type {
  SatelliteFilterForm,
  MatchedSatellite,
} from '@/views/aviation-situation/types/satellite'
import type { Aircraft } from '@/network/aircraft/types/aircraft'
import type { Airport } from '@/network/airport/type'
import type { LngLatAlt } from '@/views/aviation-situation/types/shared'
import {
  selectedSatelliteContinentCountryValues
} from '@/views/aviation-situation/constants/satellite-filter-data'

export const useSatelliteStore = defineStore('useSatelliteStore', () => {
  const satelliteFilterForm = reactive<SatelliteFilterForm>({
    id: '',
    name: '',
    countries: selectedSatelliteContinentCountryValues,
    visible: true
  })

  const matchedSatelliteMap = shallowRef<Map<string, MatchedSatellite>>(new Map())
  const matchedSatellites = computed(() => [...matchedSatelliteMap.value.values()])

  const clearMatchedSatellites = () => {
    matchedSatelliteMap.value.clear()
  }

  const setMatchedSatellite = (matched: MatchedSatellite) => {
    matchedSatelliteMap.value.set(matched.satellite.id, matched)
  }

  const commitMatchedSatellites = () => {
    triggerRef(matchedSatelliteMap)
  }

  /** 坐标已写在同一 Satellite 引用上时，仅用于按 id 兜底同步 */
  const updateMatchedSatelliteLngLatAlt = (id: string, lngLatAlt: LngLatAlt) => {
    const matched = matchedSatelliteMap.value.get(id)
    if (!matched) return
    matched.satellite.lngLatAlt.longitude = lngLatAlt.longitude
    matched.satellite.lngLatAlt.latitude = lngLatAlt.latitude
    matched.satellite.lngLatAlt.height = lngLatAlt.height
  }

  const applyConeScanResults = (
    aircraftBySatelliteId?: Map<string, Map<string, Aircraft>>,
    airportBySatelliteId?: Map<string, Map<string, Airport>>,
  ) => {
    if (aircraftBySatelliteId) {
      for (const [id, aircraftMap] of aircraftBySatelliteId.entries()) {
        const matchedSatellite = matchedSatelliteMap.value.get(id)
        if (!matchedSatellite) continue
        matchedSatellite.aircraft.aircraftMap = new Map(aircraftMap)
      }
    }
    if (airportBySatelliteId) {
      for (const [id, airportMap] of airportBySatelliteId.entries()) {
        const matchedSatellite = matchedSatelliteMap.value.get(id)
        if (!matchedSatellite) continue
        matchedSatellite.airport.airportMap = new Map(airportMap)
      }
    }
    commitMatchedSatellites()
  }

  const resetSatelliteFilterForm = () => {
    satelliteFilterForm.id = ''
    satelliteFilterForm.name = ''
    satelliteFilterForm.countries = selectedSatelliteContinentCountryValues
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
    updateMatchedSatelliteLngLatAlt,
    applyConeScanResults,
  }
})
