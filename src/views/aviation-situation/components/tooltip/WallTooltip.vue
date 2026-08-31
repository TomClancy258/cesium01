<script setup lang="ts">
import { computed } from 'vue'
import { getWallHoveredProperties } from '@/views/aviation-situation/composables/wall/wall-hover-state'
import {
  getWallLevelLabel,
  getWallVisualStyleLabel,
} from '@/views/aviation-situation/constants/wall-filter-data'

const props = defineProps<{ position: { left: number; top: number } }>()

const hoveredProperties = getWallHoveredProperties()

const visible = computed(() => hoveredProperties.value != null)

const tooltipStyle = computed(() => ({
  left: `${props.position.left}px`,
  top: `${props.position.top}px`,
}))

const tooltipProperties = computed(() => hoveredProperties.value)
</script>

<template>
  <div v-show="visible" class="wall-tooltip" :style="tooltipStyle">
    <template v-if="tooltipProperties">
      <div>id：{{ tooltipProperties.id }}</div>
      <div>名称：{{ tooltipProperties.name }}</div>
      <div>样式：{{ getWallVisualStyleLabel(tooltipProperties.visualStyle) }}</div>
      <div>国家：{{ tooltipProperties.country }}</div>
      <div>等级：{{ getWallLevelLabel(tooltipProperties.level) }}</div>
      <div>高度：{{ tooltipProperties.minAltitude }} ~ {{ tooltipProperties.maxAltitude }} m</div>
      <div v-if="tooltipProperties.level === 'danger' || tooltipProperties.level === 'warning'">
        围栏内飞机：{{ tooltipProperties.aircraftCount }} 架
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/css/mixins' as *;

.wall-tooltip {
  @include map-tooltip;
}
</style>
