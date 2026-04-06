//src/stores/distanceMeasurement.ts
import { defineStore } from 'pinia'
import { shallowRef,computed,triggerRef } from 'vue'
import type { DistanceMeasurementData } from '@/views/aviation-situation/types/draw-tools'

export const useDistanceMeasurementStore = defineStore('useDistanceMeasurementStore', () => {

  const finishedGraphicMap = shallowRef(new Map<string, DistanceMeasurementData>())
  const finishedGraphicsArray = computed(() => Array.from(finishedGraphicMap.value.values()))

  const addFinishedSelection=(region: DistanceMeasurementData) =>{
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
