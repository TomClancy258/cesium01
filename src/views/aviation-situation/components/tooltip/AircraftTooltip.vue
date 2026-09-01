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
    return {
      scanCount: 0,
      controlCount: 0,
      spatialCount: 0,
      radarCount: 0,
      wallCount: 0,
    }
  }
  const sets = aircraftRenderMap.get(hovered.icao24)?.sets
  return {
    scanCount: sets?.coneScanSatelliteId?.size ?? 0,
    controlCount: sets?.controlZoneId?.size ?? 0,
    spatialCount: sets?.dataSourceName?.size ?? 0,
    radarCount: sets?.radarId?.size ?? 0,
    wallCount: sets?.wallId?.size ?? 0,
  }
})
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
      <div v-if="associationCounts.scanCount">扫描：{{ associationCounts.scanCount }}</div>
      <div v-if="associationCounts.controlCount">管控：{{ associationCounts.controlCount }}</div>
      <div v-if="associationCounts.spatialCount">空间选择：{{ associationCounts.spatialCount }}</div>
      <div v-if="associationCounts.radarCount">雷达：{{ associationCounts.radarCount }}</div>
      <div v-if="associationCounts.wallCount">电子围栏：{{ associationCounts.wallCount }}</div>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/css/mixins' as *;

.aircraft-tooltip {
  @include map-tooltip;
}
</style>
