import { defineStore } from 'pinia'
import { reactive, shallowRef } from 'vue'
import type { Airport } from '@/network/airport/type'

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

  const matchedAirports=shallowRef<Airport[]>([])
  const clearMatchedAirports=()=>{
    matchedAirports.value=[]
  }
  const addMatchedAirports=(airport:Airport)=>{
    matchedAirports.value.push(airport)
  }

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
    resetAirportFilterForm,

    matchedAirports,
    clearMatchedAirports,
    addMatchedAirports,
  }
})
