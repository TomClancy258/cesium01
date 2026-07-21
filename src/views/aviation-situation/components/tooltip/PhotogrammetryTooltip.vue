<script setup lang="ts">
import { computed } from 'vue'
import type { PhotogrammetryBuildingHoveredProperties } from '@/views/aviation-situation/types/photogrammetry'
import type { TooltipState } from '@/views/aviation-situation/types/shared'
import {
  displayDetailHeight,
  displayDetailName,
  displayDetailValue, formatFixed4
} from '@/views/aviation-situation/utils/format-detail-value'

const props = defineProps<{ tooltip: TooltipState<PhotogrammetryBuildingHoveredProperties> }>()

const tooltipStyle = computed(() => {
  const position = props.tooltip.position
  return {
    left: position.left + 'px',
    top: position.top + 'px',
  }
})

const tooltipProperties = computed(() => props.tooltip.properties)
</script>

<template>
  <div v-show="props.tooltip.visible" class="photogrammetry-tooltip" :style="tooltipStyle">
    <div>名称：{{ displayDetailName(tooltipProperties.name) }}</div>
    <div>id：{{ tooltipProperties.id }}</div>
    <div v-if="tooltipProperties.city">城市：{{ tooltipProperties.city }}</div>
    <div v-if="tooltipProperties.landUse">
      类型：{{ displayDetailValue(tooltipProperties.landUse) }}
    </div>
    <div v-if="tooltipProperties.roofType">
      屋顶：{{ displayDetailValue(tooltipProperties.roofType) }}
    </div>
    <div>
      楼高：{{
        displayDetailHeight(formatFixed4(tooltipProperties.buildingHeight ?? tooltipProperties.height))
      }}
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/css/mixins' as *;

.photogrammetry-tooltip {
  @include map-tooltip;
}
</style>
