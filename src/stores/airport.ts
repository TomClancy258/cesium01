import { defineStore } from 'pinia'
import { reactive } from 'vue'

// 定义筛选表单类型（包含visible）
interface AirportFilterForm {
  icao: '',
  country: '',
  name: '',
  visible: boolean // 飞机显示状态
  alwaysVisible: boolean
}

export const useAirportStore = defineStore('Airport', () => {
  // 仅存储筛选表单数据
  const airportFilterForm = reactive<AirportFilterForm>({
    icao: '',
    country: '',
    name: '',
    visible: true, // 飞机显示状态
    alwaysVisible: false // 飞机显示状态
  })

  // 仅提供数据重置方法（纯数据操作）
  const resetAirportFilterForm = () => {
    airportFilterForm.icao = ''
    airportFilterForm.country = ''
    airportFilterForm.name = ''
    airportFilterForm.visible = true
    airportFilterForm.alwaysVisible = false
  }

  return {
    airportFilterForm,
    resetAirportFilterForm
  }
})
