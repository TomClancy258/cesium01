<script setup lang="ts">
import { onMounted,provide,ref,onUnmounted } from 'vue'
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

import {clearHoveredHighlight,clearSelectedHighlight} from "./composables/useHighlightManager"

const { viewer:cesiumViewer, initViewer: initCesiumViewer } =
  useCesiumViewer('cesium-container')

const {
  initAircrafts,
  loadAndDrawAircrafts,
  updateAircrafts,

  tooltip: aircraftTooltip,
  showAircraftTooltip,
  hideAircraftTooltip,

  filterAircrafts,
  toggleAircraftsVisibility,

  highlightAircraftOnHover,

  highlightAircraftOnSelect,

  loadAndDrawAircraftRouteFull,
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
let aircraftsTimer=null
onMounted(async () => {
  initCesiumViewer()

  initAirports()
  await loadAndDrawAirports()

  initAircrafts()
  initCesiumEvents()

  // let aircraftsIndex:number=0
  loadAndDrawAircrafts()
  // aircraftsTimer= setInterval(async ()=>{
  //   aircraftsIndex++
  //   await loadAndDrawAircrafts(aircraftsIndex)
  // },2000)


  let aircraftsIndex:number=0
  aircraftsTimer= setInterval(async ()=>{
    aircraftsIndex++
    await updateAircrafts(aircraftsIndex)
  },5000)
})

onUnmounted(()=>{
  clearTimeout(aircraftsTimer)
})

provide('filterAircrafts', filterAircrafts)
provide('filterAirports', filterAirports)
provide('toggleAircraftsVisibility', toggleAircraftsVisibility)
provide('toggleAirportsVisibility', toggleAirportsVisibility)

</script>

<template>
  <div>
<!--    值{{useHighlightStore().selectedBillboard}} |-->
<!--    是否为null：{{useHighlightStore().selectedBillboard===null}} |-->
<!--    typeof：{{typeof useHighlightStore().selectedBillboard}}-->
    <div id="cesium-container"></div>
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
</style>
<style lang="scss">
body {
  margin: 0;
}
</style>
