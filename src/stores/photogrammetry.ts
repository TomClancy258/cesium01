import { defineStore } from 'pinia'
import { reactive, ref, shallowRef, computed, triggerRef } from 'vue'
import type{
  PhotogrammetryFilterForm,
  MatchedPhotogrammetry,
} from '@/views/aviation-situation/types/photogrammetry'

export const usePhotogrammetryStore = defineStore('usePhotogrammetryStore', () => {

  // 仅存储筛选表单数据
  const photogrammetryFilterForm = reactive<PhotogrammetryFilterForm>({
    id: '',
    name: '',
    visible: true,
    // visible: false,
  })

  /** 切换倾斜摄影模型中，用于互斥与 table / 来源 select loading */
  const isLoadingPhotogrammetry = ref(false)

  const setIsLoadingPhotogrammetry = (loading: boolean) => {
    isLoadingPhotogrammetry.value = loading
  }

  const matchedPhotogrammetryMap = shallowRef<Map<number, MatchedPhotogrammetry>>(new Map())
  const matchedPhotogrammetrys = computed(() => [...matchedPhotogrammetryMap.value.values()])

  const clearMatchedPhotogrammetrys = () => {
    matchedPhotogrammetryMap.value.clear()
  }

  const setMatchedPhotogrammetry = (photogrammetry: MatchedPhotogrammetry) => {
    matchedPhotogrammetryMap.value.set(photogrammetry.id, photogrammetry)
  }
  const commitMatchedPhotogrammetrys = () => {
    triggerRef(matchedPhotogrammetryMap)
  }

  // 仅提供数据重置方法（纯数据操作）
  const resetPhotogrammetryFilterForm = () => {
    photogrammetryFilterForm.id = ''
    photogrammetryFilterForm.name = ''
    photogrammetryFilterForm.visible = true
  }

  return {
    photogrammetryFilterForm,
    resetPhotogrammetryFilterForm,
    isLoadingPhotogrammetry,
    setIsLoadingPhotogrammetry,

    matchedPhotogrammetryMap,
    matchedPhotogrammetrys,
    clearMatchedPhotogrammetrys,
    setMatchedPhotogrammetry,
    commitMatchedPhotogrammetrys,
  }
})
