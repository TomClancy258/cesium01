<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDistanceMeasurementStore } from '@/stores/distanceMeasurement'
import { storeToRefs } from 'pinia'
import { emitCesiumEvent } from '@/views/aviation-situation/composables/mittBus'

const distanceMeasurementStore = useDistanceMeasurementStore()
const { finishedGraphicsArray } = storeToRefs(distanceMeasurementStore)

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const pageSizes = [5, 10, 20, 50]

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return finishedGraphicsArray.value.slice(start, start + pageSize.value)
})

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}
const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

// sourceType 映射
const sourceTypeMap: Record<string, string> = {
  distanceMeasurement: '距离测绘',
}

// 坐标点格式化（lngLatAltArray 是平铺数组 [lng, lat, alt, lng, lat, alt, ...]）
const getLngLatAltPoints = (row: any): { lng: number; lat: number; alt: number }[] => {
  const arr: number[] = row.polylineState?.lngLatAltArray ?? []
  const points: { lng: number; lat: number; alt: number }[] = []
  for (let i = 0; i < arr.length; i += 3) {
    points.push({ lng: arr[i], lat: arr[i + 1], alt: arr[i + 2] })
  }
  return points
}

// 分段距离列表
const getSegmentDistances = (row: any): number[] => {
  return row.segmentDistancesState?.distances ?? []
}

// 格式化距离
const formatDistance = (meter: number): string => {
  if (meter == null) return '—'
  return meter >= 1000
    ? `${(meter / 1000).toFixed(2)} km`
    : `${meter.toFixed(0)} m`
}

// 删除
const handleDelete = (row: any) => {
  distanceMeasurementStore.removeFinishedSelection(row.dataSourceName)
  emitCesiumEvent('spatialSelectionTableOperationClicked', {
    type: 'delete',
    dataSourceName: row.dataSourceName,
    sourceType: row.sourceType,
  })
}

// 查看（飞到质心）
const handleView = (row: any) => {
  emitCesiumEvent('spatialSelectionTableOperationClicked', {
    type: 'detail',
    centroidLngLatAlt: row.centroidLngLatAlt,
  })
}
</script>

<template>
  <div class="distance-measurement-table">
    <el-table
      :data="pagedData"
      border
      stripe
      style="width: 100%"
      row-key="dataSourceName"
    >
      <!-- 类型 -->
      <el-table-column label="类型" prop="sourceType" align="center" width="100">
        <template #default="{ row }">
          {{ sourceTypeMap[row.sourceType] ?? row.sourceType }}
        </template>
      </el-table-column>

      <!-- 总距离 -->
      <el-table-column label="总距离" align="center">
        <template #default="{ row }">
          {{ row.label?.distanceInfo?.formattedPerimeterStr ?? '—' }}
        </template>
      </el-table-column>

      <!-- 点数 -->
      <el-table-column label="点数" align="center" width="70">
        <template #default="{ row }">
          {{ row.polylineState?.pointCount ?? '—' }}
        </template>
      </el-table-column>

      <!-- 路径坐标 el-popover -->
      <el-table-column label="路径坐标" align="center">
        <template #default="{ row }">
          <template v-if="getLngLatAltPoints(row).length === 0">—</template>
          <template v-else>
            <el-popover
              placement="top"
              :width="320"
              trigger="hover"
              popper-class="distance-popover"
            >
              <template #reference>
                <el-tag type="info" size="small" style="cursor: default">
                  {{ getLngLatAltPoints(row).length }} 个点
                </el-tag>
              </template>
              <div class="popover-title">
                路径坐标（{{ getLngLatAltPoints(row).length }} 个点）
              </div>
              <div class="popover-list">
                <div
                  v-for="(pt, idx) in getLngLatAltPoints(row)"
                  :key="idx"
                  class="popover-item"
                >
                  <span class="popover-index">{{ idx + 1 }}</span>
                  <span class="popover-value">
                    {{ pt.lng.toFixed(4) }}, {{ pt.lat.toFixed(4) }}, {{ pt.alt.toFixed(1) }}
                  </span>
                </div>
              </div>
            </el-popover>
          </template>
        </template>
      </el-table-column>

      <!-- 分段距离 el-popover -->
      <el-table-column label="分段距离" align="center">
        <template #default="{ row }">
          <template v-if="getSegmentDistances(row).length === 0">—</template>
          <template v-else>
            <el-popover
              placement="top"
              :width="260"
              trigger="hover"
              popper-class="distance-popover"
            >
              <template #reference>
                <el-tag type="warning" size="small" style="cursor: default">
                  {{ getSegmentDistances(row).length }} 段
                </el-tag>
              </template>
              <div class="popover-title">
                分段距离（{{ getSegmentDistances(row).length }} 段）
              </div>
              <div class="popover-list">
                <div
                  v-for="(dist, idx) in getSegmentDistances(row)"
                  :key="idx"
                  class="popover-item"
                >
                  <span class="popover-index">第 {{ idx + 1 }} 段</span>
                  <span class="popover-value">{{ formatDistance(dist) }}</span>
                </div>
              </div>
            </el-popover>
          </template>
        </template>
      </el-table-column>

      <!-- 操作 -->
      <el-table-column label="操作" width="120" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
          <el-popconfirm
            title="确认删除该测绘记录？"
            confirm-button-text="删除"
            cancel-button-text="取消"
            @confirm="handleDelete(row)"
          >
            <template #reference>
              <el-button type="danger" link size="small">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="pageSizes"
        :total="finishedGraphicsArray.length"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.distance-measurement-table {
  width: 100%;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>

<!-- 全局样式，放到全局 scss 或 App.vue 的非 scoped style 中 -->
<style lang="scss">
.distance-popover {
  .popover-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .popover-list {
    max-height: 200px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .popover-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    line-height: 1.6;
  }

  .popover-index {
    min-width: 40px;
    color: var(--el-text-color-secondary);
    font-size: 11px;
  }

  .popover-value {
    color: var(--el-text-color-primary);
    word-break: break-all;
  }
}
</style>
