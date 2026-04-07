<script setup lang="ts">
import { ref, computed } from 'vue'
import { emitCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import type { Aircraft } from '@/network/aircraft/types/aircraft'

const props = defineProps<{
  aircraftMap?: Map<string, Aircraft>
}>()

const filterIcao24 = ref('')
const filterCallsign = ref('')
const filterOriginCountry = ref('')
const currentPage = ref(1)
const pageSize = ref(5)

const onShow = () => {
  filterIcao24.value = ''
  filterCallsign.value = ''
  filterOriginCountry.value = ''
  currentPage.value = 1
}

const resetFilter = () => {
  filterIcao24.value = ''
  filterCallsign.value = ''
  filterOriginCountry.value = ''
  currentPage.value = 1
}

const filtered = computed(() => {
  const all = [...(props.aircraftMap?.values() ?? [])]
  const icao24 = filterIcao24.value.trim().toLowerCase()
  const callsign = filterCallsign.value.trim().toLowerCase()
  const country = filterOriginCountry.value.trim().toLowerCase()
  return all.filter(
    (a) =>
      (!icao24 || a.icao24.toLowerCase().includes(icao24)) &&
      (!callsign || (a.callsign ?? '').toLowerCase().includes(callsign)) &&
      (!country || (a.originCountry ?? '').toLowerCase().includes(country)),
  )
})

const paged = computed(() =>
  filtered.value.slice(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value,
  ),
)
</script>

<template>
  <template v-if="!aircraftMap?.size">—</template>
  <template v-else>
    <el-popover
      placement="top"
      width="70%"
      trigger="click"
      popper-class="aircraft-list-popover"
      @show="onShow"
    >
      <template #reference>
        <div class="tag-preview">
          <el-tag
            v-for="a in [...aircraftMap.values()].slice(0, 2)"
            :key="a.icao24"
            size="small"
            type="primary"
            style="margin: 1px"
          >{{ a.icao24 }}</el-tag>
          <el-tag
            v-if="aircraftMap.size > 2"
            size="small"
            type="warning"
          >+{{ aircraftMap.size - 2 }}</el-tag>
        </div>
      </template>

      <div class="popover-title">全部飞机（{{ aircraftMap.size }} 架）</div>

      <el-form :inline="true" size="default" style="margin-bottom: 4px">
        <el-form-item label="icao24">
          <el-input v-model="filterIcao24" clearable @input="currentPage = 1" />
        </el-form-item>
        <el-form-item label="呼号">
          <el-input v-model="filterCallsign" clearable @input="currentPage = 1" />
        </el-form-item>
        <el-form-item label="国籍">
          <el-input v-model="filterOriginCountry" clearable @input="currentPage = 1" />
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="paged" size="small" border style="width: 100%">
        <el-table-column prop="icao24"        label="icao24"   fixed />
        <el-table-column prop="callsign"      label="呼号"     />
        <el-table-column prop="originCountry" label="国籍"     />
        <el-table-column prop="longitude"     label="经度"     />
        <el-table-column prop="latitude"      label="纬度"     />
        <el-table-column prop="baroAltitude"  label="气压高度" />
        <el-table-column prop="groundSpeed"   label="地速"     />
        <el-table-column prop="heading"       label="航向"     />
        <el-table-column label="操作" width="70" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              @click="emitCesiumEvent('aircraftFilterTableDetailClicked', row.icao24)"
            >详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="filtered.length"
        :page-sizes="[5, 10, 20, 30]"
        layout="total, sizes, prev, pager, next, jumper"
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
