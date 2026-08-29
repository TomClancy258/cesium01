import { defineStore } from 'pinia'
import { reactive, shallowRef, computed, triggerRef } from 'vue'
import type {AircraftTrajectoryOptions,AircraftFilterForm} from '@/views/aviation-situation/types/aircraft'
import type { Aircraft } from '@/network/aircraft/types/aircraft'
import {
  selectedContinentCountryValues
} from '@/views/aviation-situation/constants/aircraft-filter-data.ts'

export const useAircraftStore = defineStore('useAircraftStore', () => {

  // 仅存储筛选表单数据
  const aircraftFilterForm = reactive<AircraftFilterForm>({
    icao24: '',
    // originCountry: '',
    originCountries: [...selectedContinentCountryValues],
    callsign: '',
    startAirport: '',
    endAirport: '',
    riskLevel: 'all',
    visible: true,
    labelVisible: false
  })

  // const aircraftFilterFormCriginCountriesSet = computed(() => {
  //   return new Set<string>(aircraftFilterForm.originCountries)
  // })


  const matchedAircraftMap = shallowRef<Map<string, Aircraft>>(new Map())
  const matchedAircrafts = computed(() => [...matchedAircraftMap.value.values()])

  const clearMatchedAircrafts = () => {
    // matchedAircraftMap.value = new Map()
    matchedAircraftMap.value.clear()
  }
  const addMatchedAircrafts = (aircraft: Aircraft) => {
    matchedAircraftMap.value.set(aircraft.icao24, aircraft)
  }
  const commitMatchedAircrafts = () => {
    triggerRef(matchedAircraftMap)
    // matchedAircraftMap.value = new Map(matchedAircraftMap.value)
  }

  // 仅提供数据重置方法（纯数据操作）
  const resetAircraftFilterForm = () => {
    aircraftFilterForm.icao24 = ''
    // aircraftFilterForm.originCountry = ''
    aircraftFilterForm.originCountries = [...selectedContinentCountryValues]
    aircraftFilterForm.callsign = ''
    aircraftFilterForm.startAirport = ''
    aircraftFilterForm.endAirport = ''
    aircraftFilterForm.riskLevel = 'all'
    aircraftFilterForm.visible = true
    aircraftFilterForm.labelVisible = false
  }


  const aircraftTrajectoryOptions = reactive<AircraftTrajectoryOptions>({
    planned: {
      trajectoryVisible: false,
      waypointsVisible: false,
    },
  })

  const resetAircraftTrajectoryOptions = () => {
    aircraftTrajectoryOptions.planned.trajectoryVisible = false
    aircraftTrajectoryOptions.planned.waypointsVisible = false
  }

  return {
    aircraftFilterForm,
    resetAircraftFilterForm,

    aircraftTrajectoryOptions,
    resetAircraftTrajectoryOptions,

    matchedAircraftMap,
    matchedAircrafts,
    clearMatchedAircrafts,
    addMatchedAircrafts,
    commitMatchedAircrafts,
  }
})
