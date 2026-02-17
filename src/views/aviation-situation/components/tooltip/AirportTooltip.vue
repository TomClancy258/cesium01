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
    <div>icao : {{ props.tooltip.properties.icao }}</div>
    <div>name : {{ props.tooltip.properties.name }}</div>
    <div>country : {{ props.tooltip.properties.country }}</div>
    <div>longitude : {{ props.tooltip.properties.longitude }}</div>
    <div>latitude : {{ props.tooltip.properties.latitude }}</div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/css/mixins' as *;

.airport-tooltip {
  @include map-tooltip;
}
</style>
