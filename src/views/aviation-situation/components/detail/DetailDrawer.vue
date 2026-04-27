<script lang="ts" setup>
import { ref, computed } from 'vue'

import type { DrawerProps } from 'element-plus'

import AircraftDetail from './aircraft/AircraftDetail.vue'
import AirportDetail from './AirportDetail.vue'

import { useAviationSelectionStore } from '@/stores/aviation-selection'
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
      emit('close')
    }
  },
})
// 优化：用computed替代watch控制抽屉显隐（更简洁）
const aviationDetailDrawerTitle = computed(() => {
  if (selectedSourceType.value === 'aircraft') {
    return '飞机详情'
  }else if(selectedSourceType.value === 'airport'){
    return '机场详情'
  }else{
    return ''
  }
})
</script>
<template>
  <el-drawer
    v-model="drawer"
    :title="aviationDetailDrawerTitle"
    size="23%"
    :direction="direction"
    :modal="false"
    :modal-penetrable="true"
    @close="handleClose"
    class="map-detail-drawer"
    body-class="map-detail-drawer__body"
    style="height: 70%;"
  >
    <div class="drawer-body">
      <AircraftDetail v-show="selectedSourceType === 'aircraft'" />
      <AirportDetail v-show="selectedSourceType === 'airport'" />
    </div>
  </el-drawer>
</template>

<style lang="scss">
.map-detail-drawer__body {
  padding: 10px !important;
}
</style>
