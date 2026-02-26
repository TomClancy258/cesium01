import { defineStore } from 'pinia'
import { reactive } from 'vue'

// 定义筛选表单类型（包含visible）
interface AircraftFilterForm {
  icao24: string
  originCountry: string
  callsign: string
  startAirport: string
  endAirport: string
  visible: boolean // 飞机显示状态
}

export interface TrajectoryGroup {
  trajectoryVisible: boolean   // 轨迹线
  waypointsVisible: boolean    // 航路点
}

export interface AircraftTrajectoryOptions {
  planned: TrajectoryGroup     // 计划类
}

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
  }
})
