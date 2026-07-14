<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useSpatialSelectionStore } from '@/stores/spatial-selection'
import { useRegionSelectionStore } from '@/stores/region-selection'
import { storeToRefs } from 'pinia'
import { emitCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import AircraftIcaoPopover from './popover/AircraftIcaoPopover.vue'
import AirportIcaoPopover from './popover/AirportIcaoPopover.vue'
import SurveyPointsPopover from '../../popover/SurveyPointsPopover.vue'
import SegmentsPopover from '../../popover/SegmentsPopover.vue'
import type { DistanceMeasurementData } from '@/views/aviation-situation/types/draw-tools'

const spatialSelectionStore = useSpatialSelectionStore()
const { finishedGraphicsArray } = storeToRefs(spatialSelectionStore)
const regionSelectionStore = useRegionSelectionStore()

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
const formatRadius = (row: DistanceMeasurementData) => {
  const r = row.label?.radiusInfo?.radius
  if (r == null) return '—'
  return r >= 1000 ? `${(r / 1000).toFixed(2)} km` : `${r.toFixed(0)} m`
}

// 表格 ref（用于编程式勾选）
const tableRef = ref()

// 勾选
const selection = ref<DistanceMeasurementData[]>([])
const handleSelectionChange = (val: DistanceMeasurementData[]) => {
  selection.value = val
}

// 响应 store 中 selected 变化：跳页并勾选对应行
watch(
  () => regionSelectionStore.selected,
  async (selected) => {
    if (!selected || selected.sourceType === 'controlZone') {
      tableRef.value?.clearSelection()
      return
    }
    if (selected.operationType !== 'spatialSelection' || !selected.isDraft) return
    const index = finishedGraphicsArray.value.findIndex(
      (row) => row.dataSourceName === selected.dataSourceName
    )
    if (index === -1) return
    currentPage.value = Math.floor(index / pageSize.value) + 1
    await nextTick()
    const row = pagedData.value[index % pageSize.value]
    if (!row || !tableRef.value) return
    tableRef.value.clearSelection()
    tableRef.value.toggleRowSelection(row, true)
  }
)

// 保存
const handleSave = (row: DistanceMeasurementData) => {
}

// 批量保存
const handleBatchSave = () => {
}

// 批量删除
const handleBatchDelete = () => {
  selection.value.forEach((row) => {
    handleDelete(row)
  })
  selection.value = []
}

// 删除
const handleDelete = (row: DistanceMeasurementData) => {
  emitCesiumEvent('spatialSelectionTableOperationClicked',{
    operationType:'delete',
    dataSourceName:row.dataSourceName,
    sourceType:row.sourceType,
    spatialSelectionTarget:row.spatialSelectionTarget,
    aircraft:{...row.aircraft},
    airport:{...row.airport},
  })
}

// 详情（占位，按需实现）
const handleView = (row: DistanceMeasurementData) => {
  console.log('详情', row)
  emitCesiumEvent('spatialSelectionTableOperationClicked',{
    operationType:'detail',
    centroidLngLatAlt:row.centroidLngLatAlt,
    dataSourceName:row.dataSourceName,
    sourceType:row.sourceType,
  })
}
</script>

<template>
  <div class="spatial-selection-table">
    <!-- 批量操作栏：有勾选时才显示 -->
    <div v-show="selection.length > 0" class="action-bar">
      <span class="action-bar__count">已选 {{ selection.length }} 条</span>
      <el-button type="primary" size="small" @click="handleBatchSave">批量保存</el-button>
      <el-popconfirm
        :title="`确认删除选中的 ${selection.length} 条记录？`"
        confirm-button-text="删除"
        cancel-button-text="取消"
        @confirm="handleBatchDelete"
      >
        <template #reference>
          <el-button type="danger" size="small">批量删除</el-button>
        </template>
      </el-popconfirm>
    </div>

    <el-table
      ref="tableRef"
      :data="pagedData"
      border
      stripe
      style="width: 100%"
      row-key="dataSourceName"
      @selection-change="handleSelectionChange"
    >
      <!-- 勾选列 -->
      <el-table-column type="selection" width="45" align="center" :reserve-selection="true" />

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
      <el-table-column label="半径" align="center" width="100px">
        <template #default="{ row }">
          {{ formatRadius(row) }}
        </template>
      </el-table-column>

      <!-- 圆心坐标 -->
      <el-table-column label="圆心坐标" width="250px" align="center">
        <template #default="{ row }">
          <span v-if="row.centerLngLatAltArray?.length">
            {{ formatCoord(row.centerLngLatAltArray) }}
          </span>
          <span v-else>—</span>
        </template>
      </el-table-column>

      <!-- 周长 -->
      <el-table-column label="周长" align="center" width="100px">
        <template #default="{ row }">
          {{ row.label?.perimeterInfo?.formattedPerimeterStr ?? '—' }}
        </template>
      </el-table-column>

      <!-- 面积 -->
      <el-table-column label="面积" align="center" width="150px">
        <template #default="{ row }">
          {{ row.label?.areaInfo?.formattedAreaStr ?? '—' }}
        </template>
      </el-table-column>

      <!-- 测绘点数 -->
      <el-table-column label="测绘点数" align="center" width="90">
        <template #default="{ row }">
          {{ row.polygonState?.lngLatAltList?.length ?? '—' }}
        </template>
      </el-table-column>

      <!-- 测绘点 -->
      <el-table-column label="测绘点" align="center" width="250">
        <template #default="{ row }">
          <SurveyPointsPopover
            :lngLatAltList="row.polygonState?.lngLatAltList"
            :dataSourceName="row.dataSourceName"
            :sourceType="row.sourceType"
          />
        </template>
      </el-table-column>

      <!-- 路径 -->
      <el-table-column label="路径" align="center">
        <template #default="{ row }">
          <SegmentsPopover
            :segments="row.segments"
            :dataSourceName="row.dataSourceName"
            :sourceType="row.sourceType"
          />
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

      <!-- 机场数量 -->
      <el-table-column label="机场数" width="80px" align="center">
        <template #default="{ row }">
          {{ row.airport?.airportMap?.size ?? 0 }}
        </template>
      </el-table-column>

      <!-- 机场 icao -->
      <el-table-column label="机场 icao" width="200px" align="center">
        <template #default="{ row }">
          <AirportIcaoPopover :airport-map="row.airport?.airportMap" />
        </template>
      </el-table-column>

      <!-- 操作 -->
      <el-table-column label="操作" width="150" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
          <el-button type="success" link size="small" @click="handleSave(row)">保存</el-button>
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

.action-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  margin-bottom: 8px;
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 4px;
}

.action-bar__count {
  flex: 1;
  font-size: 13px;
  color: var(--el-color-primary);
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

</style>

