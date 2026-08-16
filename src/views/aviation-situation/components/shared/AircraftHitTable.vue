<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import type { Aircraft } from '@/network/aircraft/types/aircraft'

const props = defineProps<{
  aircraftMap?: Map<string, Aircraft>
  /** 标题；默认「全部飞机（N 架）」 */
  title?: string
}>()

const flyToAircraftByIcao24 = inject<(icao24: string) => void>('flyToAircraftByIcao24')

const filterIcao24 = ref('')
const filterCallsign = ref('')
const filterOriginCountry = ref('')
const currentPage = ref(1)
const pageSize = ref(5)

const reset = () => {
  filterIcao24.value = ''
  filterCallsign.value = ''
  filterOriginCountry.value = ''
  currentPage.value = 1
}

defineExpose({ reset })

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

const heading = computed(
  () => props.title ?? `全部飞机（${props.aircraftMap?.size ?? 0} 架）`,
)
</script>

<template>
  <div class="hit-table">
    <div class="hit-table__title">{{ heading }}</div>

    <el-form :inline="true" size="default" class="hit-table__form">
      <el-form-item label="icao24">
        <el-input v-model="filterIcao24" clearable />
      </el-form-item>
      <el-form-item label="呼号">
        <el-input v-model="filterCallsign" clearable />
      </el-form-item>
      <el-form-item label="国籍">
        <el-input v-model="filterOriginCountry" clearable />
      </el-form-item>
      <el-form-item>
        <el-button @click="reset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="paged" size="small" border style="width: 100%">
      <el-table-column prop="icao24" label="icao24" fixed />
      <el-table-column prop="callsign" label="呼号" />
      <el-table-column prop="originCountry" label="国籍" />
      <el-table-column prop="longitude" label="经度" />
      <el-table-column prop="latitude" label="纬度" />
      <el-table-column prop="baroAltitude" label="气压高度" />
      <el-table-column prop="groundSpeed" label="地速" />
      <el-table-column prop="heading" label="航向" />
      <el-table-column label="操作" width="70" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            size="small"
            @click="flyToAircraftByIcao24?.(row.icao24)"
          >
            详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      class="pager"
      :total="filtered.length"
      :page-sizes="[5, 10, 20, 30]"
      layout="total, sizes, prev, pager, next, jumper"
      size="small"
      background
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/css/pager.scss';

.hit-table__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.hit-table__form {
  margin-bottom: 4px;
}
</style>
