<script setup lang="ts">
import { computed, inject } from 'vue'
import { useAviationSelectionStore } from '@/stores/aviation-selection'
import { useAircraftStore } from '@/stores/aircraft'
import type { AviationRenderItem } from '@/views/aviation-situation/types/shared'
import type { Aircraft } from '@/network/aircraft/types/aircraft'

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

const setsSummary = computed(() => {
  const hovered = aviationSelectionStore.hovered
  if (hovered?.sourceType !== 'aircraft' || !aircraftRenderMap) return ''
  const sets = aircraftRenderMap.get(hovered.icao24)?.sets
  if (!sets) return ''
  const parts: string[] = []
  const scan = sets.coneScanSatelliteId?.size ?? 0
  const control = sets.controlZoneId?.size ?? 0
  const spatial = sets.dataSourceName?.size ?? 0
  if (scan > 0) parts.push(`扫描 ${scan}`)
  if (control > 0) parts.push(`管控 ${control}`)
  if (spatial > 0) parts.push(`空间选择 ${spatial}`)
  return parts.length > 0 ? parts.join(' · ') : ''
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
      <div v-if="setsSummary">{{ setsSummary }}</div>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/css/mixins' as *;

.aircraft-tooltip {
  @include map-tooltip;
}
</style>
