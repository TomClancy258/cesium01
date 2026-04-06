import { defineStore } from 'pinia'
import { reactive, shallowRef, computed, triggerRef } from 'vue'
import type {AircraftTrajectoryOptions,AircraftFilterForm} from '@/views/aviation-situation/types/aircraft'
import type { Aircraft } from '@/network/aircraft/types/aircraft'

export const useAircraftStore = defineStore('aircraft', () => {

  // 仅存储筛选表单数据
  const aircraftFilterForm = reactive<AircraftFilterForm>({
    icao24: '',
    originCountry: '',
    callsign: '',
    startAirport: '',
    endAirport: '',
    visible: true
  })

  const matchedAircrafts = shallowRef<Map<string, Aircraft>>(new Map())
  const matchedAircraftsArray = computed(() => [...matchedAircrafts.value.values()])

  const clearMatchedAircrafts = () => {
    // matchedAircrafts.value = new Map()
    matchedAircrafts.value.clear()
  }
  const addMatchedAircrafts = (aircraft: Aircraft) => {
    matchedAircrafts.value.set(aircraft.icao24, aircraft)
  }
  const commitMatchedAircrafts = () => {
    triggerRef(matchedAircrafts)
    // matchedAircrafts.value = new Map(matchedAircrafts.value)
  }

  // 仅提供数据重置方法（纯数据操作）
  const resetAircraftFilterForm = () => {
    aircraftFilterForm.icao24 = ''
    aircraftFilterForm.originCountry = ''
    aircraftFilterForm.callsign = ''
    aircraftFilterForm.startAirport = ''
    aircraftFilterForm.endAirport = ''
    aircraftFilterForm.visible = true
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

    matchedAircrafts,
    matchedAircraftsArray,
    clearMatchedAircrafts,
    addMatchedAircrafts,
    commitMatchedAircrafts,
  }
})
