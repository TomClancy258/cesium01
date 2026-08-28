<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { FormInstance } from 'element-plus'
import { useRadarStore } from '@/stores/radar'
import type { MatchedRadar } from '@/views/aviation-situation/types/radar'
import AircraftIcaoPopover
  from '@/views/aviation-situation/components/map-tools/panels/draw-tool/tables/spatial-selection/popover/AircraftIcaoPopover.vue'
import {
  radarCountryTreeData,
  radarDetectAircraftOptions,
} from '@/views/aviation-situation/constants/radar-filter-data'
import { formatFixed4 } from '@/views/aviation-situation/utils/format-detail-value'
import { emitCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import { useRegionSelectionStore } from '@/stores/region-selection'

const radarStore = useRadarStore()
const regionSelectionStore = useRegionSelectionStore()
const radarFilterFormRef = ref<FormInstance>()

const currentPage = ref(1)
const pageSize = ref(10)

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return radarStore.matchedRadars.slice(start, start + pageSize.value)
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
    if (!selected || selected.sourceType !== 'radar') return null
    return selected.id
  },
  (id) => {
    if (id == null) return
    const index = radarStore.matchedRadars.findIndex((row) => row.radar.id === id)
    if (index === -1) return
    currentPage.value = Math.floor(index / pageSize.value) + 1
  },
  { immediate: true },
)

const rowClassName = ({ row }: { row: MatchedRadar }): string => {
  const selected = regionSelectionStore.selected
  if (selected?.sourceType === 'radar' && selected.id === row.radar.id) {
    return 'is-selected-row'
  }
  return ''
}

const resetRadarForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
  radarStore.resetRadarFilterForm()
}

const onDetail = (row: MatchedRadar) => {
  emitCesiumEvent('radarTableOperationClicked', {
    operationType: 'detail',
    id: row.radar.id,
  })
}

const getRowKey = (row: MatchedRadar) => row.radar.id

const formatRadiusKm = (meters: number): string => {
  if (typeof meters !== 'number' || Number.isNaN(meters)) return '--'
  return `${(meters / 1000).toFixed(1)} km`
}
</script>

<template>
  <div class="radar-panel">
    <el-form
      :model="radarStore.radarFilterForm"
      :inline="true"
      size="default"
      ref="radarFilterFormRef"
      label-width="100px"
    >
      <el-form-item label="雷达id" prop="id">
        <el-input v-model="radarStore.radarFilterForm.id" clearable />
      </el-form-item>
      <el-form-item label="雷达名称" prop="name">
        <el-input v-model="radarStore.radarFilterForm.name" clearable />
      </el-form-item>
      <el-form-item label="所属国家" prop="countries">
        <el-tree-select
          clearable
          v-model="radarStore.radarFilterForm.countries"
          :data="radarCountryTreeData"
          multiple
          collapse-tags
          collapse-tags-tooltip
          :max-collapse-tags="2"
          :render-after-expand="false"
          show-checkbox
          style="width: 240px"
        />
      </el-form-item>
      <el-form-item label="可探测飞机" prop="detectAircraft">
        <el-select
          v-model="radarStore.radarFilterForm.detectAircraft"
          style="width: 160px"
        >
          <el-option
            v-for="option in radarDetectAircraftOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="显示雷达" prop="visible">
        <el-checkbox v-model="radarStore.radarFilterForm.visible" />
      </el-form-item>
      <el-form-item>
        <el-button @click="resetRadarForm(radarFilterFormRef)">重置</el-button>
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
      <el-table-column prop="radar.id" label="id" min-width="110" />
      <el-table-column prop="radar.name" label="名称" min-width="140" />
      <el-table-column prop="radar.country" label="国家" width="100" />
      <el-table-column label="经度" width="100">
        <template #default="{ row }">
          {{ formatFixed4(row.radar.center.longitude) }}
        </template>
      </el-table-column>
      <el-table-column label="纬度" width="100">
        <template #default="{ row }">
          {{ formatFixed4(row.radar.center.latitude) }}
        </template>
      </el-table-column>
      <el-table-column label="高度" width="90">
        <template #default="{ row }">
          {{ formatFixed4(row.radar.center.height) }} m
        </template>
      </el-table-column>
      <el-table-column label="半径" width="90">
        <template #default="{ row }">
          {{ formatRadiusKm(row.radar.radiusMeters) }}
        </template>
      </el-table-column>
      <el-table-column label="可探测" width="100" align="center">
        <template #default="{ row }">
          <el-tag
            :type="row.radar.detectAircraft ? 'success' : 'info'"
            size="small"
          >
            {{ row.radar.detectAircraft ? '可探测' : '不可探测' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="飞机数" width="80px" align="center">
        <template #default="{ row }">
          {{ row.aircraft.aircraftMap.size }}
        </template>
      </el-table-column>
      <el-table-column label="飞机 icao24" width="200px" align="center">
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
      :total="radarStore.matchedRadars.length"
      layout="total, sizes, prev, pager, next, jumper"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/css/pager.scss';
.radar-panel {
  :deep(.is-selected-row) {
    td.el-table__cell {
      background-color: rgba(34, 211, 238, 0.18) !important;
    }
  }
}
</style>
