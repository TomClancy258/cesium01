<script setup lang="ts">
import PhotogrammetryFilter from '@/views/aviation-situation/components/map-tools/panels/city-model/PhotogrammetryFilter.vue'
import OSMBuildingFilter from '@/views/aviation-situation/components/map-tools/panels/city-model/OSMBuildingFilter.vue'
import { inject, reactive } from 'vue'
const cityModelForm = reactive({
  source: 'osmBuilding',
})

const sourceOptions: { label: string; value: string }[] = [
  { label: '全球白膜', value: 'osmBuilding' },
  { label: '倾斜摄影', value: 'photogrammetry' },
]

const removePhotogrammetrys = inject('removePhotogrammetrys')

const sourceChange = (val) => {
  if (val === 'osmBuilding') {
    removePhotogrammetrys()
  }
}
</script>

<template>
  <div>
    <el-form label-width="100px" :model="cityModelForm" :inline="true">
      <el-form-item label="建筑来源" prop="source">
        <el-select v-model="cityModelForm.source" style="width: 100px" @change="sourceChange">
          <el-option
            v-for="item in sourceOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <OSMBuildingFilter v-show="cityModelForm.source === 'osmBuilding'" />
    <PhotogrammetryFilter v-show="cityModelForm.source === 'photogrammetry'" />
  </div>
</template>

<style scoped lang="scss"></style>
