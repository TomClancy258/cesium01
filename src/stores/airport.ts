import { defineStore } from 'pinia'
import { reactive, shallowRef, computed, triggerRef } from 'vue'
import type { Airport } from '@/network/airport/type'
import type { AirportFilterForm } from '@/views/aviation-situation/types/airport.ts'
import {
  selectedContinentCountryValues
} from '@/views/aviation-situation/constants/airport-filter-data'

export const useAirportStore = defineStore('useAirportStore', () => {
  // 仅存储筛选表单数据
  const airportFilterForm = reactive<AirportFilterForm>({
    icao: '',
    // country: '',
    countries: selectedContinentCountryValues,
    name: '',
    visible: true, // 飞机显示状态
    labelVisible: false, // 飞机显示状态
    alwaysVisible: false // 飞机显示状态
  })

  const matchedAirports = shallowRef<Map<string, Airport>>(new Map())
  const matchedAirportsArray = computed(() => [...matchedAirports.value.values()])

  const clearMatchedAirports = () => {
    // matchedAirports.value = new Map()
    matchedAirports.value.clear()
  }
  const addMatchedAirports = (airport: Airport) => {
    matchedAirports.value.set(airport.icao, airport)
  }
  const commitMatchedAirports = () => {
    triggerRef(matchedAirports)
    // matchedAirports.value = new Map(matchedAirports.value)
  }

  // 仅提供数据重置方法（纯数据操作）
  const resetAirportFilterForm = () => {
    airportFilterForm.icao = ''
    // airportFilterForm.country = ''
    airportFilterForm.countries = selectedContinentCountryValues
    airportFilterForm.name = ''
    airportFilterForm.visible = true
    airportFilterForm.labelVisible = false
    airportFilterForm.alwaysVisible = false
  }

  return {
    airportFilterForm,
    resetAirportFilterForm,

    matchedAirports,
    matchedAirportsArray,
    clearMatchedAirports,
    addMatchedAirports,
    commitMatchedAirports,
  }
})
