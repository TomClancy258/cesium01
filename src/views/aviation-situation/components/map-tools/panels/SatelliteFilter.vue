<script setup lang="ts">
//src/views/aviation-situation/components/map-tools/panels/SatelliteFilter.vue
import { ref, inject, computed } from 'vue'
import type { FormInstance } from 'element-plus'
import { useSatelliteStore } from '@/stores/satellite'
import type { Satellite } from '@/network/satellite/index.ts'
import { satelliteTreeData } from '@/views/aviation-situation/constants/satellite-filter-data'
import {satelliteScanTargetMap} from "@/views/aviation-situation/constants/satellite-filter-data.ts"
import AirportIcaoPopover
  from '@/views/aviation-situation/components/map-tools/panels/draw-tool/tables/spatial-selection/popover/AirportIcaoPopover.vue'
import AircraftIcaoPopover
  from '@/views/aviation-situation/components/map-tools/panels/draw-tool/tables/spatial-selection/popover/AircraftIcaoPopover.vue'

const filterSatellites = inject('filterSatellites')
const flyToSatelliteById = inject<(id: string) => void>('flyToSatelliteById')

const satelliteStore = useSatelliteStore()
const satelliteFilterFormRef = ref<FormInstance>()

// ========== 表格与分页 ==========
const currentPage = ref(1)
const pageSize = ref(10)

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return satelliteStore.matchedSatellitesArray.slice(start, start + pageSize.value)
})

const handlePageChange = (page: number) => {
  currentPage.value = page
}
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const formatFixed4 = (value: number | undefined): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '--'
  return value.toFixed(4)
}

// ========== 表单操作 ==========
const onSatelliteSubmit = () => filterSatellites()
const resetSatelliteForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
  // satelliteStore.resetSatelliteFilterForm()
}

const onDetail = (row: Satellite) => {
  flyToSatelliteById?.(row.id)
}
</script>

<template>
  <div>
    <!-- 筛选表单 -->
    <el-form
      :model="satelliteStore.satelliteFilterForm"
      :inline="true"
      size="default"
      ref="satelliteFilterFormRef"
      label-width="100px"
    >
      <el-form-item label="卫星id" prop="id">
        <el-input v-model="satelliteStore.satelliteFilterForm.id" clearable />
      </el-form-item>
      <el-form-item label="卫星名称" prop="name">
        <el-input v-model="satelliteStore.satelliteFilterForm.name" clearable />
      </el-form-item>
      <el-form-item label="所属国家" prop="originCountries">
        <el-tree-select
          clearable
          v-model="satelliteStore.satelliteFilterForm.countries"
          :data="satelliteTreeData"
          multiple
          collapse-tags
          collapse-tags-tooltip
          :max-collapse-tags="24"
          :render-after-expand="false"
          show-checkbox
          style="width: 65vw"
        />
      </el-form-item>
      <el-form-item label="显示卫星" prop="visible">
        <el-checkbox v-model="satelliteStore.satelliteFilterForm.visible" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSatelliteSubmit">确认</el-button>
        <el-button @click="resetSatelliteForm(satelliteFilterFormRef)">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 飞机数据表格 -->
    <el-table :data="pagedData" border stripe size="small" style="width: 100%">
      <el-table-column prop="id"        label="卫星id"    fixed />
      <el-table-column prop="name"      label="卫星名称"       />
      <el-table-column prop="country" label="所属国家"      />

      <el-table-column label="纬度">
        <template #default="{ row }">
          {{ formatFixed4(row.lngLatAlt?.latitude) }}
        </template>
      </el-table-column>
      <el-table-column label="经度">
        <template #default="{ row }">
          {{ formatFixed4(row.lngLatAlt?.longitude) }}
        </template>
      </el-table-column>
      <el-table-column label="海拔">
        <template #default="{ row }">
          {{ formatFixed4(row.lngLatAlt?.height) }} m
        </template>
      </el-table-column>
      <!--      <el-table-column prop="scan.target" label="扫描目标"      />-->
      <el-table-column label="扫描目标">
        <template #default="{ row }">
          {{ satelliteScanTargetMap[row.scan.target]??row.scan.target }}
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
      <el-table-column label="操作"  fixed="right">
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
      :total="satelliteStore.matchedSatellitesArray.length"
      layout="total, sizes, prev, pager, next, jumper"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
      style="margin-top: 8px"
    />
  </div>
</template>

<style scoped lang="scss"></style>
