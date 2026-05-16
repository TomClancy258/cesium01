<script lang="ts" setup>
//AirportsFilter.tsAirportsFilter.ts
import { inject, ref, watch, computed } from 'vue'
import type { FormInstance } from 'element-plus'
import { useAirportStore } from '@/stores/airport'
import type { Airport } from '@/network/airport/type'
import { airportTreeData } from '@/views/aviation-situation/constants/airport-filter-data'

const filterAirports = inject('filterAirports')
const flyToAirportByIcao = inject<(icao: string) => void>('flyToAirportByIcao')

const airportStore = useAirportStore()
const airportFilterFormRef = ref<FormInstance>()

// ========== 表格与分页 ==========
const currentPage = ref(1)
const pageSize = ref(10)

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return airportStore.matchedAirportsArray.slice(start, start + pageSize.value)
})

const handlePageChange = (page: number) => {
  currentPage.value = page
}
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

// ========== 表单操作 ==========
const onAirportSubmit = () => {
  filterAirports()
}

const resetAirportForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
}

const onDetail = (row: Airport) => {
  flyToAirportByIcao?.(row.icao)
}

// 监听”显示机场图标”取消时，自动取消”机场图标常显”
watch(
  () => airportStore.airportFilterForm.visible,
  (isVisible) => {
    if (!isVisible && airportStore.airportFilterForm.alwaysVisible) {
      airportStore.airportFilterForm.alwaysVisible = false
    }
  },
)
</script>

<template>
<div>
  <el-form :model="airportStore.airportFilterForm"
           ref="airportFilterFormRef"
           label-width="100px"
           :inline="true"
  >
    <el-form-item label="icao" prop="icao">
      <el-input v-model="airportStore.airportFilterForm.icao" clearable/>
    </el-form-item>
    <el-form-item label="机场名称" prop="name">
      <el-input v-model="airportStore.airportFilterForm.name" clearable placeholder="三/四字码"/>
    </el-form-item>
<!--    <el-form-item label="机场国家" prop="country">-->
<!--      <el-input v-model="airportStore.airportFilterForm.country" clearable/>-->
<!--    </el-form-item>-->
    <el-form-item label="机场国家" prop="countries">
      <el-tree-select
        clearable
        v-model="airportStore.airportFilterForm.countries"
        :data="airportTreeData"
        multiple
        collapse-tags
        collapse-tags-tooltip
        :max-collapse-tags="24"
        :render-after-expand="false"
        show-checkbox
        style="width: 55vw"
      />
    </el-form-item>

<!--    <el-row>-->
<!--      <el-col :span="12">-->
        <el-form-item label="显示机场图标" prop="visible">
          <el-checkbox v-model="airportStore.airportFilterForm.visible" />
        </el-form-item>
        <el-form-item label="显示机场标签" prop="visible">
          <el-checkbox v-model="airportStore.airportFilterForm.labelVisible" />
        </el-form-item>
<!--      </el-col>-->
<!--      <el-col :span="12">-->
        <el-form-item label="机场图标常显" prop="alwaysVisible">
          <el-checkbox v-model="airportStore.airportFilterForm.alwaysVisible"
                       :disabled="!airportStore.airportFilterForm.visible"/>
        </el-form-item>
<!--      </el-col>-->
<!--    </el-row>-->

    <el-form-item>
      <el-button type="primary" @click="onAirportSubmit">确认</el-button>
      <el-button @click="resetAirportForm(airportFilterFormRef)">重置</el-button>
    </el-form-item>
  </el-form>
  <!-- 机场数据表格 -->
  <el-table :data="pagedData" border stripe size="small" style="width: 100%">
    <el-table-column prop="icao"      label="ICAO"   fixed />
<!--    <el-table-column prop="iata"      label="IATA"   />-->
    <el-table-column prop="name"      label="机场名称" />
    <el-table-column prop="city"      label="城市"   />
    <el-table-column prop="country"   label="国家"   />
    <el-table-column prop="subd"      label="州/省"  />
    <el-table-column prop="elevation" label="海拔(ft)" />
    <el-table-column prop="latitude"  label="纬度"   />
    <el-table-column prop="longitude" label="经度"   />
    <el-table-column prop="tz"        label="时区"   />
    <el-table-column label="操作" fixed="right">
      <template #default="{ row }">
        <el-button type="primary" link size="small" @click="onDetail(row)">详情</el-button>
      </template>
    </el-table-column>
  </el-table>

  <!-- 分页 -->
  <el-pagination
    v-model:current-page="currentPage"
    v-model:page-size="pageSize"
    :page-sizes="[10, 20, 50, 100]"
    :total="airportStore.matchedAirportsArray.length"
    layout="total, sizes, prev, pager, next, jumper"
    @current-change="handlePageChange"
    @size-change="handleSizeChange"
    style="margin-top: 8px"
  />
</div>

</template>

<style scoped lang="scss">

</style>
