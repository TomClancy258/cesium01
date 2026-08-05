<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useStationEquipmentStore } from '@/stores/station-equipment'
import { useEquipmentTablePage } from '../../../composables/useEquipmentTablePage'
import type { EquipmentStatus, MixingTankRow } from '../../../types/station-equipment'
import { STATUS_FILTER_OPTIONS, STATUS_LABEL } from '../../../types/station-equipment'
import EquipmentMetricChart, {
  type EquipmentMetricOption,
  type EquipmentMetricRow,
} from '../EquipmentMetricChart.vue'
import MixingTankTable from './MixingTankTable.vue'

const emit = defineEmits<{
  detail: [row: MixingTankRow]
}>()

const store = useStationEquipmentStore()

const createEmptyForm = () => ({
  name: '',
  text: '',
  status: [] as EquipmentStatus[],
  level: '',
  maxLevel: '',
  power: '',
  temperature: '',
})

const filterForm = reactive(createEmptyForm())
const appliedFilter = ref(createEmptyForm())
const activeTab = ref<'list' | 'chart'>('list')

type TableSortProp = 'level' | 'power' | 'temperature'
type SortOrder = 'ascending' | 'descending'
const tableSort = ref<{ prop: TableSortProp | null; order: SortOrder | null }>({
  prop: null,
  order: null,
})

const sourceRows = computed(() => Array.from(store.mixingTankMap.values()))

const filteredRows = computed(() => {
  const f = appliedFilter.value
  return sourceRows.value.filter((row) => {
    if (f.name && !row.name.toLowerCase().includes(f.name.trim().toLowerCase())) return false
    if (f.text && !row.text.toLowerCase().includes(f.text.trim().toLowerCase())) return false
    if (f.status.length > 0 && !f.status.includes(row.status)) return false
    if (f.level !== '' && !Number.isNaN(Number(f.level)) && row.level !== Number(f.level)) {
      return false
    }
    if (
      f.maxLevel !== '' &&
      !Number.isNaN(Number(f.maxLevel)) &&
      row.maxLevel !== Number(f.maxLevel)
    ) {
      return false
    }
    if (f.power !== '' && !Number.isNaN(Number(f.power)) && row.power !== Number(f.power)) {
      return false
    }
    if (
      f.temperature !== '' &&
      !Number.isNaN(Number(f.temperature)) &&
      row.temperature !== Number(f.temperature)
    ) {
      return false
    }
    return true
  })
})

const tableSortedRows = computed(() => {
  const rows = filteredRows.value
  const { prop, order } = tableSort.value
  if (!prop || !order) return rows
  const dir = order === 'ascending' ? 1 : -1
  return [...rows].sort((a, b) => (a[prop] - b[prop]) * dir)
})

const { currentPage, pageSize, pagedData, rowClassName, resetToFirstPage } =
  useEquipmentTablePage('mixingTank', tableSortedRows)

const chartMetrics: EquipmentMetricOption[] = [
  {
    key: 'level',
    label: '液位',
    yName: '液位',
    getValue: (row) => (row as MixingTankRow).level,
  },
  {
    key: 'power',
    label: '功率',
    yName: '功率',
    getValue: (row) => (row as MixingTankRow).power,
  },
  {
    key: 'temperature',
    label: '温度',
    yName: '温度',
    getValue: (row) => (row as MixingTankRow).temperature,
  },
]

const formatChartTooltip = (row: EquipmentMetricRow): string[] => {
  const r = row as MixingTankRow
  return [
    `液位：${r.level}`,
    `最高液位：${r.maxLevel}`,
    `功率：${r.power}`,
    `温度：${r.temperature}`,
    `状态：${STATUS_LABEL[r.status]}`,
  ]
}

const applyFilterNow = (): void => {
  appliedFilter.value = { ...filterForm, status: [...filterForm.status] }
  resetToFirstPage()
}
const debouncedApplyFilter = useDebounceFn(applyFilterNow, 300)
watch(filterForm, () => debouncedApplyFilter(), { deep: true })

const resetFilter = (): void => {
  Object.assign(filterForm, createEmptyForm())
  tableSort.value = { prop: null, order: null }
  applyFilterNow()
}

const onTableSortChange = (payload: {
  prop: string
  order: SortOrder | null
}): void => {
  const prop =
    payload.prop === 'level' ||
    payload.prop === 'power' ||
    payload.prop === 'temperature'
      ? payload.prop
      : null
  tableSort.value = { prop, order: prop ? payload.order : null }
  resetToFirstPage()
}

const onDetail = (row: MixingTankRow): void => {
  emit('detail', row)
}
</script>

<template>
  <div class="equipment-panel">
    <el-form :inline="true" size="default" label-width="40px" class="filter-form">
      <el-form-item label="编号">
        <el-input v-model="filterForm.name" clearable style="width: 105px" />
      </el-form-item>
      <el-form-item label="名称">
        <el-input v-model="filterForm.text" clearable style="width: 105px" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select
          v-model="filterForm.status"
          multiple
          collapse-tags
          collapse-tags-tooltip
          clearable
          placeholder="全部"
          style="width: 140px"
        >
          <el-option
            v-for="opt in STATUS_FILTER_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="液位">
        <el-input v-model="filterForm.level" clearable style="width: 105px" />
      </el-form-item>
      <el-form-item label="最高液位" label-width="68px">
        <el-input v-model="filterForm.maxLevel" clearable style="width: 105px" />
      </el-form-item>
      <el-form-item label="功率">
        <el-input v-model="filterForm.power" clearable style="width: 105px" />
      </el-form-item>
      <el-form-item label="温度">
        <el-input v-model="filterForm.temperature" clearable style="width: 105px" />
      </el-form-item>
      <el-form-item>
        <el-checkbox v-model="store.labelVisibleBySource.mixingTank">显示标签</el-checkbox>
      </el-form-item>
      <el-form-item>
        <el-button @click="resetFilter">重置</el-button>
      </el-form-item>
    </el-form>

    <el-tabs v-model="activeTab" class="view-tabs">
      <el-tab-pane label="列表" name="list">
        <MixingTankTable
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :data="pagedData"
          :total="tableSortedRows.length"
          :row-class-name="rowClassName"
          @sort-change="onTableSortChange"
          @detail="onDetail"
        />
      </el-tab-pane>

      <el-tab-pane label="图表" name="chart" lazy>
        <EquipmentMetricChart
          :rows="filteredRows"
          source="mixingTank"
          :metrics="chartMetrics"
          :format-tooltip="formatChartTooltip"
          @detail="onDetail"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
@use '../equipment-panel';

.view-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 8px;
  }

  :deep(.el-tabs__content) {
    overflow: visible;
  }
}
</style>
