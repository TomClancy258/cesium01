<script setup lang="ts">
import { useAviationSelectionStore } from '@/stores/aviation-selection'
import { computed } from 'vue'
import {satelliteScanTargetMap} from "@/views/aviation-situation/constants/satellite-filter-data.ts"

const aviationSelectionStore = useAviationSelectionStore()

const satellite = computed(() => {
  const sel = aviationSelectionStore.selected
  if (sel?.sourceType === 'satellite') return sel
  return null
})

</script>

<template>
  <div v-if="satellite" class="aviation-detail">
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
}
</style>
