<script setup lang="ts">
import { computed } from 'vue'
import type {AirportTooltipState} from "@/views/aviation-situation/types/airport.ts"

const props = defineProps<{ tooltip: AirportTooltipState }>()

const tooltipStyle = computed(() => {
  const position = props.tooltip.position
  return {
    left: position.left + 'px',
    top: position.top + 'px',
  }
})
</script>
<template>
  <div
    v-show="props.tooltip.visible"
    class="airport-tooltip"
    :style="tooltipStyle"
  >
    <div>ICAO 代码：{{ props.tooltip.properties.icao }}</div>
    <div>机场名称：{{ props.tooltip.properties.name }}</div>
    <div>所在国家：{{ props.tooltip.properties.country }}</div>
    <div>经度：{{ props.tooltip.properties.longitude }}</div>
    <div>纬度：{{ props.tooltip.properties.latitude }}</div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/css/mixins' as *;

.airport-tooltip {
  @include map-tooltip;
}
</style>
