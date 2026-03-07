// stores/measurementSelection.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MeasurementSelectedData } from '@/views/aviation-situation/types/shared'

export const useMeasurementSelectionStore = defineStore('measurementSelectionStore', () => {
  const selected = ref<MeasurementSelectedData|null>(null)

  // ========== 选中相关 ==========
  const clearSelected = (): void => {
    selected.value = null
  }

  const setSelected = (
    data: MeasurementSelectedData = null
  ): void => {
    selected.value = data
  }


  return {
    // 响应式状态
    selected,
    // 方法
    clearSelected,
    setSelected,
  }
})
