<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import type { FormInstance } from 'element-plus'
import { useOSMBuildingStore } from '@/stores/osm-building'
import {
  allOSMBuildingTypeValues,
  osmBuildingTypeOptions,
} from '@/views/aviation-situation/constants/osm-building-filter-data'

const filterOSMBuildings = inject<(() => void) | undefined>('filterOSMBuildings')

const osmBuildingStore = useOSMBuildingStore()
const osmBuildingFilterFormRef = ref<FormInstance>()

const isAllTypesSelected = computed({
  get: () => {
    const { types } = osmBuildingStore.osmBuildingFilterForm
    return types.length > 0 && types.length === allOSMBuildingTypeValues.length
  },
  set: (checked: boolean) => {
    osmBuildingStore.toggleAllOSMBuildingFilterTypes(checked)
  },
})

const isTypesIndeterminate = computed(() => {
  const { types } = osmBuildingStore.osmBuildingFilterForm
  return types.length > 0 && types.length < allOSMBuildingTypeValues.length
})

const onOSMBuildingSubmit = () => {
  filterOSMBuildings?.()
}

const resetOSMBuildingForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
  osmBuildingStore.resetOSMBuildingFilterForm()
}

watch(
  () => osmBuildingStore.osmBuildingFilterForm.colorByType,
  (enabled) => {
    if (enabled && osmBuildingStore.osmBuildingFilterForm.colorByDistance) {
      osmBuildingStore.osmBuildingFilterForm.colorByDistance = false
    }
  },
)

watch(
  () => osmBuildingStore.osmBuildingFilterForm.colorByDistance,
  (enabled) => {
    if (enabled && osmBuildingStore.osmBuildingFilterForm.colorByType) {
      osmBuildingStore.osmBuildingFilterForm.colorByType = false
    }
  },
)
</script>

<template>
  <div>
    <el-form
      ref="osmBuildingFilterFormRef"
      :model="osmBuildingStore.osmBuildingFilterForm"
      label-width="100px"
      :inline="true"
    >
      <el-form-item label="建筑类型" prop="types">
        <el-select
          v-model="osmBuildingStore.osmBuildingFilterForm.types"
          multiple
          collapse-tags
          collapse-tags-tooltip
          clearable
          placeholder="全部类型"
          style="width: 240px"
        >
          <template #header>
            <el-checkbox
              v-model="isAllTypesSelected"
              :indeterminate="isTypesIndeterminate"
            >
              全选
            </el-checkbox>
          </template>
          <el-option
            v-for="option in osmBuildingTypeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="着色方式">
        <el-checkbox v-model="osmBuildingStore.osmBuildingFilterForm.colorByType">
          按类型着色
        </el-checkbox>
        <el-checkbox v-model="osmBuildingStore.osmBuildingFilterForm.colorByDistance">
          按距离着色
        </el-checkbox>
      </el-form-item>

      <el-form-item>
<!--        <el-button type="primary" @click="onOSMBuildingSubmit">筛选</el-button>-->
        <el-button @click="resetOSMBuildingForm(osmBuildingFilterFormRef)">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss"></style>
