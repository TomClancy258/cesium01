<script lang="ts" setup>
import { ref, computed } from 'vue'

import type { DrawerProps } from 'element-plus'

import AircraftDetail from './AircraftDetail.vue'
import AirportDetail from './AirportDetail.vue'

import { useHighlightStore } from '@/stores/highlight'
const highlightStore = useHighlightStore()

const direction = ref<DrawerProps['direction']>('ltr')

// const emit = defineEmits(['close'])
const emit = defineEmits<{
  (e: 'close'): void
}>()

const handleClose = (): void => {
  emit('close')
}

const selectedSourceType = computed(() => {
  if (highlightStore.selected !== null) {
    return highlightStore.selected.sourceType
  }else{
    return ''
  }
})

// 优化：用computed替代watch控制抽屉显隐（更简洁）
const drawer = computed({
  get: () => highlightStore.selected !== null,
  set: (value) => {
    // 处理抽屉手动关闭的逻辑（v-model需要双向绑定）
    if (!value) {
      emit('close')
    }
  },
})
</script>
<template>
  <el-drawer
    v-model="drawer"
    title=""
    size="20%"
    :direction="direction"
    :modal="false"
    :modal-penetrable="true"
    @close="handleClose"
  >
    <div class="drawer-body">
      <AircraftDetail v-show="selectedSourceType === 'aircraft'" />
      <AirportDetail v-show="selectedSourceType === 'airport'" />
    </div>
  </el-drawer>
</template>

<style lang="scss" scoped></style>
