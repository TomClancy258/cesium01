<script setup lang="ts">
//AircraftsFilter.vue
import { ref, inject } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'

const filterAircrafts = inject('filterAircrafts')
const flyToMatchedAircrafts = inject('flyToMatchedAircrafts')
const matchedAircraftCount = inject('matchedAircraftCount')

import { useAircraftStore } from '@/stores/aircraft'

const aircraftStore = useAircraftStore()

const aircraftFilterFormRef = ref<FormInstance>()

const onAircraftSubmit = () => {
  filterAircrafts()
  // flyToMatchedAircrafts()
}

const resetAircraftForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
  // filterAircrafts()
}
</script>

<template>
  <div>
    <el-form
      :model="aircraftStore.aircraftFilterForm"
      ref="aircraftFilterFormRef"
      label-width="auto"
      style="max-width: 600px"
    >
      <!-- 原有表单项 -->
      <el-form-item label="icao24" prop="icao24">
        <el-input v-model="aircraftStore.aircraftFilterForm.icao24" clearable />
      </el-form-item>
      <el-form-item label="航空器名称" prop="callsign">
        <el-input v-model="aircraftStore.aircraftFilterForm.callsign" clearable />
      </el-form-item>
      <el-form-item label="航空器国家" prop="originCountry">
        <el-input v-model="aircraftStore.aircraftFilterForm.originCountry" clearable />
      </el-form-item>
      <el-form-item label="显示飞机图标" prop="visible">
        <el-checkbox v-model="aircraftStore.aircraftFilterForm.visible" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onAircraftSubmit">确认</el-button>
        <el-button @click="resetAircraftForm(aircraftFilterFormRef)">重置</el-button>
      </el-form-item>
    </el-form>
    <div>已筛选出 {{ matchedAircraftCount }} 条数据</div>
  </div>
</template>

<style scoped lang="scss"></style>
