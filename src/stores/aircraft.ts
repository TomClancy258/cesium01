import { defineStore } from 'pinia'
import { reactive,shallowRef } from 'vue'
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

  const matchedAircrafts=shallowRef<Aircraft[]>([])
  const clearMatchedAircrafts=()=>{
    matchedAircrafts.value=[]
  }
  const addMatchedAircrafts=(aircraft:Aircraft)=>{
    matchedAircrafts.value.push(aircraft)
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
    clearMatchedAircrafts,
    addMatchedAircrafts,
  }
})
