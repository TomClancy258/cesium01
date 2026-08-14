<script setup lang="ts">
import { computed } from 'vue'
import { useAviationSelectionStore } from '@/stores/aviation-selection'
import { useSatelliteStore } from '@/stores/satellite'
import { satelliteScanTargetMap } from '@/views/aviation-situation/constants/satellite-filter-data.ts'

const props = defineProps<{ position: { left: number; top: number } }>()

const aviationSelectionStore = useAviationSelectionStore()
const satelliteStore = useSatelliteStore()

const row = computed(() => {
  const hovered = aviationSelectionStore.hovered
  if (hovered?.sourceType !== 'satellite') return null
  return satelliteStore.matchedSatelliteMap.get(hovered.id) ?? null
})

const visible = computed(() => row.value != null)

const tooltipStyle = computed(() => ({
  left: `${props.position.left}px`,
  top: `${props.position.top}px`,
}))
</script>
<template>
  <div v-show="visible" class="satellite-tooltip" :style="tooltipStyle">
    <template v-if="row">
      <div>卫星id：{{ row.id }}</div>
      <div>卫星名称：{{ row.name }}</div>
      <div>所属国家：{{ row.country }}</div>
      <div>扫描目标：{{ satelliteScanTargetMap[row.scan?.target] ?? row.scan?.target }}</div>
      <div>经度：{{ row.lngLatAlt?.longitude.toFixed(4) }}</div>
      <div>纬度：{{ row.lngLatAlt?.latitude.toFixed(4) }}</div>
      <div>海拔：{{ row.lngLatAlt?.height.toFixed(4) }} m</div>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/css/mixins' as *;

.satellite-tooltip {
  @include map-tooltip;
}
</style>
