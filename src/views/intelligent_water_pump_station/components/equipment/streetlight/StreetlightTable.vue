<script setup lang="ts">
import type { StreetLightRow } from '../../../types/station-equipment'
import { STATUS_LABEL, STATUS_TAG_TYPE } from '../../../types/station-equipment'

defineProps<{
  data: StreetLightRow[]
  total: number
  rowClassName: (ctx: { row: StreetLightRow }) => string
}>()

const currentPage = defineModel<number>('currentPage', { required: true })
const pageSize = defineModel<number>('pageSize', { required: true })

const emit = defineEmits<{
  detail: [row: StreetLightRow]
  sortChange: [payload: { prop: string; order: 'ascending' | 'descending' | null }]
}>()

const onSortChange = (payload: {
  prop?: string
  order: 'ascending' | 'descending' | null
}): void => {
  emit('sortChange', { prop: payload.prop ?? '', order: payload.order })
}
</script>

<template>
  <div>
    <el-table
      :data="data"
      border
      stripe
      size="small"
      style="width: 100%"
      :row-class-name="rowClassName"
      row-key="name"
      @sort-change="onSortChange"
    >
      <el-table-column prop="name" label="编号" />
      <el-table-column prop="text" label="名称" />
      <el-table-column prop="power" label="功率" sortable="custom" />
      <el-table-column prop="on" label="开关">
        <template #default="{ row }">
          <el-tag :type="row.on ? 'success' : 'info'" size="small">
            {{ row.on ? '开' : '关' }}
          </el-tag>
        </template>
      </el-table-column>
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
      :total="total"
      layout="total, sizes, prev, pager, next"
    />
  </div>
</template>

<style scoped lang="scss">
@use '../equipment-panel';
</style>
