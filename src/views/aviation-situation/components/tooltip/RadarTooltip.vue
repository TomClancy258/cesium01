<script setup lang="ts">
import { computed } from 'vue'
import { getRadarHoveredProperties } from '@/views/aviation-situation/composables/radar/radar-hover-state'
import { formatDistance } from '@/utils/geoUtils'

const props = defineProps<{ position: { left: number; top: number } }>()

const hoveredProperties = getRadarHoveredProperties()

const visible = computed(() => hoveredProperties.value != null)

const tooltipStyle = computed(() => ({
  left: `${props.position.left}px`,
  top: `${props.position.top}px`,
}))

const tooltipProperties = computed(() => hoveredProperties.value)

const radiusText = computed(() => {
  const radius = tooltipProperties.value?.radiusMeters
  if (radius == null) return ''
  return formatDistance(radius)
})
</script>

<template>
  <div v-show="visible" class="radar-tooltip" :style="tooltipStyle">
    <template v-if="tooltipProperties">
      <div>id：{{ tooltipProperties.id }}</div>
      <div>名称：{{ tooltipProperties.name }}</div>
      <div>国家：{{ tooltipProperties.country }}</div>
      <div>半径：{{ radiusText }}</div>
      <div>扫描飞机：{{ tooltipProperties.detectAircraft ? '是' : '否' }}</div>
      <div v-if="tooltipProperties.detectAircraft">
        圆内飞机：{{ tooltipProperties.aircraftCount }} 架
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/css/mixins' as *;

.radar-tooltip {
  @include map-tooltip;
}
</style>
