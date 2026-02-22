<script setup lang="ts">
import {computed} from "vue"
import type {AircraftTooltipState} from "@/views/aviation-situation/types/aircraft"

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
  <div
    v-show="props.tooltip.visible"
    class="aircraft-tooltip"
    :style="tooltipStyle"
  >
    <div>icao24 : {{ props.tooltip.properties.icao24 }}</div>
    <div>callsign : {{ props.tooltip.properties.callsign }}</div>
    <div>originCountry : {{ props.tooltip.properties.originCountry }}</div>
    <div>longitude : {{ props.tooltip.properties.longitude }}</div>
    <div>latitude : {{ props.tooltip.properties.latitude }}</div>
    <div>baroAltitude : {{ props.tooltip.properties.baroAltitude }}</div>
    <div>heading : {{ props.tooltip.properties.heading }}</div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/css/mixins' as *;

.aircraft-tooltip {
  @include map-tooltip;
}
</style>
