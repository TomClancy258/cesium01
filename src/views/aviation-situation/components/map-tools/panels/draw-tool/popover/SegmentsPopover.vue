<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatDistance } from '@/utils/geoUtils'
import { emitCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import type { SegmentResult } from '@/views/aviation-situation/composables/cesium-events/event-handlers/spatial-selection/shared/spatial-selection-label-utils'
import type { LngLatAlt } from '@/views/aviation-situation/types/shared'

const props = defineProps<{
  segments?: SegmentResult[]
  dataSourceName?: string
  sourceType?: string
}>()

const currentPage = ref(1)
const pageSize = ref(10)
const tableKey = ref(0)

const onShow = () => {
  currentPage.value = 1
  tableKey.value++
}

const paged = computed(() =>
  (props.segments ?? []).slice(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value,
  ),
)

const formatPoint = (pt: LngLatAlt) =>{
  return `${pt.longitude.toFixed(4)}°, ${pt.latitude.toFixed(4)}°, ${pt.height.toFixed(1)}m`
}

const handleView = (row: SegmentResult) => {
  emitCesiumEvent('spatialSelectionTableOperationClicked', {
    operationType: 'detail',
    centroidLngLatAlt: row.midLngLatAlt,
    dataSourceName: props.dataSourceName,
    sourceType: props.sourceType,
  })
}
</script>

<template>
  <template v-if="!segments?.length">—</template>
  <template v-else>
    <el-popover
      placement="top"
      width="40%"
      trigger="hover"
      popper-class="segments-popover"
      @show="onShow"
    >
      <template #reference>
        <el-tag type="info" size="small" style="cursor: default">
          {{ segments.length }} 段
        </el-tag>
      </template>

      <div class="popover-title">路径分段（{{ segments.length }} 段）</div>
      <el-table :key="tableKey" :data="paged" size="small" border style="width: 100%">
        <el-table-column label="#" width="45" align="center">
          <template #default="{ $index }">
            {{ (currentPage - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="起点">
          <template #default="{ row }">{{ formatPoint(row.startLngLatAlt) }}</template>
        </el-table-column>
        <el-table-column label="终点">
          <template #default="{ row }">{{ formatPoint(row.endLngLatAlt) }}</template>
        </el-table-column>
        <el-table-column label="距离" width="100" align="center">
          <template #default="{ row }">{{ formatDistance(row.distance) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="70" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="segments.length"
        layout="prev, pager, next, jumper"
        size="small"
        background
        style="margin-top: 8px; justify-content: flex-end"
      />
    </el-popover>
  </template>
</template>

<style lang="scss">
.segments-popover {
  .popover-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
}
</style>
