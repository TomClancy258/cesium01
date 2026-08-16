<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import type { Airport } from '@/network/airport/type'

const props = defineProps<{
  airportMap?: Map<string, Airport>
  /** 标题；默认「全部机场（N 个）」 */
  title?: string
}>()

const flyToAirportByIcao = inject<(icao: string) => void>('flyToAirportByIcao')

const filterIcao = ref('')
const filterName = ref('')
const filterCountry = ref('')
const currentPage = ref(1)
const pageSize = ref(5)

const reset = () => {
  filterIcao.value = ''
  filterName.value = ''
  filterCountry.value = ''
  currentPage.value = 1
}

defineExpose({ reset })

const filtered = computed(() => {
  const all = [...(props.airportMap?.values() ?? [])]
  const icao = filterIcao.value.trim().toLowerCase()
  const name = filterName.value.trim().toLowerCase()
  const country = filterCountry.value.trim().toLowerCase()
  return all.filter(
    (a) =>
      (!icao || a.icao.toLowerCase().includes(icao)) &&
      (!name || a.name.toLowerCase().includes(name)) &&
      (!country || a.country.toLowerCase().includes(country)),
  )
})

const paged = computed(() =>
  filtered.value.slice(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value,
  ),
)

const heading = computed(
  () => props.title ?? `全部机场（${props.airportMap?.size ?? 0} 个）`,
)
</script>

<template>
  <div class="hit-table">
    <div class="hit-table__title">{{ heading }}</div>

    <el-form :inline="true" size="default" class="hit-table__form">
      <el-form-item label="icao">
        <el-input v-model="filterIcao" clearable />
      </el-form-item>
      <el-form-item label="机场名称">
        <el-input v-model="filterName" clearable />
      </el-form-item>
      <el-form-item label="机场国家">
        <el-input v-model="filterCountry" clearable />
      </el-form-item>
      <el-form-item>
        <el-button @click="reset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="paged" size="small" border style="width: 100%">
      <el-table-column prop="icao" label="ICAO" fixed />
      <el-table-column prop="name" label="机场名称" />
      <el-table-column prop="city" label="城市" />
      <el-table-column prop="country" label="国家" />
      <el-table-column prop="latitude" label="纬度" />
      <el-table-column prop="longitude" label="经度" />
      <el-table-column prop="elevation" label="海拔(ft)" />
      <el-table-column label="操作" width="70" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            size="small"
            @click="flyToAirportByIcao?.(row.icao)"
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
