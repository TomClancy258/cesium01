// stores/aviation-selection.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AviationSelectedData, LngLatAlt } from '@/views/aviation-situation/types/shared'

export const useAviationSelectionStore = defineStore('aviationSelection', () => {
  const lastSelectedIcao24=ref<string | null >(null)

  // 选中数据（响应式，支撑UI联动）
  const selected = ref<AviationSelectedData>(null)
  const hovered = ref<AviationSelectedData>(null)

  const clearHovered = (): void => {
    hovered.value = null
  }

  const setHovered = (
    data: AviationSelectedData = null
  ): void => {
    hovered.value = data
  }

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

  const setSelectedLngLatAlt = (lngLatAlt:LngLatAlt): void => {
    if (selected.value !== null) {
      selected.value.lngLatAlt.longitude = lngLatAlt.longitude
      selected.value.lngLatAlt.latitude = lngLatAlt.latitude
      if (selected.value.sourceType === 'aircraft') {
        selected.value.lngLatAlt.baroAltitude = lngLatAlt.height
      } else if (selected.value.sourceType === 'airport') {
        selected.value.lngLatAlt.elevation = lngLatAlt.height
      } else if (selected.value.sourceType === 'satellite') {
        selected.value.lngLatAlt.height = lngLatAlt.height
      }
    }
  }


  const setHoveredPosition = (longitude: number, latitude: number, altitude: number): void => {
    if (hovered.value !== null) {
      hovered.value.lngLatAlt.longitude = longitude
      hovered.value.lngLatAlt.latitude = latitude
      if (hovered.value.sourceType === 'aircraft') {
        hovered.value.lngLatAlt.baroAltitude = altitude
      } else if (hovered.value.sourceType === 'airport') {
        hovered.value.lngLatAlt.elevation = altitude
      }
    }
  }

  return {
    // 响应式状态
    selected,
    hovered,
    lastSelectedIcao24,
    // 方法
    clearHovered,
    setHovered,
    setHoveredPosition,

    clearSelected,
    setSelected,
    setSelectedLngLatAlt,

    clearLastSelectedIcao24,
    setLastSelectedIcao24,
  }
})
