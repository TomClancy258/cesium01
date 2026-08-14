// stores/aviation-selection.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AviationSelectedData } from '@/views/aviation-situation/types/shared'

export const useAviationSelectionStore = defineStore('aviationSelection', () => {
  const lastSelectedIcao24 = ref<string | null>(null)

  /** 选中 / 悬停：只存身份；业务行查各 matchedMap / registry */
  const selected = ref<AviationSelectedData>(null)
  const hovered = ref<AviationSelectedData>(null)

  const clearHovered = (): void => {
    hovered.value = null
  }

  const setHovered = (data: AviationSelectedData = null): void => {
    hovered.value = data
  }

  const clearSelected = (): void => {
    selected.value = null
  }

  const setSelected = (data: AviationSelectedData = null): void => {
    selected.value = data
  }

  const clearLastSelectedIcao24 = (): void => {
    lastSelectedIcao24.value = null
  }

  const setLastSelectedIcao24 = (icao24: string | null): void => {
    lastSelectedIcao24.value = icao24
  }

  return {
    selected,
    hovered,
    lastSelectedIcao24,
    clearHovered,
    setHovered,
    clearSelected,
    setSelected,
    clearLastSelectedIcao24,
    setLastSelectedIcao24,
  }
})
