<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import type { Airport } from '@/network/airport/type'

const props = defineProps<{
  airportMap?: Map<string, Airport>
}>()
const flyToAirportByIcao = inject<(icao: string) => void>('flyToAirportByIcao')

const filterIcao = ref('')
const filterName = ref('')
const filterCountry = ref('')
const currentPage = ref(1)
const pageSize = ref(5)

const onShow = () => {
  filterIcao.value = ''
  filterName.value = ''
  filterCountry.value = ''
  currentPage.value = 1
}

const resetFilter = () => {
  filterIcao.value = ''
  filterName.value = ''
  filterCountry.value = ''
  currentPage.value = 1
}

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
</script>

<template>
  <template v-if="!airportMap?.size">—</template>
  <template v-else>
    <el-popover
      placement="top"
      width="70%"
      trigger="click"
      popper-class="airport-list-popover"
      @show="onShow"
    >
      <template #reference>
        <div class="tag-preview">
          <el-tag
            v-for="a in [...airportMap.values()].slice(0, 2)"
            :key="a.icao"
            size="small"
            type="success"
            style="margin: 1px"
          >{{ a.icao }}</el-tag>
          <el-tag
            v-if="airportMap.size > 2"
            size="small"
            type="warning"
          >+{{ airportMap.size - 2 }}</el-tag>
        </div>
      </template>

      <div class="popover-title">全部机场（{{ airportMap.size }} 个）</div>

      <el-form :inline="true" size="default" style="margin-bottom: 4px">
        <el-form-item label="icao">
          <el-input v-model="filterIcao" clearable  />
        </el-form-item>
        <el-form-item label="机场名称">
          <el-input v-model="filterName" clearable  />
        </el-form-item>
        <el-form-item label="机场国家">
          <el-input v-model="filterCountry" clearable  />
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="paged" size="small" border style="width: 100%">
        <el-table-column prop="icao"      label="ICAO"    fixed />
        <el-table-column prop="name"      label="机场名称" />
        <el-table-column prop="city"      label="城市"    />
        <el-table-column prop="country"   label="国家"    />
        <el-table-column prop="latitude"  label="纬度"    />
        <el-table-column prop="longitude" label="经度"    />
        <el-table-column prop="elevation" label="海拔(ft)" />
        <el-table-column label="操作" width="70" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              @click="flyToAirportByIcao?.(row.icao)"
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
.airport-list-popover {
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
