<script lang="ts" setup>
//SpatialSelect.vue
import { useSpatialSelectStore } from '@/stores/spatialSelect'
import DraftDistanceMeasurement from './tables/distance-measurement/DraftDistanceMeasurement.vue'
import DraftSpatialSelection from './tables/spatial-selection/DraftSpatialSelection.vue'

const spatialSelectStore = useSpatialSelectStore()
const operationTypes = [
  {
    value: 'none',
    label: '无操作',
  },
  {
    value: 'distanceMeasurement',
    label: '距离测绘',
  },
  {
    value: 'spatialSelection',
    label: '框选',
  },
]
const spatialSelectionSubtypes = [
  {
    value: 'none',
    label: '无操作',
  },
  {
    value: 'polygon',
    label: '多边形空域筛选',
  },
  {
    value: 'circle',
    label: '圆形空域筛选',
  },
  {
    value: 'rectangle',
    label: '矩形空域筛选',
  },
  {
    value: 'hemisphere',
    label: '半球空域筛选',
  },
]
const spatialSelectionTargets = [
  {
    value: 'measurement',
    label: '仅测绘',
  },
  {
    value: 'aircraft',
    label: '仅飞机',
  },
  {
    value: 'airport',
    label: '仅机场',
  },
  {
    value: 'all',
    label: '全部',
  },
]

const operationTypeChange = (val: string): void => {
  if (val === 'distanceMeasurement') {

  }
}
const spatialSelectionSubtypeChange = (): void => {}
const spatialSelectionTargetChange = (): void => {}
</script>

<template>
  <div>
    <el-form
      :model="spatialSelectStore.spatialSelectForm"
      ref="spatialSelectFormRef"
      label-width="85px"
      :inline="true"
    >
      <el-form-item label="操作类型" prop="operationType">
        <el-select
          v-model="spatialSelectStore.spatialSelectForm.operationType"
          @change="operationTypeChange"
        >
          <el-option
            v-for="item in operationTypes"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <span v-show="spatialSelectStore.spatialSelectForm.operationType === 'spatialSelection'">
        <el-form-item label="框选子类型" prop="spatialSelectionSubtype">
          <el-select
            v-model="spatialSelectStore.spatialSelectForm.spatialSelectionSubtype"
            @change="spatialSelectionSubtypeChange"
          >
            <el-option
              v-for="item in spatialSelectionSubtypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="框选目标" prop="spatialSelectionTarget">
          <el-select
            v-model="spatialSelectStore.spatialSelectForm.spatialSelectionTarget"
            @change="spatialSelectionTargetChange"
          >
            <el-option
              v-for="item in spatialSelectionTargets"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </span>

      <!--      <el-form-item>-->
      <!--        <el-button type="primary" @click="onAirportSubmit">确认</el-button>-->
      <!--        <el-button @click="resetAirportForm(spatialSelectFormRef)">重置</el-button>-->
      <!--      </el-form-item>-->
    </el-form>

    <DraftDistanceMeasurement/>
    <DraftSpatialSelection/>
  </div>
</template>

<style scoped lang="scss">
:deep(.el-select) {
  width: 145px;
}
</style>
