<script lang="ts" setup>
//AirportsFilter.tsAirportsFilter.ts
import { inject, reactive, ref ,computed} from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type {AirportFilterForm} from "@/views/aviation-situation/types/airport"
const filterAirports = inject('filterAirports')
const toggleAirportsVisibility = inject('toggleAirportsVisibility')
const airportsVisible = inject('airportsVisible')

const airportFilterForm = reactive<AirportFilterForm>({
  icao: '',
  country: '',
  name: '',
})

const airportFilterFormRef = ref<FormInstance>()

const onAirportSubmit = () => {
  filterAirports(airportFilterForm)
}

const resetAirportForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
  onAirportSubmit()
}

const airportsVisibleComputed = computed({
  get: () => airportsVisible.value,
  set: (value) => {
    toggleAirportsVisibility(value)
  },
})

</script>

<template>

  <el-form :model="airportFilterForm"
           ref="airportFilterFormRef"
           label-width="auto" style="max-width: 600px">
    <el-form-item label="icao" prop="icao">
      <el-input v-model="airportFilterForm.icao" clearable/>
    </el-form-item>
    <el-form-item label="机场名称" prop="name">
      <el-input v-model="airportFilterForm.name" clearable/>
    </el-form-item>
    <el-form-item label="机场国家" prop="country">
      <el-input v-model="airportFilterForm.country" clearable/>
    </el-form-item>
    <el-form-item label="显示机场图标">
      <el-checkbox v-model="airportsVisibleComputed" @change="toggleAirportsVisibility">
      </el-checkbox>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="onAirportSubmit(airportFilterFormRef)">确认</el-button>
      <el-button @click="resetAirportForm(airportFilterFormRef)">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss">

</style>
