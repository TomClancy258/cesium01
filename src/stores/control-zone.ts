import { defineStore } from 'pinia'
import { reactive, shallowRef, computed, triggerRef } from 'vue'
import type{
  ControlZoneFilterForm,
  MatchedControlZone,
} from '@/views/aviation-situation/types/control-zone'
import type { Aircraft } from '@/network/aircraft/types/aircraft'
import { ControlZoneLevelFilterValue } from '@/views/aviation-situation/types/control-zone'
import {
  allControlZoneLevelValues
} from '@/views/aviation-situation/constants/control-zone-filter-data'

export const useControlZoneStore = defineStore('useControlZoneStore', () => {

  // 仅存储筛选表单数据
  const controlZoneFilterForm = reactive<ControlZoneFilterForm>({
    id: '',
    name: '',
    levels: ['warning' , 'danger' , 'info' , 'normal'],
    visible: true,
  })


  const matchedControlZones = shallowRef<Map<string, MatchedControlZone>>(new Map())
  const matchedControlZonesArray = computed(() => [...matchedControlZones.value.values()])

  const clearMatchedControlZones = () => {
    matchedControlZones.value.clear()
  }

  const setMatchedControlZone = (controlZone: MatchedControlZone) => {
    matchedControlZones.value.set(controlZone.id, controlZone)
  }
  const commitMatchedControlZones = () => {
    triggerRef(matchedControlZones)
  }

  const updateMatchedControlZone = (newControlZone: MatchedControlZone) => {
    const controlZone= matchedControlZones.value.get(newControlZone.id)
    if (controlZone) {
      const lngLatAlt=controlZone.lngLatAlt
      lngLatAlt.longitude=newControlZone.lngLatAlt.longitude
      lngLatAlt.latitude=newControlZone.lngLatAlt.latitude
      lngLatAlt.height=newControlZone.lngLatAlt.height
    }
  }

  const applyConeScanResults = (
    aircraftByControlZoneId: Map<string, Map<string, Aircraft>>,
    airportByControlZoneId: Map<string, Map<string, Airport>>,
  ) => {
    for (const [id, aircraftMap] of aircraftByControlZoneId.entries()) {
      const matchedControlZone=matchedControlZones.value.get(id)
      matchedControlZone.aircraft.aircraftMap=new Map(aircraftMap)
    }
    for (const [id, airportMap] of airportByControlZoneId.entries()) {
      const matchedControlZone=matchedControlZones.value.get(id)
      matchedControlZone.airport.airportMap=new Map(airportMap)
    }
    commitMatchedControlZones()
  }

  // 仅提供数据重置方法（纯数据操作）
  const resetControlZoneFilterForm = () => {
    controlZoneFilterForm.id = ''
    controlZoneFilterForm.name = ''
    controlZoneFilterForm.levels=['warning' , 'danger' , 'info' , 'normal']
    controlZoneFilterForm.visible = true
  }

  const setControlZoneFilterLevels = (levels: ControlZoneLevelFilterValue[]) => {
    controlZoneFilterForm.levels = levels
  }

  const toggleAllControlZoneFilterLevels = (checked: boolean) => {
    setControlZoneFilterLevels(checked ? [...allControlZoneLevelValues] : [])
  }

  return {
    controlZoneFilterForm,
    resetControlZoneFilterForm,

    matchedControlZones,
    matchedControlZonesArray,
    clearMatchedControlZones,
    setMatchedControlZone,
    commitMatchedControlZones,
    updateMatchedControlZone,
    applyConeScanResults,

    toggleAllControlZoneFilterLevels
  }
})
