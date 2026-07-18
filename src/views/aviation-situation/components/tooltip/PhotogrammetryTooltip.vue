<script setup lang="ts">
import { computed } from 'vue'
import type { PhotogrammetryHoveredProperties } from '@/views/aviation-situation/types/photogrammetry'
import type { TooltipState } from '@/views/aviation-situation/types/shared'

const props = defineProps<{ tooltip: TooltipState<PhotogrammetryHoveredProperties> }>()

const tooltipStyle = computed(() => {
  const position = props.tooltip.position
  return {
    left: position.left + 'px',
    top: position.top + 'px',
  }
})

const tooltipProperties = computed(() => props.tooltip.properties)
</script>

<template>
  <div v-show="props.tooltip.visible" class="photogrammetry-tooltip" :style="tooltipStyle">
    <div>经度：{{ tooltipProperties.lngLatAlt?.longitude.toFixed(4) }}</div>
    <div>纬度：{{ tooltipProperties.lngLatAlt?.latitude.toFixed(4) }}</div>
    <div>海拔：{{ tooltipProperties.lngLatAlt?.height.toFixed(2) }} m</div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/css/mixins' as *;

.photogrammetry-tooltip {
  @include map-tooltip;
}
</style>
