// stores/measurementSelection.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MeasurementSelectedData,DrawingDataSource } from '@/views/aviation-situation/types/shared'

export const useMeasurementSelectionStore = defineStore('measurementSelectionStore', () => {
  const selected = ref<MeasurementSelectedData|null>(null)

  const drawingDataSource=ref<DrawingDataSource|null>(null)

  const clearDrawingDataSource = (): void => {
    drawingDataSource.value = null
  }

  const setDrawingDataSource = (
    data: MeasurementSelectedData = null
  ): void => {
    drawingDataSource.value = data
  }

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
    drawingDataSource,
    // 方法
    clearSelected,
    setSelected,
    clearDrawingDataSource,
    setDrawingDataSource,
  }
})
