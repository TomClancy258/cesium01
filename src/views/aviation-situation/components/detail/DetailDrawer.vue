<script lang="ts" setup>
import { ref, defineEmits,computed } from 'vue'

import type { DrawerProps } from 'element-plus'
import type { AircraftClickData } from '@/views/aviation-situation/types/aircraft'
import type { AirportClickData } from '@/views/aviation-situation/types/airport'

import AircraftDetail from "./AircraftDetail.vue"
import AirportDetail from "./AirportDetail.vue"

const drawer = ref<boolean>(false)
const direction = ref<DrawerProps['direction']>('ltr')
// const emit = defineEmits(['close'])
const emit = defineEmits<{
  (e: 'close'): void
}>()

const currentClickData = ref<AircraftClickData | AirportClickData | null>(null)

const detailComponents = {
  aircraft: AircraftDetail,
  airport: AirportDetail
} as const

const showDrawer = (clickData: AircraftClickData|AirportClickData): void => {
  drawer.value = true
  currentClickData.value=clickData
}
const handleClose = ():void => {
  emit('close')
  currentClickData.value = null
}

const currentDetailComponent = computed(() => {
  if (!currentClickData.value) return null
  const sourceType = currentClickData.value.sourceType // 确保你的数据有 sourceType 字段
  return detailComponents[sourceType]
})

defineExpose({
  showDrawer,
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
      <component
        :is="currentDetailComponent"
        v-if="currentDetailComponent"
        :data="currentClickData"
      />
    </div>
  </el-drawer>
</template>

<style lang="scss" scoped></style>
