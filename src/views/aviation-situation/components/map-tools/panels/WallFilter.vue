<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { FormInstance } from 'element-plus'
import { useWallStore } from '@/stores/wall'
import type { MatchedWall } from '@/views/aviation-situation/types/wall'
import AircraftIcaoPopover
  from '@/views/aviation-situation/components/map-tools/panels/draw-tool/tables/spatial-selection/popover/AircraftIcaoPopover.vue'
import {
  getWallLevelLabel,
  getWallVisualStyleLabel,
  wallCountryTreeData,
  wallLevelOptions,
  wallVisualStyleOptions,
} from '@/views/aviation-situation/constants/wall-filter-data'
import type { WallLevel } from '@/network/wall/type'
import { emitCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import { useRegionSelectionStore } from '@/stores/region-selection'

const WALL_LEVEL_TAG_TYPE: Record<
  WallLevel,
  'danger' | 'warning' | 'success'
> = {
  danger: 'danger',
  warning: 'warning',
  normal: 'success',
}

const wallStore = useWallStore()
const regionSelectionStore = useRegionSelectionStore()
const wallFilterFormRef = ref<FormInstance>()

const currentPage = ref(1)
const pageSize = ref(10)

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return wallStore.matchedWalls.slice(start, start + pageSize.value)
})

const handlePageChange = (page: number) => {
  currentPage.value = page
}
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

watch(
  () => {
    const selected = regionSelectionStore.selected
    if (!selected || selected.sourceType !== 'wall') return null
    return selected.id
  },
  (id) => {
    if (id == null) return
    const index = wallStore.matchedWalls.findIndex((row) => row.wall.id === id)
    if (index === -1) return
    currentPage.value = Math.floor(index / pageSize.value) + 1
  },
  { immediate: true },
)

const rowClassName = ({ row }: { row: MatchedWall }): string => {
  const selected = regionSelectionStore.selected
  if (selected?.sourceType === 'wall' && selected.id === row.wall.id) {
    return 'is-selected-row'
  }
  return ''
}

const resetWallForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
  wallStore.resetWallFilterForm()
}

const onDetail = (row: MatchedWall) => {
  emitCesiumEvent('wallTableOperationClicked', {
    operationType: 'detail',
    id: row.wall.id,
  })
}

const getRowKey = (row: MatchedWall) => row.wall.id
</script>

<template>
  <div class="wall-panel">
    <el-form
      :model="wallStore.wallFilterForm"
      :inline="true"
      size="default"
      ref="wallFilterFormRef"
      label-width="70px"
    >
      <el-form-item label="围栏id" prop="id">
        <el-input v-model="wallStore.wallFilterForm.id" clearable />
      </el-form-item>
      <el-form-item label="围栏名称" prop="name">
        <el-input v-model="wallStore.wallFilterForm.name" clearable />
      </el-form-item>
      <el-form-item label="视觉样式" prop="visualStyles" label-width="75px">
        <el-select
          v-model="wallStore.wallFilterForm.visualStyles"
          multiple
          collapse-tags
          collapse-tags-tooltip
          style="width: 200px"
        >
          <el-option
            v-for="option in wallVisualStyleOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="所属国家" prop="countries">
        <el-tree-select
          clearable
          v-model="wallStore.wallFilterForm.countries"
          :data="wallCountryTreeData"
          multiple
          collapse-tags
          collapse-tags-tooltip
          :max-collapse-tags="2"
          :render-after-expand="false"
          show-checkbox
          style="width: 300px"
        />
      </el-form-item>
      <el-form-item label="等级" prop="levels">
        <el-select
          v-model="wallStore.wallFilterForm.levels"
          multiple
          collapse-tags
          collapse-tags-tooltip
          style="width: 200px"
        >
          <el-option
            v-for="option in wallLevelOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="显示电子围栏" prop="visible" label-width="95px">
        <el-checkbox v-model="wallStore.wallFilterForm.visible" />
      </el-form-item>
      <el-form-item>
        <el-button @click="resetWallForm(wallFilterFormRef)">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table
      :data="pagedData"
      border
      stripe
      size="small"
      style="width: 100%"
      :row-key="getRowKey"
      :row-class-name="rowClassName"
    >
      <el-table-column prop="wall.id" label="id" />
      <el-table-column prop="wall.name" label="名称" />
      <el-table-column label="视觉样式" width="100">
        <template #default="{ row }">
          {{ getWallVisualStyleLabel(row.wall.visualStyle) }}
        </template>
      </el-table-column>
      <el-table-column label="最低高度" width="90">
        <template #default="{ row }">
          {{ row.wall.minAltitude }} m
        </template>
      </el-table-column>
      <el-table-column label="最高高度" width="90">
        <template #default="{ row }">
          {{ row.wall.maxAltitude }} m
        </template>
      </el-table-column>
      <el-table-column prop="wall.country" label="国家" />
      <el-table-column label="等级" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="WALL_LEVEL_TAG_TYPE[row.wall.level as WallLevel]" size="small">
            {{ getWallLevelLabel(row.wall.level) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="飞机数" width="80" align="center">
        <template #default="{ row }">
          {{ row.aircraft.aircraftMap.size }}
        </template>
      </el-table-column>
      <el-table-column label="飞机 icao24" width="250" align="center">
        <template #default="{ row }">
          <AircraftIcaoPopover :aircraft-map="row.aircraft.aircraftMap" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="onDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      class="pager"
      :page-sizes="[10, 20, 50, 100]"
      :total="wallStore.matchedWalls.length"
      layout="total, sizes, prev, pager, next, jumper"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/css/pager.scss';
@use '@/assets/css/filter-table-selected-row.scss' as *;

.wall-panel {
  :deep(.is-selected-row td.el-table__cell) {
    @include filter-table-selected-row-cells;
  }
}
</style>
