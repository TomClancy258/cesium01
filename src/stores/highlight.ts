// stores/highlight.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AviationSelectedData } from '@/views/aviation-situation/types/shared'

export const useHighlightStore = defineStore('highlight', () => {
  const lastSelectedIcao24=ref<string | null >(null)

  // 选中数据（响应式，支撑UI联动）
  const selected = ref<AviationSelectedData>(null)
  // hover数据（如果UI需要hover联动则加，否则可删除）
  const hovered = ref<AviationSelectedData>(null)

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

  // ========== hover相关（可选，仅UI联动时用） ==========
  const clearHovered = (): void => {
    hovered.value = null
  }

  const setHovered = (
    data: AviationSelectedData = null
  ): void => {
    hovered.value = data
  }

  return {
    // 响应式状态
    selected,
    hovered,
    lastSelectedIcao24,
    // 方法
    clearSelected,
    setSelected,
    setSelectedPosition,

    clearHovered,
    setHovered,

    clearLastSelectedIcao24,
    setLastSelectedIcao24,
  }
})
