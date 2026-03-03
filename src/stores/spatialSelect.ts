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
    boxSelectionSubtype: '',
    boxSelectionTarget: '',
  })

  // 仅提供数据重置方法（纯数据操作）
  const resetAirportFilterForm = () => {
    spatialSelectForm.operationType = 'none'
    spatialSelectForm.boxSelectionSubtype = ''
    spatialSelectForm.boxSelectionTarget = ''
  }

  return {
    spatialSelectForm,
    resetAirportFilterForm
  }
})
