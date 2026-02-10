<script setup lang="ts">
import { reactive,ref,inject } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type {AircraftFilterForm} from "@/views/aviation-situation/types/aircraft"
const filterAircrafts = inject('filterAircrafts')
const toggleAircraftsVisibility = inject('toggleAircraftsVisibility')
const aircraftFilterForm = reactive<AircraftFilterForm>({
  icao24: '',
  origin_country: '',
  callsign: '',
})

const aircraftFilterFormRef = ref<FormInstance>()

const onAircraftSubmit = () => {
  filterAircrafts(aircraftFilterForm)
}

const resetAircraftForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
  onAircraftSubmit()
}

const showAircrafts=ref<boolean>(true)
</script>

<template>
  <el-form :model="aircraftFilterForm"
           ref="aircraftFilterFormRef"
           label-width="auto"
           style="max-width: 600px">
    <el-form-item label="icao24" prop="icao24">
      <el-input v-model="aircraftFilterForm.icao24" clearable/>
    </el-form-item>
    <el-form-item label="航空器名称" prop="callsign">
      <el-input v-model="aircraftFilterForm.callsign" clearable/>
    </el-form-item>
    <el-form-item label="航空器国家" prop="origin_country">
      <el-input v-model="aircraftFilterForm.origin_country" clearable/>
    </el-form-item>
    <el-form-item label="显示飞机图标">
      <el-checkbox v-model="showAircrafts" @change="toggleAircraftsVisibility">
      </el-checkbox>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="onAircraftSubmit(aircraftFilterFormRef)">确认</el-button>
      <el-button @click="resetAircraftForm(aircraftFilterFormRef)">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss">

</style>
