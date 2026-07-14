<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useDrawingToolStore } from '@/stores/drawing-tool'
import { useRegionSelectionStore } from '@/stores/region-selection'
import DraftDistanceMeasurement from './tables/distance-measurement/DraftDistanceMeasurement.vue'
import SavedDistanceMeasurement from './tables/distance-measurement/SavedDistanceMeasurement.vue'
import DraftSpatialSelection from './tables/spatial-selection/DraftSpatialSelection.vue'
import SavedSpatialSelection from './tables/spatial-selection/SavedSpatialSelection.vue'

const drawingToolStore = useDrawingToolStore()
const regionSelectionStore = useRegionSelectionStore()

const activeSection = ref<'distance' | 'spatial'>('distance')
const distanceTab = ref<'draft' | 'saved'>('draft')
const spatialTab = ref<'draft' | 'saved'>('draft')

watch(
  () => regionSelectionStore.selected,
  (selected) => {
    if (!selected || selected.sourceType === 'controlZone') return
    if (selected.operationType === 'spatialSelection') {
      activeSection.value = 'spatial'
      spatialTab.value = selected.isDraft ? 'draft' : 'saved'
    } else if (selected.operationType === 'distanceMeasurement') {
      activeSection.value = 'distance'
      distanceTab.value = selected.isDraft ? 'draft' : 'saved'
    }
  },
)

const operationTypes = [
  { value: 'none', label: '无操作' },
  { value: 'distanceMeasurement', label: '距离测绘' },
  { value: 'spatialSelection', label: '框选' },
]
const spatialSelectionSubtypes = [
  { value: 'none', label: '无操作' },
  { value: 'polygon', label: '多边形空域筛选' },
  { value: 'circle', label: '圆形空域筛选' },
  // { value: 'rectangle', label: '矩形空域筛选' },
  { value: 'hemisphere', label: '半球空域筛选' },
]
const spatialSelectionTargets = [
  { value: 'measurement', label: '仅测绘' },
  { value: 'aircraft', label: '仅飞机' },
  { value: 'airport', label: '仅机场' },
  { value: 'all', label: '全部' },
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
      :model="drawingToolStore.drawingToolForm"
      ref="drawingToolFormRef"
      label-width="85px"
      :inline="true"
    >
      <el-form-item label="操作类型" prop="operationType">
        <el-select
          v-model="drawingToolStore.drawingToolForm.operationType"
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
      <span v-show="drawingToolStore.drawingToolForm.operationType === 'spatialSelection'">
        <el-form-item label="框选子类型" prop="spatialSelectionSubtype">
          <el-select
            v-model="drawingToolStore.drawingToolForm.spatialSelectionSubtype"
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
            v-model="drawingToolStore.drawingToolForm.spatialSelectionTarget"
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
    </el-form>

    <!-- 外层：距离测绘 / 空间选择 -->
    <el-tabs v-model="activeSection" type="card" class="section-tabs">
      <!-- 距离测绘 -->
      <el-tab-pane label="距离测绘" name="distance">
        <div class="tab-pane-body">
          <div class="sub-tab-bar">
            <el-radio-group v-model="distanceTab" size="small">
              <el-radio-button value="draft">草稿</el-radio-button>
              <el-radio-button value="saved">已保存</el-radio-button>
            </el-radio-group>
          </div>
          <div class="sub-tab-body">
            <DraftDistanceMeasurement v-show="distanceTab === 'draft'" />
            <SavedDistanceMeasurement v-show="distanceTab === 'saved'" />
          </div>
        </div>
      </el-tab-pane>

      <!-- 空间选择 -->
      <el-tab-pane label="空间选择" name="spatial">
        <div class="tab-pane-body">
          <div class="sub-tab-bar">
            <el-radio-group v-model="spatialTab" size="small">
              <el-radio-button value="draft">草稿</el-radio-button>
              <el-radio-button value="saved">已保存</el-radio-button>
            </el-radio-group>
          </div>
          <div class="sub-tab-body">
            <DraftSpatialSelection v-show="spatialTab === 'draft'" />
            <SavedSpatialSelection v-show="spatialTab === 'saved'" />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
:deep(.el-select) {
  width: 145px;
}

.tab-pane-body {
  margin: 0 10px;

  .sub-tab-body {
    margin-top: 10px;
  }
}

:deep(.section-tabs) {
  .el-tabs__header {
    margin: 0;
  }
}
</style>
