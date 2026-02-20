<script setup lang="ts">
//AviationSituation.vue
import { onMounted,provide,ref,onUnmounted,computed } from 'vue'
import AirportTooltip from './components/tooltip/AirportTooltip.vue'
import AircraftTooltip from './components/tooltip/AircraftTooltip.vue'
import * as Cesium from 'cesium'
// const cesiumToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4YjA3NDUxNC0wN2YzLTQwOGQtYjMxNC1jNmE1M2NkNTkwZDEiLCJpZCI6Njc5MDksImlhdCI6MTYzMjE5MjkyMX0.6JYpOUd932E6SWdxIFp6LhVBI-rP6b3X4moLLK1B5IU'
// Cesium.Ion.defaultAccessToken = cesiumToken;
import { useCesiumViewer } from './composables/useCesiumViewer.ts'

import { useAirports } from './composables/useAirports'
import { useAircrafts } from './composables/useAircrafts'
import { useCesiumEvents } from './composables/useCesiumEvents'

import MapToolsDrawer from "./components/map-tools/MapToolsDrawer.vue"
import DetailDrawer from "./components/detail/DetailDrawer.vue"
import type{ AircraftBaseProperties,AircraftSelectedData } from '@/views/aviation-situation/types/aircraft'
import type{ AirportBaseProperties,AirportSelectedData } from '@/views/aviation-situation/types/airport'
import { useHighlightStore } from '@/stores/highlight'

import {clearHoveredHighlight,clearSelectedHighlight} from "./composables/useHighlightManager"
import { useSimulatedWebSocketStore } from '@/stores/simulateWebSocket'
const simulatedWebSocketStore=useSimulatedWebSocketStore()

const { viewer:cesiumViewer, initViewer: initCesiumViewer } =
  useCesiumViewer('cesium-container')

const highlightStore = useHighlightStore()

const {
  initAircrafts,
  loadAndDrawAircrafts,
  syncAircraftsData,

  tooltip: aircraftTooltip,
  showAircraftTooltip,
  hideAircraftTooltip,

  filterAircrafts,
  toggleAircraftsVisibility,

  highlightAircraftOnHover,

  highlightAircraftOnSelect,

} = useAircrafts(cesiumViewer)

const {
  initAirports,
  loadAndDrawAirports,

  tooltip: airportTooltip,
  showAirportTooltip,
  hideAirportTooltip,

  filterAirports,
  toggleAirportsVisibility,

  highlightAirportOnHover,

  highlightAirportOnSelect
} = useAirports(cesiumViewer)

const detailDrawerRef = ref(null)

// ✅ 在这里连接事件和 UI
const { initEvents: initCesiumEvents } = useCesiumEvents(cesiumViewer, {
  onAircraftHover: (properties:AircraftBaseProperties, position: Cesium.Cartesian2,billboard:Cesium.Billboard) => {
    showAircraftTooltip(position, properties)
    highlightAircraftOnHover(billboard)
  },
  onAircraftLeave: () => {
    hideAircraftTooltip()
    clearHoveredHighlight()
  },
  onAircraftLeftClick: (aircraftSelectedData:AircraftSelectedData,billboard:Cesium.Billboard) => {
    highlightAircraftOnSelect(aircraftSelectedData,billboard)
  },

  onAirportHover: (properties:AirportBaseProperties, position: Cesium.Cartesian2,billboard:Cesium.Billboard) => {
    showAirportTooltip(position, properties)
    highlightAirportOnHover(billboard)
  },
  onAirportLeave: () => {
    hideAirportTooltip()
    clearHoveredHighlight()
  },
  onAirportLeftClick: (airportSelectedData:AirportSelectedData,billboard:Cesium.Billboard) => {
    highlightAirportOnSelect(airportSelectedData,billboard)
  },
})
// let aircraftsTimer=null
onMounted(async () => {
  initCesiumViewer()

  initAirports()
  await loadAndDrawAirports()

  initAircrafts()
  initCesiumEvents()

  // loadAndDrawAircrafts()

  // setTimeout(async () => {
  //   initAirports() // 初始化机场配置（非数据加载）
  //   await loadAndDrawAirports() // 加载并绘制机场
  // }, 0)

  // let aircraftsIndex:number=0
  // aircraftsTimer= setInterval(async ()=>{
  //   aircraftsIndex++
  //   await syncAircraftsData(aircraftsIndex)
  // },5000)

  simulatedWebSocketStore.open()
})

const isAltitudeLegendVisible = computed(() => {
  return highlightStore.selected && highlightStore.selected.sourceType === 'aircraft'
})


onUnmounted(()=>{
  // clearInterval(aircraftsTimer)

  simulatedWebSocketStore.close()
})

provide('filterAircrafts', filterAircrafts)
provide('filterAirports', filterAirports)
provide('toggleAircraftsVisibility', toggleAircraftsVisibility)
provide('toggleAirportsVisibility', toggleAirportsVisibility)

</script>

<template>
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
  pointer-events: none; // 避免遮挡地图交互
}

</style>
<style lang="scss">
body {
  margin: 0;
}
</style>
