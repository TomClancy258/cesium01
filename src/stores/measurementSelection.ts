// stores/surveyAndMap.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AviationSelectedData } from '@/views/aviation-situation/types/shared'

export const useSurveyAndMapHighlightStore = defineStore('highlight', () => {
  const lastSelectedIcao24=ref<string | null >(null)

  // 选中数据（响应式，支撑UI联动）
  const selected = ref<AviationSelectedData>(null)

  // ========== 选中相关 ==========
  const clearSelected = (): void => {
    selected.value = null
  }

  const setSelected = (
    data: AviationSelectedData = null
  ): void => {
    selected.value = data
  }

  const clearLastSelectedIcao24 = (): void => {
    lastSelectedIcao24.value = null
  }

  const setLastSelectedIcao24 = (
    icao24: string|null
  ): void => {
    lastSelectedIcao24.value = icao24
  }

  const setSelectedPosition = (longitude: number, latitude: number, altitude: number): void => {
    if (selected.value !== null) {
      selected.value.position.longitude = longitude
      selected.value.position.latitude = latitude
      if (selected.value.sourceType === 'aircraft') {
        selected.value.position.baroAltitude = altitude
      } else if (selected.value.sourceType === 'airport') {
        selected.value.position.elevation = altitude
      }
    }
  }

  return {
    // 响应式状态
    selected,
    lastSelectedIcao24,
    // 方法
    clearSelected,
    setSelected,
    setSelectedPosition,

    clearLastSelectedIcao24,
    setLastSelectedIcao24,
  }
})
