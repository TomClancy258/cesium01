<script setup lang="ts">
import { computed } from 'vue'
import { getControlZoneHoveredProperties } from '@/views/aviation-situation/composables/control-zone/control-zone-hover-state'
import { displayDetailHeight } from '@/views/aviation-situation/utils/format-detail-value'
import { getControlZoneLevelLabel } from '@/views/aviation-situation/constants/control-zone-filter-data'

const props = defineProps<{ position: { left: number; top: number } }>()

const hoveredProperties = getControlZoneHoveredProperties()

const visible = computed(() => hoveredProperties.value != null)

const tooltipStyle = computed(() => ({
  left: `${props.position.left}px`,
  top: `${props.position.top}px`,
}))

const tooltipProperties = computed(() => hoveredProperties.value)
const levelLabel = computed(() =>
  tooltipProperties.value ? getControlZoneLevelLabel(tooltipProperties.value.level) : '',
)
</script>

<template>
  <div v-show="visible" class="control-zone-tooltip" :style="tooltipStyle">
    <template v-if="tooltipProperties">
      <div>id：{{ tooltipProperties.id }}</div>
      <div>管控区域名称：{{ tooltipProperties.name }}</div>
      <div>管控等级：{{ levelLabel }}</div>
      <div>最小高度：{{ displayDetailHeight(tooltipProperties.minAltitude) }}</div>
      <div>最大高度：{{ displayDetailHeight(tooltipProperties.maxAltitude) }}</div>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/css/mixins' as *;

.control-zone-tooltip {
  @include map-tooltip;
}
</style>
