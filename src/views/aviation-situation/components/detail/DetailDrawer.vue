<script lang="ts" setup>
import { ref, computed } from 'vue'

import type { DrawerProps } from 'element-plus'

import AircraftDetail from './aircraft/AircraftDetail.vue'
import AirportDetail from './AirportDetail.vue'
import SatelliteDetail from './SatelliteDetail.vue'
import OSMBuildingDetail from './OSMBuildingDetail.vue'
import PhotogrammetryBuildingDetail from './PhotogrammetryBuildingDetail.vue'

import { useAviationSelectionStore } from '@/stores/aviation-selection'
import { clearSelectedAviation } from '@/views/aviation-situation/composables/selection/useAviationSelectionActions'
const aviationSelectionStore = useAviationSelectionStore()

const direction = ref<DrawerProps['direction']>('ltr')

// const emit = defineEmits(['close'])
const emit = defineEmits<{
  (e: 'close'): void
}>()

const handleClose = (): void => {
  emit('close')
}

const selectedSourceType = computed(() => {
  if (aviationSelectionStore.selected !== null) {
    return aviationSelectionStore.selected.sourceType
  } else {
    return ''
  }
})

// 优化：用computed替代watch控制抽屉显隐（更简洁）
const drawer = computed({
  get: () => aviationSelectionStore.selected !== null,
  set: (value) => {
    // 处理抽屉手动关闭的逻辑（v-model需要双向绑定）
    if (!value) {
      // emit('close')
      handleDetailDrawerClose()
    }
  },
})

const handleDetailDrawerClose = (): void => {
  clearSelectedAviation()
}

// 优化：用computed替代watch控制抽屉显隐（更简洁）
const aviationDetailDrawerTitle = computed(() => {
  if (selectedSourceType.value === 'aircraft') {
    return '飞机详情'
  } else if (selectedSourceType.value === 'airport') {
    return '机场详情'
  } else if (selectedSourceType.value === 'satellite') {
    return '卫星详情'
  } else if (selectedSourceType.value === 'osmBuilding') {
    return '建筑详情'
  } else if (selectedSourceType.value === 'photogrammetryBuilding') {
    return '倾斜摄影建筑详情'
  } else {
    return ''
  }
})
</script>
<template>
  <div class="map-detail-drawer-root">
    <el-drawer
      v-model="drawer"
      :title="aviationDetailDrawerTitle"
      size="23%"
      :direction="direction"
      :modal="false"
      :modal-penetrable="true"
      class="map-detail-drawer"
      body-class="map-detail-drawer__body"
      style="height: calc(70% - 48px); margin-top: 48px"
      @close="handleClose"
    >
      <div class="drawer-body">
        <AircraftDetail v-show="selectedSourceType === 'aircraft'" />
        <AirportDetail v-show="selectedSourceType === 'airport'" />
        <SatelliteDetail v-show="selectedSourceType === 'satellite'" />
        <OSMBuildingDetail v-show="selectedSourceType === 'osmBuilding'" />
        <PhotogrammetryBuildingDetail v-show="selectedSourceType === 'photogrammetryBuilding'" />
      </div>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/css/mixins' as *;

:deep(.map-detail-drawer) {
  @include el-drawer-compact;
}
</style>
