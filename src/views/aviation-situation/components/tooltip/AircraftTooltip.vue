<script setup lang="ts">
import { computed, inject } from 'vue'
import { useAviationSelectionStore } from '@/stores/aviation-selection'
import { useAircraftStore } from '@/stores/aircraft'
import type { AviationRenderItem } from '@/views/aviation-situation/types/shared'
import type { Aircraft } from '@/network/aircraft/types/aircraft'
import { getAircraftRiskLevelLabel } from '@/views/aviation-situation/constants/aircraft-filter-data'

const props = defineProps<{ position: { left: number; top: number } }>()

const aviationSelectionStore = useAviationSelectionStore()
const aircraftStore = useAircraftStore()
const aircraftRenderMap = inject<Map<string, AviationRenderItem<Aircraft>>>('aircraftRenderMap')

const row = computed(() => {
  const hovered = aviationSelectionStore.hovered
  if (hovered?.sourceType !== 'aircraft') return null
  return aircraftStore.matchedAircraftMap.get(hovered.icao24) ?? null
})

const visible = computed(() => row.value != null)

const tooltipStyle = computed(() => ({
  left: `${props.position.left}px`,
  top: `${props.position.top}px`,
}))

const associationCounts = computed(() => {
  const hovered = aviationSelectionStore.hovered
  if (hovered?.sourceType !== 'aircraft' || !aircraftRenderMap) {
    return { scanCount: 0, controlCount: 0, spatialCount: 0 }
  }
  const sets = aircraftRenderMap.get(hovered.icao24)?.sets
  return {
    scanCount: sets?.coneScanSatelliteId?.size ?? 0,
    controlCount: sets?.controlZoneId?.size ?? 0,
    spatialCount: sets?.dataSourceName?.size ?? 0,
  }
})

const scanCount = computed(() => associationCounts.value.scanCount)
const controlCount = computed(() => associationCounts.value.controlCount)
const spatialCount = computed(() => associationCounts.value.spatialCount)
</script>
<template>
  <div v-show="visible" class="aircraft-tooltip" :style="tooltipStyle">
    <template v-if="row">
      <div>ICAO 代码：{{ row.icao24 }}</div>
      <div>航班呼号：{{ row.callsign }}</div>
      <div>起飞国家：{{ row.originCountry }}</div>
      <div>经度：{{ row.longitude }}</div>
      <div>纬度：{{ row.latitude }}</div>
      <div>海拔：{{ row.baroAltitude }} m</div>
      <div>航向：{{ row.heading }}°</div>
      <div>危险等级：{{ getAircraftRiskLevelLabel(row.riskLevel) }}</div>
      <div v-if="scanCount">扫描：{{ scanCount }}</div>
      <div v-if="controlCount">管控：{{ controlCount }}</div>
      <div v-if="spatialCount">空间选择：{{ spatialCount }}</div>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/css/mixins' as *;

.aircraft-tooltip {
  @include map-tooltip;
}
</style>
