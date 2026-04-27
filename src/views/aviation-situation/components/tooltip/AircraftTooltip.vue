<script setup lang="ts">
import { computed } from 'vue'
import type { AircraftTooltipState } from '@/views/aviation-situation/types/aircraft'

const props = defineProps<{ tooltip: AircraftTooltipState }>()

const tooltipStyle = computed(() => {
  const position = props.tooltip.position
  return {
    left: position.left + 'px',
    top: position.top + 'px',
  }
})
</script>
<template>
  <div v-show="props.tooltip.visible" class="aircraft-tooltip" :style="tooltipStyle">
    <div>ICAO 代码：{{ props.tooltip.properties.icao24 }}</div>
    <div>航班呼号：{{ props.tooltip.properties.callsign }}</div>
    <div>起飞国家：{{ props.tooltip.properties.originCountry }}</div>
    <div>经度：{{ props.tooltip.properties.longitude }}</div>
    <div>纬度：{{ props.tooltip.properties.latitude }}</div>
    <div>高度：{{ props.tooltip.properties.baroAltitude }} m</div>
    <div>航向：{{ props.tooltip.properties.heading }}°</div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/css/mixins' as *;

.aircraft-tooltip {
  @include map-tooltip;
}
</style>
