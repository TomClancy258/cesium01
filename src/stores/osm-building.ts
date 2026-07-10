import { defineStore } from 'pinia'
import { reactive} from 'vue'
import {
  OSMBuildingFilterForm,
  OSMBuildingTypeFilterValue,
} from '@/views/aviation-situation/types/osm-building.ts'
import { allOSMBuildingTypeValues } from '@/views/aviation-situation/constants/osm-building-filter-data'

const createDefaultOSMBuildingFilterForm = (): OSMBuildingFilterForm => ({
  types: [...allOSMBuildingTypeValues],
  colorByType: false,
  colorByDistance: false,
})

export const useOSMBuildingStore = defineStore('useOSMBuildingStore', () => {

  // 仅存储筛选表单数据
  const osmBuildingFilterForm = reactive<OSMBuildingFilterForm>(
    createDefaultOSMBuildingFilterForm(),
  )


  // 仅提供数据重置方法（纯数据操作）
  const resetOSMBuildingFilterForm = () => {
    Object.assign(osmBuildingFilterForm, createDefaultOSMBuildingFilterForm())
  }

  const setOSMBuildingFilterTypes = (types: OSMBuildingTypeFilterValue[]) => {
    osmBuildingFilterForm.types = types
  }

  const toggleAllOSMBuildingFilterTypes = (checked: boolean) => {
    setOSMBuildingFilterTypes(checked ? [...allOSMBuildingTypeValues] : [])
  }


  return {
    osmBuildingFilterForm,
    resetOSMBuildingFilterForm,
    setOSMBuildingFilterTypes,
    toggleAllOSMBuildingFilterTypes,
  }
})
