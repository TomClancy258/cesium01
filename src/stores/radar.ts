import { defineStore } from 'pinia'
import { computed, reactive, shallowRef, triggerRef } from 'vue'
import type { Aircraft } from '@/network/aircraft/types/aircraft'
import type { MatchedRadar, RadarFilterForm, RadarTable } from '@/views/aviation-situation/types/radar'
import { createMatchedRadar } from '@/views/aviation-situation/types/radar'

export const useRadarStore = defineStore('useRadarStore', () => {
  const radarFilterForm = reactive<RadarFilterForm>({
    id: '',
    name: '',
    countries: [],
    detectAircraft: 'all',
    visible: true,
  })

  const matchedRadarMap = shallowRef<Map<string, MatchedRadar>>(new Map())
  const matchedRadars = computed(() => [...matchedRadarMap.value.values()])

  const clearMatchedRadars = (): void => {
    matchedRadarMap.value.clear()
  }

  const setMatchedRadar = (matched: MatchedRadar): void => {
    matchedRadarMap.value.set(matched.radar.id, matched)
  }

  const commitMatchedRadars = (): void => {
    triggerRef(matchedRadarMap)
  }

  const resetRadarFilterForm = (): void => {
    radarFilterForm.id = ''
    radarFilterForm.name = ''
    radarFilterForm.countries = []
    radarFilterForm.detectAircraft = 'all'
    radarFilterForm.visible = true
  }

  const clearRadarAircraftMaps = (): void => {
    for (const [, matched] of matchedRadarMap.value) {
      matched.aircraft = { aircraftMap: new Map() }
    }
  }

  const addAircraftToRadar = (radarId: string, aircraft: Aircraft): void => {
    const matched = matchedRadarMap.value.get(radarId)
    if (!matched) return
    matched.aircraft.aircraftMap.set(aircraft.icao24, aircraft)
  }

  const commitRadarAircraftMaps = (): void => {
    for (const [, matched] of matchedRadarMap.value) {
      matched.aircraft = { aircraftMap: new Map(matched.aircraft.aircraftMap) }
    }
    triggerRef(matchedRadarMap)
  }

  return {
    radarFilterForm,
    resetRadarFilterForm,
    matchedRadarMap,
    matchedRadars,
    clearMatchedRadars,
    setMatchedRadar,
    commitMatchedRadars,
    clearRadarAircraftMaps,
    addAircraftToRadar,
    commitRadarAircraftMaps,
  }
})
