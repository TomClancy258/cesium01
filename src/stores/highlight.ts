// stores/highlight.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AircraftSelectedData } from '@/views/aviation-situation/types/aircraft'
import type { AirportSelectedData } from '@/views/aviation-situation/types/airport'

export const useHighlightStore = defineStore('highlight', () => {
  // 选中数据（响应式，支撑UI联动）
  const selected = ref<AircraftSelectedData | AirportSelectedData | null>(null)
  // hover数据（如果UI需要hover联动则加，否则可删除）
  const hovered = ref<AircraftSelectedData | AirportSelectedData | null>(null)

  // ========== 选中相关 ==========
  const clearSelected = (): void => {
    selected.value = null
  }

  const setSelected = (
    data: AircraftSelectedData | AirportSelectedData | null = null
  ): void => {
    selected.value = data
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
    data: AircraftSelectedData | AirportSelectedData | null = null
  ): void => {
    hovered.value = data
  }

  return {
    // 响应式状态
    selected,
    hovered,
    // 方法
    clearSelected,
    setSelected,
    setSelectedPosition,

    clearHovered,
    setHovered
  }
})
