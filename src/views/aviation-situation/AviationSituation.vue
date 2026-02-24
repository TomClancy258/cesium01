<script setup lang="ts">
import { onMounted, provide, ref, onUnmounted, computed } from 'vue'
import AirportTooltip from './components/tooltip/AirportTooltip.vue'
import AircraftTooltip from './components/tooltip/AircraftTooltip.vue'
import { useCesiumViewer } from './composables/useCesiumViewer.ts'
import { useAirports } from './composables/useAirports'
import { useAircrafts } from './composables/useAircrafts'
import { useCesiumEvents } from './composables/useCesiumEvents' // 仅初始化事件监听
import MapToolsDrawer from "./components/map-tools/MapToolsDrawer.vue"
import DetailDrawer from "./components/detail/DetailDrawer.vue"
import { useHighlightStore } from '@/stores/highlight'
import { useSimulatedWebSocketStore } from '@/stores/simulateWebSocket'
import {clearSelectedHighlight} from "./composables/useHighlightManager"
import { provideCesiumCameraEvents } from './composables/useCesiumCameraEvents'

const simulatedWebSocketStore = useSimulatedWebSocketStore()
const { viewer: cesiumViewer, initViewer: initCesiumViewer } = useCesiumViewer('cesium-container')
const highlightStore = useHighlightStore()

// 2. 先执行 provide（关键：在 useAirports 之前）
const { initCameraEvents, onCameraEvent } = provideCesiumCameraEvents(cesiumViewer)

// 初始化飞机/机场模块（内部已自动订阅事件）
const {
  initAircrafts,
  loadAndDrawAircrafts,
  syncAircraftsData,
  tooltip: aircraftTooltip,
  filterAircrafts,
  matchedAircraftCount,
} = useAircrafts(cesiumViewer,onCameraEvent)

const {
  initAirports,
  loadAndDrawAirports,
  tooltip: airportTooltip,
  filterAirports,
  matchedAirportCount,
} = useAirports(cesiumViewer,onCameraEvent)

// 初始化Cesium事件监听（仅发布事件，不处理业务）
const { initEvents: initCesiumEvents, destroyEvents } = useCesiumEvents(cesiumViewer)

const detailDrawerRef = ref(null)

onMounted(async () => {
  initCesiumViewer() // 初始化Cesium Viewer
  initCesiumEvents() // 初始化事件监听（仅拾取和发布）

  initCameraEvents()

  initAirports()
  await loadAndDrawAirports()

  initAircrafts()
  // await loadAndDrawAircrafts() // 按需启用

  simulatedWebSocketStore.open()
})

const isAltitudeLegendVisible = computed(() => {
  return highlightStore.selected && highlightStore.selected.sourceType === 'aircraft'
})

onUnmounted(() => {
  destroyEvents() // 销毁Cesium事件监听
  simulatedWebSocketStore.close()
  highlightStore.clearSelected()
})

// 提供过滤/显隐方法（原有逻辑保留）
provide('filterAircrafts', filterAircrafts)
provide('filterAirports', filterAirports)
provide('matchedAircraftCount', matchedAircraftCount)
provide('matchedAirportCount', matchedAirportCount)
</script>

<template>
  <!-- 原有模板完全保留 -->
  <div>
    <div id="cesium-container"></div>
    <img
      v-show="isAltitudeLegendVisible"
      src="@/assets/img/map/altitude-legend.svg"
      class="altitude-legend"
      alt="高度图例"
    />
    <AirportTooltip :tooltip="airportTooltip" />
    <AircraftTooltip :tooltip="aircraftTooltip" />
    <DetailDrawer ref="detailDrawerRef" @close="clearSelectedHighlight"/>
    <MapToolsDrawer/>
  </div>
</template>

<!-- 原有样式完全保留 -->
<style scoped lang="scss">
#cesium-container {
  width: 100vw;
  height: 95vh;
}

body {
  margin: 0 !important;
}

.altitude-legend {
  position: fixed;
  bottom: 20px;
  right: 30px;
  width: 50vw;
  pointer-events: none;
}
</style>
<style lang="scss">
body {
  margin: 0;
}
</style>
