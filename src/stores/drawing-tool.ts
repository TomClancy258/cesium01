// stores/drawing-tool.ts
import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import type { DrawingDataSource } from '@/views/aviation-situation/types/shared'
export interface DrawingToolForm {
  operationType: string,
  spatialSelectionSubtype: string,
  spatialSelectionTarget: string,
}

export const useDrawingToolStore = defineStore('drawingToolStore', () => {
  // 仅存储筛选表单数据
  const drawingToolForm = reactive<DrawingToolForm>({
    operationType: 'none',
    spatialSelectionSubtype: 'none',
    spatialSelectionTarget: 'measurement',
  })

  const drawingDataSource=ref<DrawingDataSource|null>(null)

  // 仅提供数据重置方法（纯数据操作）
  const resetSpatialSelectFilterForm = () => {
    drawingToolForm.operationType = 'none'
    drawingToolForm.spatialSelectionSubtype = 'none'
    drawingToolForm.spatialSelectionTarget = 'measurement'
  }

  const setOperationType = (type: string) => {
    // 可以在这里加一些逻辑，比如如果 type 是 'none'，自动清空其他子类型
    // if (type === 'none') {
    //   drawingToolForm.spatialSelectionSubtype = 'none'
    //   drawingToolForm.spatialSelectionTarget = 'all'
    // }
    drawingToolForm.operationType = type
  }
  const setSpatialSelectionSubtype = (type: string) => {
    drawingToolForm.spatialSelectionSubtype = type
  }

  const clearDrawingDataSource = (): void => {
    drawingDataSource.value = null
  }

  const setDrawingDataSource = (
    data: DrawingDataSource | null = null
  ): void => {
    drawingDataSource.value = data
  }

  return {
    // 响应式状态
    drawingToolForm,
    drawingDataSource,
    // 方法
    setOperationType,
    setSpatialSelectionSubtype,
    resetSpatialSelectFilterForm,

    clearDrawingDataSource,
    setDrawingDataSource,
  }
})
