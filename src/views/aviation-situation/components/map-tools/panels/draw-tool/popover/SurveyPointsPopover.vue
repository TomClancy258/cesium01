<script setup lang="ts">
import { ref, computed } from 'vue'
import { emitCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import type { LngLatAlt } from '@/views/aviation-situation/types/shared'

const props = defineProps<{
  lngLatAltList?: LngLatAlt[]
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
  (props.lngLatAltList ?? []).slice(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value,
  ),
)

const formatPoint = (pt: LngLatAlt) =>
  `${pt.longitude.toFixed(4)}°, ${pt.latitude.toFixed(4)}°, ${pt.height.toFixed(1)}m`

const formatTagPoint = (pt: LngLatAlt) =>
  `${pt.longitude.toFixed(2)}°, ${pt.latitude.toFixed(2)}°, ${pt.height.toFixed(1)}m`

const handleView = (pt: LngLatAlt) => {
  emitCesiumEvent('spatialSelectionTableOperationClicked', {
    operationType: 'detail',
    centroidLngLatAlt: pt,
    dataSourceName: props.dataSourceName,
    sourceType: props.sourceType,
  })
}
</script>

<template>
  <template v-if="!lngLatAltList?.length">—</template>
  <template v-else>
    <el-popover
      placement="top"
      width="25%"
      trigger="hover"
      popper-class="survey-points-popover"
      @show="onShow"
    >
      <template #reference>
        <div class="tag-preview">
          <el-tag
            v-for="(pt, i) in lngLatAltList.slice(0, 2)"
            :key="i"
            size="small"
            type="primary"
            style="margin: 1px"
          >{{ formatTagPoint(pt) }}</el-tag>
          <el-tag
            v-if="lngLatAltList.length > 2"
            size="small"
            type="warning"
          >+{{ lngLatAltList.length - 2 }}</el-tag>
        </div>
      </template>

      <div class="popover-title">全部测绘点（{{ lngLatAltList.length }} 个）</div>
      <el-table :key="tableKey" :data="paged" size="small" border style="width: 100%">
        <el-table-column label="#" width="45" align="center">
          <template #default="{ $index }">
            {{ (currentPage - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="测绘点坐标">
          <template #default="{ row }">{{ formatPoint(row) }}</template>
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
        class="pager"
        :total="lngLatAltList.length"
        layout="prev, pager, next, jumper"
        size="small"
        background
      />
    </el-popover>
  </template>
</template>

<style scoped lang="scss">
@use '@/assets/css/pager.scss';
.tag-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  justify-content: center;
  cursor: default;
}
</style>

<style lang="scss">
.survey-points-popover {
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
