<script setup lang="ts">
import { computed } from 'vue'
import type { SatelliteHoveredProperties } from '@/views/aviation-situation/types/satellite'
import { useAviationSelectionStore } from '@/stores/aviation-selection'

const props = defineProps<{ tooltip: SatelliteHoveredProperties }>()

const tooltipStyle = computed(() => {
  const position = props.tooltip.position
  return {
    left: position.left + 'px',
    top: position.top + 'px',
  }
})

// const aviationSelectionStore = useAviationSelectionStore()
// const hoveredSatellite = computed(() => {
//   const hovered = aviationSelectionStore.hovered
//   if (hovered?.sourceType === 'satellite') return hovered
//   return null
// })
</script>
<template>
  <div v-show="props.tooltip.visible" class="satellite-tooltip" :style="tooltipStyle">
    <div>卫星名称：{{ props.tooltip.properties.name }}</div>
    <div>经度：{{ props.tooltip.properties.lngLatAlt?.longitude.toFixed(4) }}</div>
    <div>纬度：{{ props.tooltip.properties.lngLatAlt?.latitude.toFixed(4) }}</div>
    <div>海拔：{{ props.tooltip.properties.lngLatAlt?.height.toFixed(4) }} m</div>
  </div>
<!--  <div v-if="hoveredSatellite" class="satellite-tooltip">-->
<!--    <div>卫星名称：{{ hoveredSatellite.name }}</div>-->
<!--    <div>经度：{{ hoveredSatellite.lngLatAlt?.longitude.toFixed(4) }}</div>-->
<!--    <div>纬度：{{ hoveredSatellite.lngLatAlt?.latitude.toFixed(4) }}</div>-->
<!--    <div>海拔：{{ hoveredSatellite.lngLatAlt?.height.toFixed(4) }} m</div>-->
<!--  </div>-->
</template>

<style scoped lang="scss">
@use '@/assets/css/mixins' as *;

.satellite-tooltip {
  @include map-tooltip;
}
</style>
