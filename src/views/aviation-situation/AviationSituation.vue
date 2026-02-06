<script setup lang="ts">
import { onMounted,provide } from 'vue'
import AirportTooltip from './components/AirportTooltip.vue'
import AircraftTooltip from './components/AircraftTooltip.vue'
import * as Cesium from 'cesium'
// const cesiumToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4YjA3NDUxNC0wN2YzLTQwOGQtYjMxNC1jNmE1M2NkNTkwZDEiLCJpZCI6Njc5MDksImlhdCI6MTYzMjE5MjkyMX0.6JYpOUd932E6SWdxIFp6LhVBI-rP6b3X4moLLK1B5IU'
// Cesium.Ion.defaultAccessToken = cesiumToken;
import { useCesiumViewer } from './composables/useCesiumViewer.ts'
import { useAirports } from './composables/useAirports'
import { useAircrafts } from './composables/useAircrafts'
import { useCesiumEvents } from './composables/useCesiumEvents'

import MapToolsDrawer from "./components/map-tools/MapToolsDrawer.vue"
import type{ AircraftBaseProperties } from '@/views/aviation-situation/types/aircraft'
import type{ AirportBaseProperties } from '@/views/aviation-situation/types/airport'

const { viewer:cesiumViewer, initViewer: initCesiumViewer } =
  useCesiumViewer('cesium-container')
const {
  initAirports,
  loadAndDrawAirports,
  showAirportTooltip,
  hideAirportTooltip,
  tooltip: airportTooltip,
  highlightAirportOnHover,
  filterAirports,
} = useAirports(cesiumViewer)

const {
  initAircrafts,
  loadAndDrawAircrafts,
  showAircraftTooltip,
  hideAircraftTooltip,
  filterAircrafts,
  highlightAircraftOnHover,
  tooltip: aircraftTooltip,
} = useAircrafts(cesiumViewer)

// ✅ 在这里连接事件和 UI
const { initEvents: initCesiumEvents } = useCesiumEvents(cesiumViewer, {
  onAirportHover: (properties:AirportBaseProperties, position: Cesium.Cartesian2,billboard:Cesium.Billboard) => {
    if (properties && position) {
      showAirportTooltip(position, properties)
      highlightAirportOnHover(billboard)
    }
  },
  onAirportLeave: () => {
    hideAirportTooltip()
  },

  onAircraftHover: (properties:AircraftBaseProperties, position: Cesium.Cartesian2,billboard:Cesium.Billboard) => {
    if (properties && position) {
      showAircraftTooltip(position, properties)
      highlightAircraftOnHover(billboard)
    }
  },
  onAircraftLeave: () => {
    hideAircraftTooltip()
  },
})

onMounted(async () => {
  initCesiumViewer()

  initAirports()
  await loadAndDrawAirports()

  initAircrafts()
  await loadAndDrawAircrafts()

  initCesiumEvents()

})

provide('filterAircrafts', filterAircrafts)
provide('filterAirports', filterAirports)
</script>

<template>
  <div>
    <div id="cesium-container"></div>
    <AirportTooltip :tooltip="airportTooltip" />
    <AircraftTooltip :tooltip="aircraftTooltip" />
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
</style>
<style lang="scss">
body {
  margin: 0;
}
</style>
