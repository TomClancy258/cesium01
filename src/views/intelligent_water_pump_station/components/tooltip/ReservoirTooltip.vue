<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useStationEquipmentStore } from '@/stores/station-equipment'
import type { ReservoirRow, TooltipPosition } from '../../types/station-equipment'
import { STATUS_LABEL } from '../../types/station-equipment'

const props = defineProps<{
  position: TooltipPosition
}>()

const store = useStationEquipmentStore()
const { hovered, hoveredRow } = storeToRefs(store)

const row = computed(() => {
  if (hovered.value?.source !== 'reservoir') return null
  return (hoveredRow.value as ReservoirRow | null) ?? null
})

const visible = computed(() => row.value != null)

const tooltipStyle = computed(() => ({
  left: `${props.position.left}px`,
  top: `${props.position.top}px`,
}))

/** ISO → 本地可读：2026-01-01 08:00:00 */
const formatUpdatedAt = (iso: string): string => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
</script>

<template>
  <div v-show="visible" class="reservoir-tooltip" :style="tooltipStyle">
    <template v-if="row">
      <div>编号：{{ row.name }}</div>
      <div>名称：{{ row.text }}</div>
      <div>液位：{{ row.level }}</div>
      <div>最高液位：{{ row.maxLevel }}</div>
      <div>温度：{{ row.temperature }}</div>
      <div>
        状态：
        <span :class="['status-text', `status-text--${row.status}`]">
          {{ STATUS_LABEL[row.status] }}
        </span>
      </div>
      <div>更新时间：{{ formatUpdatedAt(row.updatedAt) }}</div>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/css/mixins' as *;

.reservoir-tooltip {
  @include map-tooltip;
  pointer-events: none;
}

.status-text--normal {
  color: #3b82f6; // 蓝
}

.status-text--warning {
  color: #eab308; // 黄
}

.status-text--danger {
  color: #ef4444; // 红
}
</style>
