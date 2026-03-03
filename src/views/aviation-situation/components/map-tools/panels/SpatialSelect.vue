<script lang="ts" setup>
import { useSpatialSelectStore } from '@/stores/spatialSelect'
const spatialSelectStore = useSpatialSelectStore()
const operationTypes = [
  {
    value: 'none',
    label: '无操作',
  },
  {
    value: 'distanceSurveying',
    label: '距离测绘',
  },
  {
    value: 'boxSelect',
    label: '框选',
  },
]
const boxSelectionSubtypes = [
  {
    value: 'polygon',
    label: '多边形',
  },
  {
    value: 'circle',
    label: '圆形',
  },
  {
    value: 'rectangle',
    label: '矩形',
  },
]
const boxSelectionTargets = [
  {
    value: 'all',
    label: '全部',
  },
  {
    value: 'aircraft',
    label: '仅飞机',
  },
  {
    value: 'airport',
    label: '仅机场',
  },
]

const operationTypeChange = (val: string): void => {
  if (val === 'distanceSurveying') {

  }
}
const boxSelectionSubtypeChange = (): void => {}
const boxSelectionTargetChange = (): void => {}
</script>

<template>
  <div>
    <el-form
      :model="spatialSelectStore.spatialSelectForm"
      ref="spatialSelectFormRef"
      label-width="85px"
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
      <div v-show="spatialSelectStore.spatialSelectForm.operationType === 'boxSelect'">
        <el-form-item label="框选子类型" prop="boxSelectionSubtype">
          <el-select
            v-model="spatialSelectStore.spatialSelectForm.boxSelectionSubtype"
            @change="boxSelectionSubtypeChange"
          >
            <el-option
              v-for="item in boxSelectionSubtypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="框选目标" prop="boxSelectionTarget">
          <el-select
            v-model="spatialSelectStore.spatialSelectForm.boxSelectionTarget"
            @change="boxSelectionTargetChange"
          >
            <el-option
              v-for="item in boxSelectionTargets"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </div>

      <!--      <el-form-item>-->
      <!--        <el-button type="primary" @click="onAirportSubmit">确认</el-button>-->
      <!--        <el-button @click="resetAirportForm(spatialSelectFormRef)">重置</el-button>-->
      <!--      </el-form-item>-->
    </el-form>
  </div>
</template>

<style scoped lang="scss"></style>
