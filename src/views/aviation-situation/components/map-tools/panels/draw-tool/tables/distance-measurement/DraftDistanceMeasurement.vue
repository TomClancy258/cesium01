<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useDistanceMeasurementStore } from '@/stores/distanceMeasurement'
import { useDrawingToolStore } from '@/stores/drawingTool'
import { storeToRefs } from 'pinia'
import { emitCesiumEvent } from '@/views/aviation-situation/composables/mittBus'
import SurveyPointsPopover from '../../popover/SurveyPointsPopover.vue'
import SegmentsPopover from '../../popover/SegmentsPopover.vue'

const distanceMeasurementStore = useDistanceMeasurementStore()
const { finishedGraphicsArray } = storeToRefs(distanceMeasurementStore)
const drawingToolStore = useDrawingToolStore()

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

// 表格 ref（用于编程式勾选）
const tableRef = ref()

// 勾选
const selection = ref<any[]>([])
const handleSelectionChange = (val: any[]) => {
  selection.value = val
}

// 响应 store 中 selected 变化：跳页并勾选对应行
watch(
  () => drawingToolStore.selected,
  async (selected) => {
    if (!selected) {
      tableRef.value?.clearSelection()
      return
    }
    if (selected.operationType !== 'distanceMeasurement' || !selected.isDraft) return
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

// sourceType 映射
const sourceTypeMap: Record<string, string> = {
  distanceMeasurement: '距离测绘',
}

// 删除
const handleDelete = (row: any) => {
  distanceMeasurementStore.removeFinishedSelection(row.dataSourceName)
  emitCesiumEvent('spatialSelectionTableOperationClicked', {
    operationType: 'delete',
    dataSourceName: row.dataSourceName,
    sourceType: row.sourceType,
  })
}

// 查看（飞到质心）
const handleView = (row: any) => {
  emitCesiumEvent('spatialSelectionTableOperationClicked', {
    operationType: 'detail',
    centroidLngLatAlt: row.centroidLngLatAlt,
    dataSourceName: row.dataSourceName,
    sourceType: row.sourceType,
  })
}

const handleSave = (row: any) => {
}

// 批量保存
const handleBatchSave = () => {
}

// 批量删除
const handleBatchDelete = () => {
  selection.value.forEach((row) => {
    distanceMeasurementStore.removeFinishedSelection(row.dataSourceName)
    emitCesiumEvent('spatialSelectionTableOperationClicked', {
      type: 'delete',
      dataSourceName: row.dataSourceName,
      sourceType: row.sourceType,
    })
  })
  selection.value = []
}
</script>

<template>
  <div class="distance-measurement-table">
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

      <!-- 类型 -->
      <el-table-column label="类型" prop="sourceType" align="center" width="100">
        <template #default="{ row }">
          {{ sourceTypeMap[row.sourceType] ?? row.sourceType }}
        </template>
      </el-table-column>

      <!-- 总距离 -->
      <el-table-column label="总距离" align="center" width="120">
        <template #default="{ row }">
          {{ row.label?.distanceInfo?.formattedPerimeterStr ?? '—' }}
        </template>
      </el-table-column>

      <!-- 测绘点个数 -->
      <el-table-column label="测绘点数" align="center" width="90">
        <template #default="{ row }">
          {{ row.polylineState?.lngLatAltList?.length ?? '—' }}
        </template>
      </el-table-column>

      <!-- 测绘点 -->
      <el-table-column label="测绘点" align="center" width="450">
        <template #default="{ row }">
          <SurveyPointsPopover
            :lngLatAltList="row.polylineState?.lngLatAltList"
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

      <!-- 操作 -->
      <el-table-column label="操作" width="150" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
          <el-button type="success" link size="small" @click="handleSave(row)">保存</el-button>
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
