<script setup lang="ts">
import { computed } from 'vue'
import { useEquipmentTooltip } from '../../composables/useEquipmentTooltip'
import type { CoolingTubeRow, TooltipPosition } from '../../types/station-equipment'
import { STATUS_LABEL } from '../../types/station-equipment'
import { formatUpdatedAt } from '../../utils/format-updated-at'

const props = defineProps<{
  position: TooltipPosition
}>()

const { row, visible, toTooltipStyle } = useEquipmentTooltip<CoolingTubeRow>('coolingTube')
const tooltipStyle = computed(() => toTooltipStyle(props.position))
</script>

<template>
  <div v-show="visible" class="equipment-tooltip" :style="tooltipStyle">
    <template v-if="row">
      <div>编号：{{ row.name }}</div>
      <div>名称：{{ row.text }}</div>
      <div>温度：{{ row.temperature }}</div>
      <div>压力：{{ row.pressure ?? '—' }}</div>
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
@use './equipment-tooltip.scss';
</style>
