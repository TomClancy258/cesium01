<script setup lang="ts">
import { useAviationSelectionStore } from '@/stores/aviation-selection'
import { computed, ref } from 'vue'

const aviationSelectionStore = useAviationSelectionStore()

const airport = computed(() => {
  const sel = aviationSelectionStore.selected
  if (sel?.sourceType === 'satellite') return sel
  return null
})


</script>

<template>
  <div v-if="airport" class="airport-detail">
    <!-- 头部 -->
    <div class="detail-header">
      <div class="airport-name">{{ airport.name }}</div>
      <div class="airport-codes">
        <span class="icao">{{ airport.icao }}</span>
        <span class="separator">/</span>
        <span class="iata">--</span>
      </div>
    </div>

    <!-- 基本信息 -->
    <div class="detail-section">
      <div class="section-title">基本信息</div>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">所在国家</span>
          <span class="value">{{ airport.country }}</span>
        </div>
        <div class="info-item">
          <span class="label">海拔高度</span>
          <span class="value">{{ airport.lngLatAlt.elevation }} m</span>
        </div>
        <div class="info-item">
          <span class="label">经度</span>
          <span class="value">{{ airport.lngLatAlt.longitude.toFixed(4) }}</span>
        </div>
        <div class="info-item">
          <span class="label">纬度</span>
          <span class="value">{{ airport.lngLatAlt.latitude.toFixed(4) }}</span>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped lang="scss">
.airport-detail {
  background: #fff;
  border-radius: 0;
  padding: 20px;
  color: #333;
  font-size: 13px;
  height: 100%;
  overflow: auto;
}

.detail-header {
  padding: 0 0 10px 0;
  border-bottom: 1px solid #e5e5e5;
  margin-bottom: 12px;

  .airport-name {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 4px;
  }

  .airport-codes {
    font-size: 12px;
    color: #999;

    .icao {
      color: #0066cc;
      font-weight: 600;
    }

    .separator {
      margin: 0 4px;
      color: #ddd;
    }
  }
}

.detail-section {
  margin-bottom: 12px;

  .section-title {
    font-size: 12px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid #f0f0f0;
    font-weight: 600;
  }
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;

  .label {
    color: #999;
  }

  .value {
    color: #333;
    font-weight: 500;
    text-align: right;
  }
}

.flight-table {
  margin-bottom: 8px;
  font-size: 12px;

  :deep(.el-table__header) {
    background-color: #f9f9f9;
  }

  :deep(.el-table__body tr:hover > td) {
    background-color: #f5f7fa !important;
  }

  :deep(.el-table__cell) {
    padding: 6px 0;
  }
}

.pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;

  :deep(.el-pagination) {
    font-size: 12px;
  }

  :deep(.el-pagination .el-pager li) {
    min-width: 24px;
    height: 24px;
    line-height: 24px;
  }
}

.no-data {
  background: #fff;
  border-radius: 6px;
  padding: 20px 12px;
  color: #999;
  font-size: 12px;
  text-align: center;
}

</style>
