import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RegionSelectedData } from '@/views/aviation-situation/types/region-selection'

/** 区域轨选中：测绘框选 / 测距 / 管控区（底部 MapToolsDrawer） */
export const useRegionSelectionStore = defineStore('regionSelection', () => {
  const selected = ref<RegionSelectedData | null>(null)

  const clearSelected = (): void => {
    selected.value = null
  }

  const setSelected = (data: RegionSelectedData | null = null): void => {
    selected.value = data
  }

  return {
    selected,
    clearSelected,
    setSelected,
  }
})
