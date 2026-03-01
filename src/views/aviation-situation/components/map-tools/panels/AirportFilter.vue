<script lang="ts" setup>
//AirportsFilter.tsAirportsFilter.ts
import { inject, ref,watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
const filterAirports = inject('filterAirports')
const matchedAirportCount = inject('matchedAirportCount')

import { useAirportStore } from '@/stores/airport'
const airportStore = useAirportStore()

const airportFilterFormRef = ref<FormInstance>()

const onAirportSubmit = () => {
  filterAirports()
}

const resetAirportForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
}

// 监听“显示机场图标”取消时，自动取消“机场图标常显”
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
           label-width="100px" style="max-width: 600px">
    <el-form-item label="icao" prop="icao">
      <el-input v-model="airportStore.airportFilterForm.icao" clearable/>
    </el-form-item>
    <el-form-item label="机场名称" prop="name">
      <el-input v-model="airportStore.airportFilterForm.name" clearable placeholder="三/四字码"/>
    </el-form-item>
    <el-form-item label="机场国家" prop="country">
      <el-input v-model="airportStore.airportFilterForm.country" clearable/>
    </el-form-item>

    <el-row>
      <el-col :span="12">
        <el-form-item label="显示机场图标" prop="visible">
          <el-checkbox v-model="airportStore.airportFilterForm.visible" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="机场图标常显" prop="alwaysVisible">
          <el-checkbox v-model="airportStore.airportFilterForm.alwaysVisible"
                       :disabled="!airportStore.airportFilterForm.visible"/>
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item>
      <el-button type="primary" @click="onAirportSubmit">确认</el-button>
      <el-button @click="resetAirportForm(airportFilterFormRef)">重置</el-button>
    </el-form-item>
  </el-form>
  <div>
    已筛选出 {{matchedAirportCount}} 条数据
  </div>
</div>

</template>

<style scoped lang="scss">

</style>
