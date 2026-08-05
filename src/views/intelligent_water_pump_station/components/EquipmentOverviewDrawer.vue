<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DrawerProps } from 'element-plus'
import { Fold } from '@element-plus/icons-vue'
import { useStationEquipmentStore } from '@/stores/station-equipment'
import {
  EQUIPMENT_SOURCES,
  type EquipmentSource,
  type EquipmentStatus,
  type StationRow,
} from '../types/station-equipment'

import reservoirSvg from '@/assets/img/reservoir/reservoir.svg'
import fanSvg from '@/assets/img/fan/fan.svg'
import streetlightSvg from '@/assets/img/streetlight/streetlight.svg'
import cellTowerSvg from '@/assets/img/tower/cell-tower.svg'
import mixingSvg from '@/assets/img/mixing/mixing.svg'
import factorySvg from '@/assets/img/building/factory.svg'
import jarSvg from '@/assets/img/jar/jar.svg'

const emit = defineEmits<{
  selectSource: [source: EquipmentSource]
}>()

const store = useStationEquipmentStore()
const drawer = ref(true)
const direction = ref<DrawerProps['direction']>('ltr')

const SOURCE_META: Record<
  EquipmentSource,
  { label: string; icon: string }
> = {
  reservoir: { label: '蓄水池', icon: reservoirSvg },
  coolingTower: { label: '冷却塔', icon: fanSvg },
  coolingTube: { label: '冷却管', icon: fanSvg },
  streetlight: { label: '路灯', icon: streetlightSvg },
  pressureRegulatingTower: { label: '调压塔', icon: cellTowerSvg },
  mixingTank: { label: '搅拌池', icon: mixingSvg },
  house: { label: '房子', icon: factorySvg },
  pressurizedTank: { label: '承压罐', icon: jarSvg },
}

interface StatusCounts {
  normal: number
  warning: number
  danger: number
  total: number
}

const emptyCounts = (): StatusCounts => ({
  normal: 0,
  warning: 0,
  danger: 0,
  total: 0,
})

const countStatuses = (rows: Iterable<StationRow>): StatusCounts => {
  const counts = emptyCounts()
  for (const row of rows) {
    counts.total += 1
    const key = row.status as EquipmentStatus
    if (key === 'normal' || key === 'warning' || key === 'danger') {
      counts[key] += 1
    }
  }
  return counts
}

const rowsBySource = computed((): Record<EquipmentSource, StationRow[]> => ({
  reservoir: Array.from(store.reservoirMap.values()),
  coolingTower: Array.from(store.coolingTowerMap.values()),
  coolingTube: Array.from(store.coolingTubeMap.values()),
  streetlight: Array.from(store.streetlightMap.values()),
  pressureRegulatingTower: Array.from(store.pressureRegulatingTowerMap.values()),
  mixingTank: Array.from(store.mixingTankMap.values()),
  house: Array.from(store.houserMap.values()),
  pressurizedTank: Array.from(store.pressurizedTankMap.values()),
}))

const sourceCards = computed(() =>
  EQUIPMENT_SOURCES.map((source) => {
    const meta = SOURCE_META[source]
    const counts = countStatuses(rowsBySource.value[source])
    return { source, ...meta, ...counts }
  }),
)

const summary = computed(() => {
  const totals = emptyCounts()
  for (const card of sourceCards.value) {
    totals.normal += card.normal
    totals.warning += card.warning
    totals.danger += card.danger
    totals.total += card.total
  }
  return totals
})

const toggleDrawer = (): void => {
  drawer.value = !drawer.value
}

const onCardClick = (source: EquipmentSource): void => {
  emit('selectSource', source)
}
</script>

<template>
  <div class="overview-drawer-root">
    <div
      class="drawer-toggle drawer-toggle--left"
      :class="{ 'drawer-toggle--left-open': drawer }"
    >
      <el-icon class="rotate-icon" @click="toggleDrawer">
        <Fold />
      </el-icon>
    </div>

    <el-drawer
      v-model="drawer"
      class="overview-drawer"
      :with-header="false"
      size="420px"
      :direction="direction"
      :modal="false"
      style="height: 64%;"
      :modal-penetrable="true"
    >
      <div class="overview-panel">
        <div class="overview-header">
          <span class="overview-header__accent" />
          <span class="overview-header__title">设备概况</span>
          <span class="overview-header__accent overview-header__accent--end" />
        </div>

        <div class="summary-row">
          <div class="summary-item">
            <div class="summary-item__label">设备总数</div>
            <div class="summary-item__value">{{ summary.total }}</div>
          </div>
          <div class="summary-item summary-item--danger">
            <div class="summary-item__label">危险</div>
            <div class="summary-item__value">{{ summary.danger }}</div>
          </div>
          <div class="summary-item summary-item--warning">
            <div class="summary-item__label">预警</div>
            <div class="summary-item__value">{{ summary.warning }}</div>
          </div>
        </div>

        <div class="card-grid">
          <button
            v-for="card in sourceCards"
            :key="card.source"
            type="button"
            class="source-card"
            @click="onCardClick(card.source)"
          >
            <div class="source-card__head">
              <img :src="card.icon" alt="" class="source-card__icon" />
              <div class="source-card__title">
                <span>{{ card.label }}</span>
                <span class="source-card__total">共 {{ card.total }}</span>
              </div>
            </div>
            <div class="source-card__tags">
              <span class="status-chip status-chip--danger">危险 {{ card.danger }}</span>
              <span class="status-chip status-chip--warning">预警 {{ card.warning }}</span>
              <span class="status-chip status-chip--normal">正常 {{ card.normal }}</span>
            </div>
          </button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/css/mixins' as *;

.drawer-toggle {
  @include drawer-toggle;
}

.drawer-toggle--left {
  @include drawer-toggle-left;
  z-index: 2100;
  transition: left 0.3s ease;

  &.drawer-toggle--left-open {
    left: 420px;
  }
}

:deep(.overview-drawer) {
  @include el-drawer-compact;
  background: rgba(11, 18, 32, 0.72);
  backdrop-filter: blur(10px);
  box-shadow: 1px 0 16px rgba(0, 0, 0, 0.35);
  border-right: 1px solid rgba(56, 189, 248, 0.25);

  .el-drawer__body {
    padding: 0;
    height: 100%;
    overflow: auto;
  }
}

.overview-panel {
  padding: 12px 12px 16px;
  color: #e8f4ff;
}

.overview-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 10px;
  background: linear-gradient(
    90deg,
    rgba(14, 116, 144, 0.15),
    rgba(14, 165, 233, 0.45),
    rgba(14, 116, 144, 0.15)
  );
  border: 1px solid rgba(56, 189, 248, 0.35);
}

.overview-header__title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.overview-header__accent {
  width: 18px;
  height: 2px;
  background: #38bdf8;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.8);

  &--end {
    transform: scaleX(-1);
  }
}

.summary-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.summary-item {
  padding: 8px 6px;
  text-align: center;
  background: rgba(15, 23, 42, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 4px;

  &__label {
    font-size: 12px;
    color: rgba(186, 230, 253, 0.85);
    margin-bottom: 4px;
  }

  &__value {
    font-size: 18px;
    font-weight: 600;
    color: #7dd3fc;
  }

  &--danger .summary-item__value {
    color: #f87171;
  }

  &--warning .summary-item__value {
    color: #fbbf24;
  }
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.source-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  text-align: left;
  cursor: pointer;
  color: inherit;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(56, 189, 248, 0.22);
  border-radius: 4px;
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover {
    background: rgba(14, 116, 144, 0.28);
    border-color: rgba(56, 189, 248, 0.55);
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    filter: drop-shadow(0 0 4px rgba(56, 189, 248, 0.45));
  }

  &__title {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
    font-size: 13px;
    font-weight: 600;
  }

  &__total {
    font-size: 11px;
    font-weight: 400;
    color: rgba(186, 230, 253, 0.75);
  }

  &__tags {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
}

.status-chip {
  font-size: 11px;
  line-height: 1.4;
  padding: 1px 5px;
  border-radius: 3px;
  white-space: nowrap;

  &--danger {
    color: #fecaca;
    background: rgba(239, 68, 68, 0.22);
  }

  &--warning {
    color: #fde68a;
    background: rgba(245, 158, 11, 0.22);
  }

  &--normal {
    color: #bae6fd;
    background: rgba(14, 165, 233, 0.2);
  }
}
</style>
