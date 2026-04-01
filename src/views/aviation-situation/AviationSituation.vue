<script setup lang="ts">
//src/views/aviation-situation/AviationSituation.vue
import { onMounted, provide, ref, onUnmounted } from 'vue'
import AirportTooltip from './components/tooltip/AirportTooltip.vue'
import AircraftTooltip from './components/tooltip/AircraftTooltip.vue'
import DistanceSurveyHint from './components/hint/DistanceSurveyHint.vue'
import AltitudeLegend from './components/hint/AltitudeLegend.vue'
import { useCesiumViewer } from './composables/useCesiumViewer.ts'
import { useAirports } from './composables/airport/useAirports'
import { useAircrafts } from './composables/aircraft/useAircrafts'
import { useBuildings } from './composables/useBuildings'
import { useSpatialSelection } from './composables/useSpatialSelection'

import MapToolsDrawer from "./components/map-tools/MapToolsDrawer.vue"
import DetailDrawer from "./components/detail/DetailDrawer.vue"
import { useAviationSelectionStore } from '@/stores/aviationSelection'
import { useAircraftStore } from '@/stores/aircraft'
import { useAirportStore } from '@/stores/airport'
import { useSimulatedWebSocketStore } from '@/stores/simulateWebSocket'
import {clearSelectedHighlight} from "./composables/useBillboardHighlightManager"

import { useCesiumMouseEvents } from './composables/cesium-events/useCesiumMouseEvents' // 仅初始化事件监听
import { initCesiumCameraEvents  } from './composables/cesium-events/useCesiumCameraEvents'

import {useSpatialSelectStore} from "@/stores/spatialSelect.ts"
import {useMeasurementSelectionStore} from "@/stores/drawingToolSelection.ts"
import {useDistanceMeasurementStore} from "@/stores/distanceMeasurement.ts"

const simulatedWebSocketStore = useSimulatedWebSocketStore()
const { viewer: cesiumViewer, initViewer: initCesiumViewer } = useCesiumViewer('cesium-container')
const aviationSelectionStore = useAviationSelectionStore()
const aircraftStore = useAircraftStore()
const airportStore = useAirportStore()

const spatialSelectStore = useSpatialSelectStore()
const measurementSelectionStore = useMeasurementSelectionStore()
const distanceMeasurementStore = useDistanceMeasurementStore()

// 初始化飞机/机场模块（内部已自动订阅事件）
const {
  initAircrafts,
  loadAndDrawAircrafts,
  syncAircraftsData,
  tooltip: aircraftTooltip,
  filterAircrafts,
  matchedAircraftCount,
  matchedAircrafts,
  flyToMatchedAircrafts,
} = useAircrafts(cesiumViewer)

const {
  initAirports,
  loadAndDrawAirports,
  tooltip: airportTooltip,
  filterAirports,
  matchedAirportCount,
} = useAirports(cesiumViewer)

const {
  initBuildings,
} = useBuildings(cesiumViewer)

const {
  initSpatialSelection,
} = useSpatialSelection(cesiumViewer)

// 初始化Cesium事件监听（仅发布事件，不处理业务）
const { initEvents: initCesiumEvents, destroyEvents } = useCesiumMouseEvents(cesiumViewer)

const detailDrawerRef = ref(null)

onMounted(async () => {
  initCesiumViewer() // 初始化Cesium Viewer
  initCesiumEvents() // 初始化事件监听（仅拾取和发布）

  initCesiumCameraEvents(cesiumViewer)

  initAirports()
  await loadAndDrawAirports()

  initAircrafts()
  initSpatialSelection()
  // await loadAndDrawAircrafts() // 按需启用

  simulatedWebSocketStore.open()

  // initBuildings()
})



onUnmounted(() => {
  destroyEvents() // 销毁Cesium事件监听
  simulatedWebSocketStore.close()
  aviationSelectionStore.clearSelected()
  // aviationSelectionStore.clearHovered()
  aviationSelectionStore.clearLastSelectedIcao24()
  aircraftStore.resetAircraftFilterForm()
  aircraftStore.clearMatchedAircrafts()
  aircraftStore.resetAircraftTrajectoryOptions()
  airportStore.resetAirportFilterForm()

  spatialSelectStore.resetSpatialSelectFilterForm()
  spatialSelectStore.clearActiveAircraftSpatialSelection()
  spatialSelectStore.clearActiveAirportSpatialSelection()
  spatialSelectStore.clearAllFinishedSelections()

  measurementSelectionStore.clearDrawingDataSource()
  measurementSelectionStore.clearSelected()


  distanceMeasurementStore.clearAllFinishedSelections()

})

// 提供过滤/显隐方法（原有逻辑保留）
provide('filterAircrafts', filterAircrafts)
provide('filterAirports', filterAirports)
provide('matchedAircraftCount', matchedAircraftCount)
provide('matchedAircrafts', matchedAircrafts)
provide('matchedAirportCount', matchedAirportCount)
provide('flyToMatchedAircrafts', flyToMatchedAircrafts)
</script>

<template>
  <!-- 原有模板完全保留 -->
  <div>
    <div id="cesium-container"></div>
    <DistanceSurveyHint/>
    <AltitudeLegend/>
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

</style>
<style lang="scss">
body {
  margin: 0;
}
</style>
