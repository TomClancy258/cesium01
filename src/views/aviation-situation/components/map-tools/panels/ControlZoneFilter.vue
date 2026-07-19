<script setup lang="ts">
//src/views/aviation-situation/components/map-tools/panels/ControlZoneFilter.vue
import { ref, computed, watch, nextTick } from 'vue'
import type { FormInstance, TableInstance } from 'element-plus'
import { useControlZoneStore } from '@/stores/control-zone'
import type { ControlZoneProperties } from '@/network/control-zone/type.ts'
import AircraftIcaoPopover
  from '@/views/aviation-situation/components/map-tools/panels/draw-tool/tables/spatial-selection/popover/AircraftIcaoPopover.vue'
import {
  allControlZoneLevelValues,
  controlZoneLevelOptions,
  getControlZoneLevelLabel,
} from '@/views/aviation-situation/constants/control-zone-filter-data'
import { formatFixed4 } from '../../../utils/format-detail-value'
import type { ControlZoneLevel } from '@/network/control-zone/type'
import { emitCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import { useRegionSelectionStore } from '@/stores/region-selection'

const CONTROL_ZONE_LEVEL_TAG_TYPE: Record<
  ControlZoneLevel,
  'danger' | 'warning' | 'primary' | 'success'
> = {
  danger: 'danger',
  warning: 'warning',
  info: 'primary',
  normal: 'success',
}

const controlZoneStore = useControlZoneStore()
const regionSelectionStore = useRegionSelectionStore()
const controlZoneFilterFormRef = ref<FormInstance>()

// ========== 表格与分页 ==========
const tableRef = ref<TableInstance>()

const currentPage = ref(1)
const pageSize = ref(10)

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return controlZoneStore.matchedControlZones.slice(start, start + pageSize.value)
})

const handlePageChange = (page: number) => {
  currentPage.value = page
}
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

// ========== 表单操作 ==========
const resetControlZoneForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
}

const onDetail = (row: ControlZoneProperties) => {
  emitCesiumEvent('controlZoneTableOperationClicked',{
    operationType:'detail',
    id:row.id
  })
}

const isAllLevelsSelected = computed({
  get: () => {
    const { levels } = controlZoneStore.controlZoneFilterForm
    return levels.length > 0 && levels.length === allControlZoneLevelValues.length
  },
  set: (checked: boolean) => {
    controlZoneStore.toggleAllControlZoneFilterLevels(checked)
  },
})

const isTypesIndeterminate = computed(() => {
  const { levels } = controlZoneStore.controlZoneFilterForm
  return levels.length > 0 && levels.length < allControlZoneLevelValues.length
})

watch(
  () => regionSelectionStore.selected,
  async (selected) => {
    if (!selected || selected.sourceType !== 'controlZone') {
      tableRef.value?.setCurrentRow()
      return
    }
    const index = controlZoneStore.matchedControlZones.findIndex(
      (row) => row.id === selected.id,
    )
    if (index === -1) {
      tableRef.value?.setCurrentRow()
      return
    }
    currentPage.value = Math.floor(index / pageSize.value) + 1
    await nextTick()
    const row = pagedData.value[index % pageSize.value]
    if (!row || !tableRef.value) return
    tableRef.value.setCurrentRow(row)
    // MapToolsDrawer 可能同步切到本面板，再等一帧确保高亮生效
    await nextTick()
    tableRef.value.setCurrentRow(row)
  },
)
</script>

<template>
  <div>
    <!-- 筛选表单 -->
    <el-form
      :model="controlZoneStore.controlZoneFilterForm"
      :inline="true"
      size="default"
      ref="controlZoneFilterFormRef"
      label-width="100px"
    >
      <el-form-item label="管控区域id" prop="id">
        <el-input v-model="controlZoneStore.controlZoneFilterForm.id" clearable />
      </el-form-item>
      <el-form-item label="管控区域名称" prop="name">
        <el-input v-model="controlZoneStore.controlZoneFilterForm.name" clearable />
      </el-form-item>
      <el-form-item label="管控等级" prop="levels">
        <el-select
          v-model="controlZoneStore.controlZoneFilterForm.levels"
          multiple
          collapse-tags
          collapse-tags-tooltip
          :max-collapse-tags="2"
          clearable
          placeholder="全部等级"
          style="width: 240px"
        >
          <template #header>
            <el-checkbox
              v-model="isAllLevelsSelected"
              :indeterminate="isTypesIndeterminate"
            >
              全选
            </el-checkbox>
          </template>
          <el-option
            v-for="option in controlZoneLevelOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="显示管控区域" prop="visible">
        <el-checkbox v-model="controlZoneStore.controlZoneFilterForm.visible" />
      </el-form-item>
      <el-form-item>
        <el-button @click="resetControlZoneForm(controlZoneFilterFormRef)">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 飞机数据表格 -->
    <el-table
      ref="tableRef"
      :data="pagedData"
      border
      stripe
      size="small"
      style="width: 100%"
      row-key="id"
      highlight-current-row
    >
      <el-table-column prop="id" label="id" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="level" label="管控等级">
        <template #default="{ row }">
          <el-tag
            :type="CONTROL_ZONE_LEVEL_TAG_TYPE[row.level as ControlZoneLevel]"
            size="small"
          >
            {{ getControlZoneLevelLabel(row.level) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="最低高度">
        <template #default="{ row }">
          {{ formatFixed4(row.minAltitude) }} m
        </template>
      </el-table-column>
      <el-table-column label="最高高度">
        <template #default="{ row }">
          {{ formatFixed4(row.maxAltitude) }} m
        </template>
      </el-table-column>
      <!-- 飞机数量 -->
      <el-table-column label="飞机数" width="80px" align="center">
        <template #default="{ row }">
          {{ row.aircraft?.aircraftMap?.size ?? 0 }}
        </template>
      </el-table-column>

      <!-- 飞机 icao24 -->
      <el-table-column label="飞机 icao24" width="200px" align="center">
        <template #default="{ row }">
          <AircraftIcaoPopover :aircraft-map="row.aircraft?.aircraftMap" />
        </template>
      </el-table-column>

      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="onDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="controlZoneStore.matchedControlZones.length"
      layout="total, sizes, prev, pager, next, jumper"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
      style="margin-top: 8px"
    />
  </div>
</template>

<style scoped lang="scss"></style>
