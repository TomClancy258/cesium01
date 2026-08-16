<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAviationSelectionStore } from '@/stores/aviation-selection'
import { useSatelliteStore } from '@/stores/satellite'
import { satelliteScanTargetMap } from '@/views/aviation-situation/constants/satellite-filter-data.ts'
import AircraftHitTable from '@/views/aviation-situation/components/shared/AircraftHitTable.vue'
import AirportHitTable from '@/views/aviation-situation/components/shared/AirportHitTable.vue'

const aviationSelectionStore = useAviationSelectionStore()
const satelliteStore = useSatelliteStore()

const aircraftDialogVisible = ref(false)
const airportDialogVisible = ref(false)

const matched = computed(() => {
  const sel = aviationSelectionStore.selected
  if (sel?.sourceType !== 'satellite') return null
  const m = satelliteStore.matchedSatelliteMap.get(sel.id)
  if (!m) return null
  // triggerRef 后需新顶层引用，详情经纬高与扫描命中才会刷新
  return {
    satellite: { ...m.satellite },
    aircraftMap: m.aircraft.aircraftMap,
    airportMap: m.airport.airportMap,
  }
})

const satellite = computed(() => matched.value?.satellite ?? null)

const scanTarget = computed(() => satellite.value?.scan.target ?? 'none')

const showScanHits = computed(() => scanTarget.value !== 'none')

const showAircraftHits = computed(
  () => scanTarget.value === 'aircraft' || scanTarget.value === 'all',
)

const showAirportHits = computed(
  () => scanTarget.value === 'airport' || scanTarget.value === 'all',
)
</script>

<template>
  <div v-if="satellite && matched" class="aviation-detail">
    <div class="detail-header">
      <div class="detail-header__title">{{ satellite.name }}</div>
      <div class="detail-header__meta detail-header__codes">
        <span class="icao">{{ satellite.id }}</span>
        <span class="separator">/</span>
        <span class="iata">--</span>
      </div>
    </div>

    <!-- 基本信息 -->
    <div class="detail-section">
      <div class="section-title">基本信息</div>
      <div class="">
        <span class="label">简介</span>
        <div class="value description-html" v-html="satellite.description"></div>
      </div>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">所属国家</span>
          <span class="value">{{ satellite.country }}</span>
        </div>
        <div class="info-item">
          <span class="label">扫描目标</span>
          <span class="value">
            {{ satelliteScanTargetMap[satellite.scan.target] ?? satellite.scan.target }}
          </span>
        </div>
        <div class="info-item">
          <span class="label">经度</span>
          <span class="value">{{ satellite.lngLatAlt.longitude.toFixed(4) }}</span>
        </div>
        <div class="info-item">
          <span class="label">纬度</span>
          <span class="value">{{ satellite.lngLatAlt.latitude.toFixed(4) }}</span>
        </div>
        <div class="info-item">
          <span class="label">海拔高度</span>
          <span class="value">{{ satellite.lngLatAlt.height.toFixed(4) }} m</span>
        </div>
      </div>
    </div>

    <!-- 扫描命中：详情只留摘要，完整表放到宽 Dialog -->
    <div v-if="showScanHits" class="detail-section">
      <div class="section-title">扫描命中</div>
      <div v-if="showAircraftHits" class="assoc-row">
        <span class="assoc-label">飞机</span>
        <div class="assoc-links">
          <span class="hit-count">{{ matched.aircraftMap.size }} 架</span>
          <el-button
            type="primary"
            link
            size="small"
            @click="aircraftDialogVisible = true"
          >
            查看列表
          </el-button>
        </div>
      </div>
      <div v-if="showAirportHits" class="assoc-row">
        <span class="assoc-label">机场</span>
        <div class="assoc-links">
          <span class="hit-count">{{ matched.airportMap.size }} 个</span>
          <el-button
            type="primary"
            link
            size="small"
            @click="airportDialogVisible = true"
          >
            查看列表
          </el-button>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="aircraftDialogVisible"
      :title="`扫描命中 · 飞机（${matched.aircraftMap.size}）`"
      width="72%"
      append-to-body
      destroy-on-close
      :modal="false"
      class="scan-hit-dialog"
    >
      <AircraftHitTable
        :key="`${satellite.id}-aircraft-dialog`"
        :aircraft-map="matched.aircraftMap"
        :title="`全部飞机（${matched.aircraftMap.size} 架）`"
      />
    </el-dialog>

    <el-dialog
      v-model="airportDialogVisible"
      :title="`扫描命中 · 机场（${matched.airportMap.size}）`"
      width="72%"
      append-to-body
      destroy-on-close
      :modal="false"
      class="scan-hit-dialog"
    >
      <AirportHitTable
        :key="`${satellite.id}-airport-dialog`"
        :airport-map="matched.airportMap"
        :title="`全部机场（${matched.airportMap.size} 个）`"
      />
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
@use '../../styles/detail-shared';

.aviation-detail {
  .description-html {
    margin: 6px 0 10px;
    line-height: 1.6;

    :deep(p) {
      margin: 0 0 8px;
    }
  }

  .assoc-row {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 12px;
    align-items: center;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .assoc-label {
    flex-shrink: 0;
    color: #999;
    min-width: 48px;
  }

  .assoc-links {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    min-width: 0;
  }

  .hit-count {
    color: #333;
  }
}
</style>
