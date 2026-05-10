<script setup lang="ts">
import { computed } from 'vue'
import { useAviationSelectionStore } from '@/stores/aviation-selection'
import AltitudeSpeedChart from './AltitudeSpeedChart.vue'

const aviationSelectionStore = useAviationSelectionStore()

const aircraft = computed(() => {
  const sel = aviationSelectionStore.selected
  if (sel?.sourceType === 'aircraft') return sel
  return null
})

// 静态数据：起飞/终点信息
const flightInfo = {
  departure: {
    code: 'SHE',
    name: '沈阳桃仙',
    pinyin: 'ZYTX',
  },
  arrival: {
    code: 'DZH',
    name: '达州金垭',
    pinyin: 'ZUDA',
  },
  times: {
    plannedDeparture: '10:15',
    actualDeparture: '10:30',
    plannedArrival: '13:45',
    estimatedArrival: '14:09',
  },
}

// 高度与速度数据
const chartData = {
  altitudes: [0, 2500, 5000, 7500, 9750, 10000, 10050, 9950, 9850, 8500, 7000, 5500, 3000, 1000, 500, 0],
  speeds: [0, 200, 350, 450, 500, 550, 600, 630, 650, 680, 700, 710, 680, 400, 250, 0],
  times: ['10:10', '10:20', '10:30', '10:40', '10:50', '11:00', '11:10', '11:20', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:05', '14:09'],
}

</script>

<template>
  <div v-if="aircraft" class="aircraft-detail">
    <!-- 飞机图片 + 基本信息 -->
    <div class="aircraft-header">
      <div class="aircraft-image">
        <img src="@/assets/img/airplane/jpg/airplane01.jpg" alt="飞机" />
      </div>
      <div class="aircraft-info">
        <div class="flight-number">{{ aircraft.icao24 }}</div>
        <div class="callsign">{{ aircraft.callsign }}</div>
        <div class="airline">北京首都航空有限公司</div>
      </div>
    </div>

    <!-- 起飞 → 终点 -->
    <div class="flight-route">
      <div class="route-item departure">
        <div class="route-code">{{ flightInfo.departure.code }}</div>
        <div class="route-pinyin">{{ flightInfo.departure.pinyin }}</div>
        <div class="route-name">{{ flightInfo.departure.name }}</div>
      </div>
      <div class="route-arrow">→</div>
      <div class="route-item arrival">
        <div class="route-code">{{ flightInfo.arrival.code }}</div>
        <div class="route-pinyin">{{ flightInfo.arrival.pinyin }}</div>
        <div class="route-name">{{ flightInfo.arrival.name }}</div>
      </div>
    </div>

    <!-- 时间信息 -->
    <div class="time-info">
      <div class="time-column">
        <div class="time-header">
          <span class="time-header-label">当地时间</span>
          <span class="time-zone">(UTC+08:00)</span>
        </div>
        <div class="time-rows">
          <div class="time-row">
            <span class="time-row-label">计划</span>
            <span class="time-row-value">{{ flightInfo.times.plannedDeparture }}</span>
          </div>
          <div class="time-row">
            <span class="time-row-label">实际</span>
            <span class="time-row-value">{{ flightInfo.times.actualDeparture }}</span>
          </div>
        </div>
      </div>
      <div class="time-divider"></div>
      <div class="time-column">
        <div class="time-header">
          <span class="time-header-label">当地时间</span>
          <span class="time-zone">(UTC+08:00)</span>
        </div>
        <div class="time-rows">
          <div class="time-row">
            <span class="time-row-label">计划</span>
            <span class="time-row-value">{{ flightInfo.times.plannedArrival }}</span>
          </div>
          <div class="time-row">
            <span class="time-row-label">预计</span>
            <span class="time-row-value">{{ flightInfo.times.estimatedArrival }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 高度与速度图 -->
    <div class="detail-section">
      <div class="section-title">高度与速度</div>
      <AltitudeSpeedChart :chart-data="chartData" />
    </div>

    <!-- 飞行信息 -->
    <div class="detail-section">
      <div class="section-title">飞行信息</div>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">经度</span>
          <span class="value">{{ aircraft.lngLatAlt.longitude.toFixed(4) }}</span>
        </div>
        <div class="info-item">
          <span class="label">纬度</span>
          <span class="value">{{ aircraft.lngLatAlt.latitude.toFixed(4) }}</span>
        </div>
        <div class="info-item">
          <span class="label">高度</span>
          <span class="value">{{ aircraft.lngLatAlt.baroAltitude.toFixed(0) }} m</span>
        </div>
        <div class="info-item">
          <span class="label">方位角</span>
          <span class="value">{{ aircraft.heading }}°</span>
        </div>
        <div class="info-item">
          <span class="label">水平速度</span>
          <span class="value">281.00 km/h</span>
        </div>
        <div class="info-item">
          <span class="label">垂直速度</span>
          <span class="value">-4.00 m/s</span>
        </div>
        <div class="info-item">
          <span class="label">应答机编码</span>
          <span class="value">7043</span>
        </div>
      </div>
    </div>

    <!-- 飞机信息 -->
    <div class="detail-section">
      <div class="section-title">飞机信息</div>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">所属国家</span>
          <span class="value">{{ aircraft.originCountry }}</span>
        </div>
        <div class="info-item">
          <span class="label">机型</span>
          <span class="value">Boeing 737-83Z</span>
        </div>
        <div class="info-item">
          <span class="label">飞机注册号</span>
          <span class="value">--</span>
        </div>
        <div class="info-item">
          <span class="label">机龄</span>
          <span class="value">8.3 年</span>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="no-data">暂无飞机数据</div>
</template>

<style scoped lang="scss">
.aircraft-detail {
  background: #fff;
  border-radius: 0;
  padding: 0;
  color: #333;
  font-size: 13px;
  height: 100%;
  overflow: auto;
}

// 飞机图片 + 基本信息
.aircraft-header {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(135deg, #f5f7fa 0%, #fff 100%);
  border-bottom: 1px solid #e5e5e5;

  .aircraft-image {
    flex-shrink: 0;
    width: 80px;
    height: 60px;
    border-radius: 4px;
    overflow: hidden;
    background: #f0f0f0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .aircraft-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;

    .flight-number {
      font-size: 18px;
      font-weight: bold;
      color: #0066cc;
      line-height: 1.2;
    }

    .callsign {
      font-size: 13px;
      color: #666;
      margin-top: 2px;
    }

    .airline {
      font-size: 11px;
      color: #999;
      margin-top: 4px;
    }
  }
}

// 起飞 → 终点
.flight-route {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #fafafa;
  border-bottom: 1px solid #e5e5e5;

  .route-item {
    flex: 1;
    text-align: center;

    .route-code {
      font-size: 24px;
      font-weight: bold;
      color: #333;
      line-height: 1;
    }

    .route-pinyin {
      font-size: 11px;
      color: #999;
      margin-top: 2px;
    }

    .route-name {
      font-size: 12px;
      color: #666;
      margin-top: 2px;
      line-height: 1.3;
    }
  }

  .route-arrow {
    flex: 0 0 auto;
    margin: 0 12px;
    font-size: 20px;
    color: #ccc;
  }
}

// 时间信息
.time-info {
  display: flex;
  padding: 12px;
  border-bottom: 1px solid #e5e5e5;
  background: #fafafa;

  .time-column {
    flex: 1;
    display: flex;
    flex-direction: column;

    .time-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 8px;

      .time-header-label {
        font-size: 12px;
        color: #666;
        font-weight: 600;
      }

      .time-zone {
        font-size: 10px;
        color: #999;
        margin-top: 2px;
      }
    }

    .time-rows {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .time-row {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .time-row-label {
        font-size: 11px;
        color: #999;
      }

      .time-row-value {
        font-size: 14px;
        font-weight: 600;
        color: #0066cc;
      }
    }
  }

  .time-divider {
    width: 1px;
    height: 60px;
    background: #e5e5e5;
    margin: 0 12px;
  }
}

// 详情章节
.detail-section {
  padding: 12px;
  border-bottom: 1px solid #e5e5e5;

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

.no-data {
  background: #fff;
  border-radius: 6px;
  padding: 20px 12px;
  color: #999;
  font-size: 12px;
  text-align: center;
}
</style>
