//spatialSelect.ts
import { defineStore } from 'pinia'
import { reactive } from 'vue'

// 定义筛选表单类型
export interface SpatialSelectForm {
  operationType: string,
  boxSelectionSubtype: string,
  boxSelectionTarget: string,
}

export const useSpatialSelectStore = defineStore('spatialSelect', () => {
  // 仅存储筛选表单数据
  const spatialSelectForm = reactive<SpatialSelectForm>({
    operationType: 'none',
    boxSelectionSubtype: 'none',
    boxSelectionTarget: 'all',
  })

  // 仅提供数据重置方法（纯数据操作）
  const resetAirportFilterForm = () => {
    spatialSelectForm.operationType = 'none'
    spatialSelectForm.boxSelectionSubtype = 'none'
    spatialSelectForm.boxSelectionTarget = 'all'
  }

  const setOperationType = (type: string) => {
    // 可以在这里加一些逻辑，比如如果 type 是 'none'，自动清空其他子类型
    // if (type === 'none') {
    //   spatialSelectForm.boxSelectionSubtype = 'none'
    //   spatialSelectForm.boxSelectionTarget = 'all'
    // }
    spatialSelectForm.operationType = type
  }
  const setBoxSelectionSubtype = (type: string) => {
    spatialSelectForm.boxSelectionSubtype = type
  }

  return {
    spatialSelectForm,
    setOperationType,
    setBoxSelectionSubtype,
    resetAirportFilterForm
  }
})
