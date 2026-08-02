<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useStationEquipmentStore } from '@/stores/station-equipment'
import { useEquipmentTablePage } from '../../composables/useEquipmentTablePage'
import type { EquipmentStatus, HouseRow } from '../../types/station-equipment'
import {
  STATUS_FILTER_OPTIONS,
  STATUS_LABEL,
  STATUS_TAG_TYPE,
} from '../../types/station-equipment'

const emit = defineEmits<{
  detail: [row: HouseRow]
}>()

const store = useStationEquipmentStore()

const createEmptyForm = () => ({
  name: '',
  text: '',
  status: [] as EquipmentStatus[],
  remark: '',
})

const filterForm = reactive(createEmptyForm())
const appliedFilter = ref(createEmptyForm())

const sourceRows = computed(() => Array.from(store.houserMap.values()))

const filteredRows = computed(() => {
  const f = appliedFilter.value
  return sourceRows.value.filter((row) => {
    if (f.name && !row.name.toLowerCase().includes(f.name.trim().toLowerCase())) return false
    if (f.text && !row.text.toLowerCase().includes(f.text.trim().toLowerCase())) return false
    if (f.status.length > 0 && !f.status.includes(row.status)) return false
    if (
      f.remark &&
      !String(row.remark ?? '')
        .toLowerCase()
        .includes(f.remark.trim().toLowerCase())
    ) {
      return false
    }
    return true
  })
})

const { currentPage, pageSize, pagedData, rowClassName, resetToFirstPage } =
  useEquipmentTablePage('house', filteredRows)

const applyFilterNow = (): void => {
  appliedFilter.value = { ...filterForm, status: [...filterForm.status] }
  resetToFirstPage()
}
const debouncedApplyFilter = useDebounceFn(applyFilterNow, 300)
watch(filterForm, () => debouncedApplyFilter(), { deep: true })

const resetFilter = (): void => {
  Object.assign(filterForm, createEmptyForm())
  applyFilterNow()
}
</script>

<template>
  <div class="equipment-panel">
    <el-form :inline="true" size="default" label-width="68px" class="filter-form">
      <el-form-item label="编号">
        <el-input v-model="filterForm.name" clearable style="width: 140px" />
      </el-form-item>
      <el-form-item label="名称">
        <el-input v-model="filterForm.text" clearable style="width: 140px" />
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
      <el-form-item label="备注">
        <el-input v-model="filterForm.remark" clearable style="width: 140px" />
      </el-form-item>
      <el-form-item>
        <el-button @click="resetFilter">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table
      :data="pagedData"
      border
      stripe
      size="small"
      style="width: 100%"
      :row-class-name="rowClassName"
      row-key="name"
    >
      <el-table-column prop="name" label="编号" />
      <el-table-column prop="text" label="名称" />
      <el-table-column prop="remark" label="备注" />
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="STATUS_TAG_TYPE[row.status]" size="small">
            {{ STATUS_LABEL[row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="80">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="emit('detail', row)">
            详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      class="pager"
      :page-sizes="[10, 20, 50]"
      :total="filteredRows.length"
      layout="total, sizes, prev, pager, next"
    />
  </div>
</template>

<style scoped lang="scss">
@use './equipment-panel.scss';
</style>
