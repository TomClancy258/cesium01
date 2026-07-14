<script setup lang="ts">
import { computed } from 'vue'
import type { ControlZoneHoveredProperties } from '@/views/aviation-situation/types/control-zone'
import type { TooltipState } from '@/views/aviation-situation/types/shared'
import { displayDetailHeight } from '@/views/aviation-situation/utils/format-detail-value'
import { getControlZoneLevelLabel } from '@/views/aviation-situation/constants/control-zone-filter-data'

const props = defineProps<{ tooltip: TooltipState<ControlZoneHoveredProperties> }>()

const tooltipStyle = computed(() => {
  const position = props.tooltip.position
  return {
    left: position.left + 'px',
    top: position.top + 'px',
  }
})

const tooltipProperties = computed(() => props.tooltip.properties)
const levelLabel = computed(() => getControlZoneLevelLabel(tooltipProperties.value.level))
</script>

<template>
  <div v-show="props.tooltip.visible" class="control-zone-tooltip" :style="tooltipStyle">
    <div>id：{{ tooltipProperties.id }}</div>
    <div>管控区域名称：{{ tooltipProperties.name }}</div>
    <div>管控等级：{{ levelLabel }}</div>
    <div>最小高度：{{ displayDetailHeight(tooltipProperties.minAltitude) }}</div>
    <div>最大高度：{{ displayDetailHeight(tooltipProperties.maxAltitude) }}</div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/css/mixins' as *;

.control-zone-tooltip {
  @include map-tooltip;
}
</style>
