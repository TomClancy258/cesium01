import { computed, ref, watch, type Ref } from 'vue'
import { useStationEquipmentStore } from '@/stores/station-equipment'
import type { EquipmentSource } from '../types/station-equipment'

/** 分页 + 场景选中行翻页/高亮（各设备筛选面板共用） */
export function useEquipmentTablePage<T extends { name: string }>(
  source: EquipmentSource,
  filteredRows: Ref<T[]>,
) {
  const store = useStationEquipmentStore()
  const currentPage = ref(1)
  const pageSize = ref(10)

  const pagedData = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return filteredRows.value.slice(start, start + pageSize.value)
  })

  /** 仅在选中身份变化时翻页；WS 刷新 filteredRows 不抢用户当前页 */
  watch(
    () => {
      const selected = store.selected
      if (!selected || selected.source !== source) return null
      return `${selected.source}:${selected.name}`
    },
    (key) => {
      if (!key) return
      const selected = store.selected
      if (!selected) return
      const index = filteredRows.value.findIndex((row) => row.name === selected.name)
      if (index < 0) return
      currentPage.value = Math.floor(index / pageSize.value) + 1
    },
    { immediate: true },
  )

  const rowClassName = ({ row }: { row: T }): string => {
    if (store.selected?.source === source && store.selected.name === row.name) {
      return 'is-selected-row'
    }
    return ''
  }

  const resetToFirstPage = (): void => {
    currentPage.value = 1
  }

  return {
    store,
    currentPage,
    pageSize,
    pagedData,
    rowClassName,
    resetToFirstPage,
  }
}
