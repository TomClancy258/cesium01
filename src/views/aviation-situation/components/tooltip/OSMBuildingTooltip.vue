<script setup lang="ts">
import { computed } from 'vue'
import type { OSMBuildingHoveredProperties } from '@/views/aviation-situation/types/osm-building'
import type { TooltipState } from '@/views/aviation-situation/types/shared'
import {
  displayDetailHeight,
  displayDetailName, displayDetailType,
  displayDetailValue, formatFixed4
} from '@/views/aviation-situation/utils/format-detail-value'

const props = defineProps<{ tooltip: TooltipState<OSMBuildingHoveredProperties> }>()

const tooltipStyle = computed(() => {
  const position = props.tooltip.position
  return {
    left: position.left + 'px',
    top: position.top + 'px',
  }
})

const tooltipProperties = computed(() => props.tooltip.properties)

const displayType = computed(() => {
  return tooltipProperties.value.type.shop || tooltipProperties.value.type.building || ''
})

const formattedAddress = computed(() => {
  const { factoryBuildingnumber, street, city, state } = tooltipProperties.value.addr
  return [factoryBuildingnumber, street, city, state].filter(Boolean).join(', ')
})
</script>

<template>
  <div v-show="props.tooltip.visible" class="osm-building-tooltip" :style="tooltipStyle">
    <div>名称：{{ displayDetailName(tooltipProperties.name) }}</div>
    <div>类型：{{ displayDetailType(tooltipProperties.type.building) }}</div>
    <div>经度：{{ tooltipProperties.lngLatAlt?.longitude.toFixed(4) }}</div>
    <div>纬度：{{ tooltipProperties.lngLatAlt?.latitude.toFixed(4) }}</div>
    <div>楼高：{{ displayDetailHeight(formatFixed4(tooltipProperties.estimatedHeight)) }}</div>
    <div>地址：{{ displayDetailValue(formattedAddress) }}</div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/css/mixins' as *;

.osm-building-tooltip {
  @include map-tooltip;
}
</style>
