<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DrawerProps } from 'element-plus'
import { Expand } from '@element-plus/icons-vue'
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

/** 第三人称机器人漫游开关（由页面绑定 usePlayerCharacter） */
const roamEnabled = defineModel<boolean>('roamEnabled', { default: false })

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
  factoryBuilding: { label: '厂房', icon: factorySvg },
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
  factoryBuilding: Array.from(store.factoryBuildingMap.values()),
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
    <div class="drawer-toggle drawer-toggle--left">
      <el-icon class="rotate-icon" @click="toggleDrawer">
        <Expand />
      </el-icon>
    </div>

    <el-drawer
      v-model="drawer"
      class="overview-drawer"
      size="420px"
      :direction="direction"
      :modal="false"
      title="设备概况"
      style="height:calc(64% - 48px);margin-top: 48px;"
      :modal-penetrable="true"
    >
      <div class="overview-panel">
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

        <div class="roam-row">
          <el-checkbox v-model="roamEnabled">第三人称漫游</el-checkbox>
          <span class="roam-row__hint">
            WASD 移动 · 空格跳 · 点击画面转视角 · 准星对准设备可高亮
          </span>
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
  position: fixed;
  top: 100px;
  left: 0;
}

:deep(.overview-drawer) {
  @include el-drawer-compact;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  box-shadow: 1px 0 16px rgba(15, 23, 42, 0.12);
  border-right: 1px solid rgba(148, 163, 184, 0.35);
  --el-drawer-bg-color: rgba(255, 255, 255, 0.92);
  --el-text-color-primary: #1e293b;
  --el-text-color-regular: #475569;

  //.el-drawer__body {
  //  padding: 0;
  //  height: 100%;
  //  overflow: auto;
  //}
}

.overview-panel {
  padding: 12px 12px 16px;
  color: #1e293b;
}

.roam-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
  padding: 8px 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;

  &__hint {
    font-size: 11px;
    color: #64748b;
    line-height: 1.4;
  }
}

//.overview-header {
//  display: flex;
//  align-items: center;
//  justify-content: center;
//  gap: 8px;
//  margin-bottom: 12px;
//  padding: 8px 10px;
//  background: linear-gradient(
//    90deg,
//    rgba(14, 165, 233, 0.06),
//    rgba(14, 165, 233, 0.16),
//    rgba(14, 165, 233, 0.06)
//  );
//  border: 1px solid rgba(14, 165, 233, 0.25);
//}

.overview-header__title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: #0f172a;
}

//.overview-header__accent {
//  width: 18px;
//  height: 2px;
//  background: #0ea5e9;
//  box-shadow: none;
//
//  &--end {
//    transform: scaleX(-1);
//  }
//}

.summary-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.summary-item {
  padding: 8px 6px;
  text-align: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;

  &__label {
    font-size: 12px;
    color: #64748b;
    margin-bottom: 4px;
  }

  &__value {
    font-size: 18px;
    font-weight: 600;
    color: #0284c7;
  }

  &--danger .summary-item__value {
    color: #dc2626;
  }

  &--warning .summary-item__value {
    color: #d97706;
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
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    background: #f0f9ff;
    border-color: #7dd3fc;
    box-shadow: 0 1px 4px rgba(14, 165, 233, 0.12);
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
    filter: none;
  }

  &__title {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
  }

  &__total {
    font-size: 11px;
    font-weight: 400;
    color: #64748b;
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
    color: #b91c1c;
    background: rgba(239, 68, 68, 0.12);
  }

  &--warning {
    color: #b45309;
    background: rgba(245, 158, 11, 0.14);
  }

  &--normal {
    color: #0369a1;
    background: rgba(14, 165, 233, 0.12);
  }
}
</style>
