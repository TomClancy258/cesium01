//spatialSelect.ts
import { defineStore } from 'pinia'
import { reactive } from 'vue'

// 定义筛选表单类型
export interface SpatialSelectForm {
  operationType: string,
  spatialSelectionSubtype: string,
  spatialSelectionTarget: string,
}

export const useSpatialSelectStore = defineStore('spatialSelect', () => {
  // 仅存储筛选表单数据
  const spatialSelectForm = reactive<SpatialSelectForm>({
    operationType: 'none',
    spatialSelectionSubtype: 'none',
    spatialSelectionTarget: 'measurement',
  })

  const spatialSelection=reactive({
    active:{
      aircraftNum:0,
      airportNum:0
    }
  })

  // 仅提供数据重置方法（纯数据操作）
  const resetAirportFilterForm = () => {
    spatialSelectForm.operationType = 'none'
    spatialSelectForm.spatialSelectionSubtype = 'none'
    spatialSelectForm.spatialSelectionTarget = 'measurement'
  }

  const setOperationType = (type: string) => {
    // 可以在这里加一些逻辑，比如如果 type 是 'none'，自动清空其他子类型
    // if (type === 'none') {
    //   spatialSelectForm.spatialSelectionSubtype = 'none'
    //   spatialSelectForm.spatialSelectionTarget = 'all'
    // }
    spatialSelectForm.operationType = type
  }
  const setSpatialSelectionSubtype = (type: string) => {
    spatialSelectForm.spatialSelectionSubtype = type
  }

  const setActiveAircraftNum = (num: number) => {
    spatialSelection.active.aircraftNum = num
  }

  const setActiveAirportNum = (num: number) => {
    spatialSelection.active.airportNum = num
  }

  return {
    spatialSelectForm,
    spatialSelection,
    setOperationType,
    setSpatialSelectionSubtype,
    resetAirportFilterForm,
    setActiveAircraftNum,
    setActiveAirportNum,
  }
})
