<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSpatialSelectStore } from '@/stores/spatialSelect'
import { storeToRefs } from 'pinia'
import { emitCesiumEvent } from '@/views/aviation-situation/composables/mittBus'

const spatialSelectStore = useSpatialSelectStore()
const { finishedGraphicsArray } = storeToRefs(spatialSelectStore)

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
  polygonSpatialSelection: '多边形',
  circleSpatialSelection: '圆形',
  hemisphereSpatialSelection: '半球',
}
// spatialSelectionTarget 映射
const spatialSelectionTargetMap: Record<string, string> = {
  measurement: '仅测绘',
  aircraft: '仅飞机',
  airport: '仅机场',
  all: '全部',
}

// 坐标格式化
const formatCoord = (arr: number[] | undefined) => {
  if (!arr || arr.length === 0) return '—'
  return arr.map((v: number) => v.toFixed(4)).join(', ')
}

// 半径格式化
const formatRadius = (row: any) => {
  const r = row.label?.radiusInfo?.radius
  if (r == null) return '—'
  return r >= 1000 ? `${(r / 1000).toFixed(2)} km` : `${r.toFixed(0)} m`
}

// paths 格式化
const getPaths = (row: any): string[] => {
  return row.polygonState?.lngLatAltArray ?? []
}

// 删除
const handleDelete = (row: any) => {
  spatialSelectStore.removeFinishedSelection(row.dataSourceName)
  emitCesiumEvent('spatialSelectionTableOperationClicked',{
    type:'delete',
    dataSourceName:row.dataSourceName,
    sourceType:row.sourceType,
  })
}

// 查看（占位，按需实现）
const handleView = (row: any) => {
  console.log('查看', row)
  emitCesiumEvent('spatialSelectionTableOperationClicked',{
    centroidLngLatAlt:row.centroidLngLatAlt,
    type:'detail',
  })
}
</script>

<template>
  <div class="spatial-selection-table">
<!--    {{finishedGraphicsArray}}-->
    <el-table
      :data="pagedData"
      border
      stripe
      style="width: 100%"
      row-key="dataSourceName"
    >
      <!-- sourceType -->
      <el-table-column label="类型" prop="sourceType" align="center">
        <template #default="{ row }">
          {{ sourceTypeMap[row.sourceType] ?? row.sourceType }}
        </template>
      </el-table-column>
      <el-table-column label="目标" prop="spatialSelectionTarget" align="center">
        <template #default="{ row }">
          {{ spatialSelectionTargetMap[row.spatialSelectionTarget] ?? row.spatialSelectionTarget }}
        </template>
      </el-table-column>

      <!-- 半径 -->
      <el-table-column label="半径" align="center">
        <template #default="{ row }">
          {{ formatRadius(row) }}
        </template>
      </el-table-column>

      <!-- 圆心坐标 -->
      <el-table-column label="圆心坐标" align="center">
        <template #default="{ row }">
          <span v-if="row.centerLngLatAltArray?.length">
            {{ formatCoord(row.centerLngLatAltArray) }}
          </span>
          <span v-else>—</span>
        </template>
      </el-table-column>

      <!-- 周长 -->
      <el-table-column label="周长" align="center">
        <template #default="{ row }">
          {{ row.label?.perimeterInfo?.formattedPerimeterStr ?? '—' }}
        </template>
      </el-table-column>

      <!-- 面积 -->
      <el-table-column label="面积" align="center">
        <template #default="{ row }">
          {{ row.label?.areaInfo?.formattedAreaStr ?? '—' }}
        </template>
      </el-table-column>

      <!-- 路径 paths -->
      <el-table-column label="路径" align="center">
        <template #default="{ row }">
          <template v-if="getPaths(row).length === 0">—</template>
          <template v-else>
            <el-popover
              placement="top"
              :width="280"
              trigger="hover"
              popper-class="spatial-popover"
            >
              <template #reference>
                <el-tag type="info" size="small" style="cursor: default">
                  {{ getPaths(row).length }} 个点
                </el-tag>
              </template>
              <div class="popover-title">路径坐标（{{ getPaths(row).length }} 个点）</div>
              <div class="popover-list">
                <div
                  v-for="(pt, idx) in getPaths(row)"
                  :key="idx"
                  class="popover-item"
                >
                  <span class="popover-index">{{ idx + 1 }}</span>
                  <span class="popover-value">{{ Array.isArray(pt) ? pt.map((v: number) => v.toFixed(4)).join(', ') : pt }}</span>
                </div>
              </div>
            </el-popover>
          </template>
        </template>
      </el-table-column>

      <!-- 飞机数量 -->
      <el-table-column label="飞机数" width="80px" align="center">
        <template #default="{ row }">
          {{ row.aircraft?.icao24Set?.size ?? 0 }}
        </template>
      </el-table-column>

      <!-- 飞机 icao24 -->
      <el-table-column label="飞机 icao24" width="200px" align="center">
        <template #default="{ row }">
          <template v-if="!row.aircraft?.icao24Set?.size">—</template>
          <template v-else>
            <el-popover
              placement="top"
              :width="260"
              trigger="hover"
              popper-class="spatial-popover"
            >
              <template #reference>
                <div class="tag-preview">
                  <el-tag
                    v-for="(id, idx) in [...row.aircraft.icao24Set].slice(0, 2)"
                    :key="id"
                    size="small"
                    type="primary"
                    style="margin: 1px"
                  >{{ id }}</el-tag>
                  <el-tag
                    v-if="row.aircraft.icao24Set.size > 2"
                    size="small"
                    type="warning"
                  >+{{ row.aircraft.icao24Set.size - 2 }}</el-tag>
                </div>
              </template>
              <div class="popover-title">全部飞机 icao24（{{ row.aircraft.icao24Set.size }} 架）</div>
              <div class="popover-list">
                <div
                  v-for="id in row.aircraft.icao24Set"
                  :key="id"
                  class="popover-item"
                >
                  <span class="popover-value">{{ id }}</span>
                </div>
              </div>
            </el-popover>
          </template>
        </template>
      </el-table-column>

      <!-- 机场数量 -->
      <el-table-column label="机场数" width="80px" align="center">
        <template #default="{ row }">
          {{ row.airport?.icaoSet?.size ?? 0 }}
        </template>
      </el-table-column>

      <!-- 机场 icao -->
      <el-table-column label="机场 icao" width="200px" align="center">
        <template #default="{ row }">
          <template v-if="!row.airport?.icaoSet?.size">—</template>
          <template v-else>
            <el-popover
              placement="top"
              :width="240"
              trigger="hover"
              popper-class="spatial-popover"
            >
              <template #reference>
                <div class="tag-preview">
                  <el-tag
                    v-for="(id, idx) in [...row.airport.icaoSet].slice(0, 2)"
                    :key="id"
                    size="small"
                    type="success"
                    style="margin: 1px"
                  >{{ id }}</el-tag>
                  <el-tag
                    v-if="row.airport.icaoSet.size > 2"
                    size="small"
                    type="warning"
                  >+{{ row.airport.icaoSet.size - 2 }}</el-tag>
                </div>
              </template>
              <div class="popover-title">全部机场 icao（{{ row.airport.icaoSet.size }} 个）</div>
              <div class="popover-list">
                <div
                  v-for="id in row.airport.icaoSet"
                  :key="id"
                  class="popover-item"
                >
                  <span class="popover-value">{{ id }}</span>
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
            title="确认删除该选区？"
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
.spatial-selection-table {
  width: 100%;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.tag-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  justify-content: center;
  cursor: default;
}
</style>

<!-- 全局样式，放到全局 scss 或 App.vue 的非 scoped style 中 -->
<style lang="scss">
.spatial-popover {
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
    min-width: 18px;
    color: var(--el-text-color-secondary);
    font-size: 11px;
  }

  .popover-value {
    color: var(--el-text-color-primary);
    word-break: break-all;
  }
}
</style>
