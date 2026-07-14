<script setup lang="ts">
import { useAviationSelectionStore } from '@/stores/aviation-selection'
import { computed, ref } from 'vue'

const aviationSelectionStore = useAviationSelectionStore()
const currentPage = ref(1)
const pageSize = 10

const airport = computed(() => {
  const sel = aviationSelectionStore.selected
  if (sel?.sourceType === 'airport') return sel
  return null
})

const staticFlights = [
  { time: '08:10', destination: '上海浦东', code: 'CA1234', type: 'B738' },
  { time: '08:45', destination: '北京首都', code: 'CA5678', type: 'B738' },
  { time: '09:20', destination: '广州白云', code: 'MU5678', type: 'A320' },
  { time: '09:50', destination: '深圳宝安', code: 'CZ3456', type: 'B788' },
  { time: '10:30', destination: '杭州萧山', code: 'MU2345', type: 'A320' },
  { time: '10:45', destination: '成都天府', code: 'CZ9012', type: 'B789' },
  { time: '11:15', destination: '厦门高崎', code: 'MF6789', type: 'A321' },
  { time: '11:50', destination: '昆明长水', code: 'MU7890', type: 'A320' },
  { time: '12:00', destination: '西安咸阳', code: 'HU3456', type: 'A321' },
  { time: '12:40', destination: '武汉天河', code: 'CZ2345', type: 'B738' },
  { time: '13:15', destination: '重庆江北', code: 'SC8901', type: 'A319' },
  { time: '13:45', destination: '郑州新郑', code: 'CA8901', type: 'B738' },
  { time: '14:20', destination: '南京禄口', code: 'MF2345', type: 'B738' },
  { time: '14:55', destination: '长沙黄花', code: 'HU5678', type: 'A320' },
  { time: '15:30', destination: '福州长乐', code: 'MF1234', type: 'A320' },
  { time: '16:00', destination: '青岛流亭', code: 'CA3456', type: 'B788' },
  { time: '16:40', destination: '沈阳桂林', code: 'CA6789', type: 'B738' },
  { time: '17:10', destination: '上海浦东', code: 'MU4567', type: 'A321' },
  { time: '17:50', destination: '北京大兴', code: 'CA9012', type: 'B788' },
  { time: '18:20', destination: '广州白云', code: 'CZ0123', type: 'B789' },
  { time: '18:55', destination: '深圳宝安', code: 'MU8901', type: 'A320' },
  { time: '19:30', destination: '杭州萧山', code: 'CZ4567', type: 'B738' },
  { time: '20:10', destination: '成都天府', code: 'MF3456', type: 'A319' },
  { time: '20:45', destination: '西安咸阳', code: 'HU2345', type: 'B788' },
  { time: '21:15', destination: '武汉天河', code: 'CA4567', type: 'A321' },
  { time: '21:50', destination: '重庆江北', code: 'CZ5678', type: 'B738' },
  { time: '22:20', destination: '郑州新郑', code: 'MU6789', type: 'A320' },
  { time: '22:55', destination: '南京禄口', code: 'CA7890', type: 'B788' },
  { time: '23:30', destination: '长沙黄花', code: 'HU7890', type: 'A319' },
  { time: '23:55', destination: '福州长乐', code: 'CZ6789', type: 'B738' },
  { time: '00:25', destination: '青岛流亭', code: 'MU0123', type: 'A320' },
  { time: '01:00', destination: '沈阳桃仙', code: 'CA1234', type: 'B788' },
  { time: '01:35', destination: '哈尔滨太平', code: 'MF4567', type: 'B738' },
  { time: '02:10', destination: '乌鲁木齐', code: 'CZ7890', type: 'A320' },
  { time: '02:50', destination: '昆明长水', code: 'HU8901', type: 'B789' },
  { time: '03:25', destination: '南宁吴圩', code: 'MU1234', type: 'A319' },
  { time: '04:00', destination: '贵阳龙洞堡', code: 'CA5555', type: 'B738' },
  { time: '04:45', destination: '石家庄正定', code: 'CZ6666', type: 'A320' },
  { time: '05:20', destination: '太原武宿', code: 'MU7777', type: 'B789' },
  { time: '06:00', destination: '兰州中川', code: 'HU8888', type: 'A321' },
  { time: '06:40', destination: '西宁曹家堡', code: 'MF9999', type: 'B738' },
  { time: '07:15', destination: '银川河东', code: 'CA0000', type: 'A320' },
]

const paginatedFlights = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize
  const endIndex = startIndex + pageSize
  return staticFlights.slice(startIndex, endIndex)
})
</script>

<template>
  <div v-if="airport" class="aviation-detail">
    <div class="detail-header">
      <div class="detail-header__title">{{ airport.name }}</div>
      <div class="detail-header__meta detail-header__codes">
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

    <!-- 航班动态 -->
    <div class="detail-section">
      <div class="section-title">离港航班</div>
      <el-table :data="paginatedFlights" stripe size="small" class="flight-table">
        <el-table-column prop="time" label="时间" width="70" align="center" />
        <el-table-column prop="destination" label="目的地" min-width="" />
        <el-table-column prop="code" label="航班号" width="85" align="center" />
        <el-table-column prop="type" label="机型" width="65" align="center" />
      </el-table>
      <!-- 分页控制 -->
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="staticFlights.length"
        layout="total, prev, pager, next"
        class="pagination"
      />
    </div>
  </div>

  <div v-else class="aviation-detail">
    <div class="no-data">暂无机场数据</div>
  </div>
</template>

<style scoped lang="scss">
@use '../../styles/detail-shared';
</style>
