<script setup lang="ts">
import { computed } from 'vue'
import { useAviationSelectionStore } from '@/stores/aviation-selection'
import { getPhotogrammetryBuildingProperties } from '@/views/aviation-situation/composables/photogrammetry/photogrammetry-building-registry'
import {
  displayDetailHeight,
  displayDetailName,
  displayDetailValue,
} from '@/views/aviation-situation/utils/format-detail-value'

const props = defineProps<{ position: { left: number; top: number } }>()

const aviationSelectionStore = useAviationSelectionStore()

const row = computed(() => {
  const hovered = aviationSelectionStore.hovered
  if (hovered?.sourceType !== 'photogrammetryBuilding') return null
  return getPhotogrammetryBuildingProperties(hovered.id) ?? null
})

const visible = computed(() => row.value != null)

const tooltipStyle = computed(() => ({
  left: `${props.position.left}px`,
  top: `${props.position.top}px`,
}))
</script>

<template>
  <div v-show="visible" class="photogrammetry-tooltip" :style="tooltipStyle">
    <template v-if="row">
      <div>名称：{{ displayDetailName(row.name) }}</div>
      <div>id：{{ row.id }}</div>
      <div v-if="row.city">城市：{{ row.city }}</div>
      <div v-if="row.landUse">类型：{{ displayDetailValue(row.landUse) }}</div>
      <div v-if="row.roofType">屋顶：{{ displayDetailValue(row.roofType) }}</div>
      <div>
        楼高：{{ displayDetailHeight(row.buildingHeight ?? row.height) }}
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/css/mixins' as *;

.photogrammetry-tooltip {
  @include map-tooltip;
}
</style>
