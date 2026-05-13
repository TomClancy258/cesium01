<script setup lang="ts">
//src/views/aviation-situation/components/map-tools/panels/AircraftFilter.vue
import { ref, inject, computed } from 'vue'
import type { FormInstance } from 'element-plus'
import { useAircraftStore } from '@/stores/aircraft'
import type { Aircraft } from '@/network/aircraft/types/aircraft'
import {aircraftTreeData} from "@/views/aviation-situation/constants/aircraft-filter-data.ts"

const filterAircrafts = inject('filterAircrafts')
const flyToAircraftByIcao24 = inject<(icao24: string) => void>('flyToAircraftByIcao24')

const aircraftStore = useAircraftStore()
const aircraftFilterFormRef = ref<FormInstance>()

// ========== 表格与分页 ==========
const currentPage = ref(1)
const pageSize = ref(10)

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return aircraftStore.matchedAircraftsArray.slice(start, start + pageSize.value)
})

const handlePageChange = (page: number) => {
  currentPage.value = page
}
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

// ========== 表单操作 ==========
const onAircraftSubmit = () => filterAircrafts()
const resetAircraftForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
  // aircraftStore.resetAircraftFilterForm()
}

const onDetail = (row: Aircraft) => {
  flyToAircraftByIcao24?.(row.icao24)
}
</script>

<template>
  <div>
    <!-- 筛选表单 -->
    <el-form
      :model="aircraftStore.aircraftFilterForm"
      :inline="true"
      size="default"
      ref="aircraftFilterFormRef"
      label-width="100px"
    >
      <el-form-item label="icao24" prop="icao24">
        <el-input v-model="aircraftStore.aircraftFilterForm.icao24" clearable />
      </el-form-item>
      <el-form-item label="航空器名称" prop="callsign">
        <el-input v-model="aircraftStore.aircraftFilterForm.callsign" clearable />
      </el-form-item>
<!--      <el-form-item label="航空器国家" prop="originCountry">-->
<!--        <el-input v-model="aircraftStore.aircraftFilterForm.originCountry" clearable />-->
<!--      </el-form-item>-->
      <el-form-item label="起飞机场" prop="startAirport">
        <el-input v-model="aircraftStore.aircraftFilterForm.startAirport" clearable placeholder="三/四字码" />
      </el-form-item>
      <el-form-item label="目的机场" prop="endAirport">
        <el-input v-model="aircraftStore.aircraftFilterForm.endAirport" clearable placeholder="三/四字码" />
      </el-form-item>
      <el-form-item label="航空器国家" prop="originCountries">
        <el-tree-select
          clearable
          v-model="aircraftStore.aircraftFilterForm.originCountries"
          :data="aircraftTreeData"
          multiple
          collapse-tags
          collapse-tags-tooltip
          :max-collapse-tags="24"
          :render-after-expand="false"
          show-checkbox
          style="width: 65vw"
        />
      </el-form-item>
      <el-form-item label="显示飞机图标" prop="visible">
        <el-checkbox v-model="aircraftStore.aircraftFilterForm.visible" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onAircraftSubmit">确认</el-button>
        <el-button @click="resetAircraftForm(aircraftFilterFormRef)">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 飞机数据表格 -->
    <el-table :data="pagedData" border stripe size="small" style="width: 100%">
      <el-table-column prop="icao24"        label="icao24"    fixed />
      <el-table-column prop="callsign"      label="呼号"       />
      <el-table-column prop="originCountry" label="国籍"      />
      <el-table-column prop="latitude"      label="纬度"      />
      <el-table-column prop="longitude"     label="经度"       />
      <el-table-column prop="baroAltitude"  label="气压高度"   />
      <el-table-column prop="geomAltitude"  label="几何高度"  />
      <el-table-column prop="groundSpeed"   label="地速"      />
      <el-table-column prop="velocity"      label="速度"     />
      <el-table-column prop="heading"       label="航向"       />
      <el-table-column prop="verticalRate"  label="垂直速率"  />
      <el-table-column prop="squawk"        label="应答机"     />
<!--      <el-table-column prop="category"      label="类别"      width="80" />-->
<!--      <el-table-column prop="onGround"      label="在地面"    width="80">-->
<!--        <template #default="{ row }">-->
<!--          <el-tag :type="row.onGround ? 'info' : 'success'" size="small">-->
<!--            {{ row.onGround ? '是' : '否' }}-->
<!--          </el-tag>-->
<!--        </template>-->
<!--      </el-table-column>-->
<!--      <el-table-column prop="alert"         label="告警"      width="80">-->
<!--        <template #default="{ row }">-->
<!--          <el-tag :type="row.alert ? 'danger' : ''" size="small">-->
<!--            {{ row.alert ? '是' : '否' }}-->
<!--          </el-tag>-->
<!--        </template>-->
<!--      </el-table-column>-->
<!--      <el-table-column prop="spi"           label="SPI"       width="80">-->
<!--        <template #default="{ row }">-->
<!--          {{ row.spi ? '是' : '否' }}-->
<!--        </template>-->
<!--      </el-table-column>-->
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
      :total="aircraftStore.matchedAircraftsArray.length"
      layout="total, sizes, prev, pager, next, jumper"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
      style="margin-top: 8px"
    />
  </div>
</template>

<style scoped lang="scss"></style>
