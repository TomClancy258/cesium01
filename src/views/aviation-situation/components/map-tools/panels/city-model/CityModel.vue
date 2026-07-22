<script setup lang="ts">
import PhotogrammetryFilter from '@/views/aviation-situation/components/map-tools/panels/city-model/PhotogrammetryFilter.vue'
import OSMBuildingFilter from '@/views/aviation-situation/components/map-tools/panels/city-model/OSMBuildingFilter.vue'
import { computed, inject, reactive } from 'vue'
import { usePhotogrammetryStore } from '@/stores/photogrammetry'
import { useOSMBuildingStore } from '@/stores/osm-building'

const photogrammetryStore = usePhotogrammetryStore()
const osmBuildingStore = useOSMBuildingStore()

const cityModelForm = reactive({
  source: 'osmBuilding',
})

const sourceOptions: { label: string; value: string }[] = [
  { label: '全球白膜', value: 'osmBuilding' },
  { label: '倾斜摄影', value: 'photogrammetry' },
]

const isSourceSwitchLocked = computed(
  () => photogrammetryStore.isLoadingPhotogrammetry || osmBuildingStore.isLoadingOSMBuilding,
)

const removeActivePhotogrammetry = inject('removeActivePhotogrammetry')
const removeOSMBuilding = inject('removeOSMBuilding')
const addOSMBuilding = inject('addOSMBuilding')

const sourceChange = (val) => {
  if (isSourceSwitchLocked.value) return
  if (val === 'osmBuilding') {
    removeActivePhotogrammetry()
    addOSMBuilding()
  } else if (val === 'photogrammetry') {
    removeOSMBuilding()
  }
}
</script>

<template>
  <div>
    <el-form label-width="100px" :model="cityModelForm" :inline="true">
      <el-form-item label="建筑来源" prop="source">
        <el-select
          v-model="cityModelForm.source"
          style="width: 100px"
          :loading="isSourceSwitchLocked"
          @change="sourceChange"
        >
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
