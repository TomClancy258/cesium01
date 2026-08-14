<script setup lang="ts">
import { computed, inject } from 'vue'
import { useAviationSelectionStore } from '@/stores/aviation-selection'
import { useAirportStore } from '@/stores/airport'
import type { AviationRenderItem } from '@/views/aviation-situation/types/shared'
import type { Airport } from '@/network/airport/type'

const props = defineProps<{ position: { left: number; top: number } }>()

const aviationSelectionStore = useAviationSelectionStore()
const airportStore = useAirportStore()
const airportRenderMap = inject<Map<string, AviationRenderItem<Airport>>>('airportRenderMap')

const row = computed(() => {
  const hovered = aviationSelectionStore.hovered
  if (hovered?.sourceType !== 'airport') return null
  return airportStore.matchedAirportMap.get(hovered.icao) ?? null
})

const visible = computed(() => row.value != null)

const tooltipStyle = computed(() => ({
  left: `${props.position.left}px`,
  top: `${props.position.top}px`,
}))

const setsSummary = computed(() => {
  const hovered = aviationSelectionStore.hovered
  if (hovered?.sourceType !== 'airport' || !airportRenderMap) return ''
  const sets = airportRenderMap.get(hovered.icao)?.sets
  if (!sets) return ''
  const parts: string[] = []
  const scan = sets.coneScanSatelliteId?.size ?? 0
  const spatial = sets.dataSourceName?.size ?? 0
  if (scan > 0) parts.push(`扫描 ${scan}`)
  if (spatial > 0) parts.push(`空间选择 ${spatial}`)
  return parts.length > 0 ? parts.join(' · ') : ''
})
</script>
<template>
  <div v-show="visible" class="airport-tooltip" :style="tooltipStyle">
    <template v-if="row">
      <div>ICAO 代码：{{ row.icao }}</div>
      <div>机场名称：{{ row.name }}</div>
      <div>所在国家：{{ row.country }}</div>
      <div>经度：{{ row.longitude }}</div>
      <div>纬度：{{ row.latitude }}</div>
      <div>海拔：{{ row.elevation }} m</div>
      <div v-if="setsSummary">{{ setsSummary }}</div>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/css/mixins' as *;

.airport-tooltip {
  @include map-tooltip;
}
</style>
