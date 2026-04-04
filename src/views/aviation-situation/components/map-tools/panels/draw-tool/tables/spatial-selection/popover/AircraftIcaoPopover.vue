<script setup lang="ts">
import { ref, computed } from 'vue'
import { emitCesiumEvent } from '@/views/aviation-situation/composables/mittBus'

const props = defineProps<{
  icao24Set?: Set<string>
}>()

const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const onShow = () => {
  searchQuery.value = ''
  currentPage.value = 1
}

const filtered = computed(() => {
  const all = [...(props.icao24Set ?? [])] as string[]
  const q = searchQuery.value.trim().toLowerCase()
  return q ? all.filter((id) => id.toLowerCase().includes(q)) : all
})

const paged = computed(() =>
  filtered.value
    .slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
    .map((id) => ({ icao24: id })),
)
</script>

<template>
  <template v-if="!icao24Set?.size">—</template>
  <template v-else>
    <el-popover
      placement="top"
      :width="500"
      trigger="click"
      popper-class="aircraft-list-popover"
      @show="onShow"
    >
      <template #reference>
        <div class="tag-preview">
          <el-tag
            v-for="id in [...icao24Set].slice(0, 2)"
            :key="id"
            size="small"
            type="primary"
            style="margin: 1px"
          >{{ id }}</el-tag>
          <el-tag
            v-if="icao24Set.size > 2"
            size="small"
            type="warning"
          >+{{ icao24Set.size - 2 }}</el-tag>
        </div>
      </template>

      <div class="popover-title">全部飞机 icao24（{{ icao24Set.size }} 架）</div>
      <el-input
        v-model="searchQuery"
        placeholder="搜索 icao24"
        size="small"
        clearable
        style="margin-bottom: 8px"
        @input="currentPage = 1"
      />
      <el-table :data="paged" size="small" border style="width: 100%">
        <el-table-column label="icao24" prop="icao24" />
        <el-table-column label="操作" width="70" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              @click="emitCesiumEvent('aircraftFilterTableDetailClicked', row.icao24)"
            >查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="filtered.length"
        layout="prev, pager, next, jumper"
        size="small"
        background
        style="margin-top: 8px; justify-content: flex-end"
      />
    </el-popover>
  </template>
</template>

<style scoped lang="scss">
.tag-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  justify-content: center;
  cursor: default;
}
</style>

<style lang="scss">
.aircraft-list-popover {
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
