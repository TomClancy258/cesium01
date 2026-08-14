<script setup lang="ts">
import { computed } from 'vue'
import { getOsmBuildingHoveredProperties } from '@/views/aviation-situation/composables/osm-building/osm-building-hover-state'
import {
  displayDetailHeight,
  displayDetailName,
  displayDetailType,
  displayDetailValue,
  formatFixed4,
} from '@/views/aviation-situation/utils/format-detail-value'

const props = defineProps<{ position: { left: number; top: number } }>()

const hoveredProperties = getOsmBuildingHoveredProperties()

const visible = computed(() => hoveredProperties.value != null)

const tooltipStyle = computed(() => ({
  left: `${props.position.left}px`,
  top: `${props.position.top}px`,
}))

const tooltipProperties = computed(() => hoveredProperties.value)

const formattedAddress = computed(() => {
  const row = tooltipProperties.value
  if (!row) return ''
  const { factoryBuildingnumber, street, city, state } = row.addr
  return [factoryBuildingnumber, street, city, state].filter(Boolean).join(', ')
})
</script>

<template>
  <div v-show="visible" class="osm-building-tooltip" :style="tooltipStyle">
    <template v-if="tooltipProperties">
      <div>名称：{{ displayDetailName(tooltipProperties.name) }}</div>
      <div>类型：{{ displayDetailType(tooltipProperties.type.building) }}</div>
      <div>经度：{{ tooltipProperties.lngLatAlt?.longitude.toFixed(4) }}</div>
      <div>纬度：{{ tooltipProperties.lngLatAlt?.latitude.toFixed(4) }}</div>
      <div>楼高：{{ displayDetailHeight(formatFixed4(tooltipProperties.estimatedHeight)) }}</div>
      <div>地址：{{ displayDetailValue(formattedAddress) }}</div>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/css/mixins' as *;

.osm-building-tooltip {
  @include map-tooltip;
}
</style>
