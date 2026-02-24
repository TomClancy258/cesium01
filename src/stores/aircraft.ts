import { defineStore } from 'pinia'
import { reactive } from 'vue'

// 定义筛选表单类型（包含visible）
interface AircraftFilterForm {
  icao24: string
  originCountry: string
  callsign: string
  visible: boolean // 飞机显示状态
}

export const useAircraftStore = defineStore('aircraft', () => {
  // 仅存储筛选表单数据
  const aircraftFilterForm = reactive<AircraftFilterForm>({
    icao24: '',
    originCountry: '',
    callsign: '',
    visible: true
  })

  // 仅提供数据重置方法（纯数据操作）
  const resetAircraftFilterForm = () => {
    aircraftFilterForm.icao24 = ''
    aircraftFilterForm.originCountry = ''
    aircraftFilterForm.callsign = ''
    aircraftFilterForm.visible = true
  }

  return {
    aircraftFilterForm,
    resetAircraftFilterForm
  }
})
