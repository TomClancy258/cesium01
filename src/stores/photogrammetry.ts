import { defineStore } from 'pinia'
import { reactive, shallowRef, computed, triggerRef } from 'vue'
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

    matchedPhotogrammetryMap,
    matchedPhotogrammetrys,
    clearMatchedPhotogrammetrys,
    setMatchedPhotogrammetry,
    commitMatchedPhotogrammetrys,
  }
})
