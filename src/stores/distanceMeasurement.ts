//src/stores/distanceMeasurement.ts
import { defineStore } from 'pinia'
import { reactive, shallowRef,computed,triggerRef } from 'vue'
import {
  SelectionRegion,
} from '@/views/aviation-situation/types/shared'

export const useDistanceMeasurementStore = defineStore('useDistanceMeasurementStore', () => {

  //TODO ts类型
  const finishedGraphicMap = shallowRef(new Map<string, any>())
  const finishedGraphicsArray = computed(() => Array.from(finishedGraphicMap.value.values()))

  const addFinishedSelection=(region: SelectionRegion) =>{
    // 注意：确保 region 是 plain object（特别是 Set 要转 Array，否则 Vue 无法响应式）
    finishedGraphicMap.value.set(region.dataSourceName, region)
    triggerRef(finishedGraphicMap)
  }

  const removeFinishedSelection=(dataSourceName: string)=> {
    finishedGraphicMap.value.delete(dataSourceName)
    triggerRef(finishedGraphicMap)
  }

  const clearAllFinishedSelections=()=> {
    finishedGraphicMap.value.clear()
    triggerRef(finishedGraphicMap)
  }


  const triggerFinishedGraphicMapUpdate = () => {
    triggerRef(finishedGraphicMap)
  }


  return {
    finishedGraphicMap,
    finishedGraphicsArray,
    addFinishedSelection,
    removeFinishedSelection,
    clearAllFinishedSelections,
    triggerFinishedGraphicMapUpdate,
  }
})
