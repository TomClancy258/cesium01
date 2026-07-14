<script setup lang="ts">
//src/views/aviation-situation/AviationSituation.vue
import { onMounted, provide, ref, onUnmounted, computed } from 'vue'
import AirportTooltip from './components/tooltip/AirportTooltip.vue'
import AircraftTooltip from './components/tooltip/AircraftTooltip.vue'
import SatelliteTooltip from './components/tooltip/SatelliteTooltip.vue'
import OSMBuildingTooltip from './components/tooltip/OSMBuildingTooltip.vue'
import ControlZoneTooltip from './components/tooltip/ControlZoneTooltip.vue'
import DistanceSurveyHint from './components/hint/DistanceSurveyHint.vue'
import AltitudeLegend from './components/hint/AltitudeLegend.vue'
import { useCesiumViewer } from './composables/useCesiumViewer.ts'
import { useAviationWiring } from './composables/useAviationWiring'
import { useBuildings } from './composables/useBuildings'
import { useSpatialSelection } from './composables/useSpatialSelection'

import MapToolsDrawer from './components/map-tools/MapToolsDrawer.vue'
import DetailDrawer from './components/detail/DetailDrawer.vue'
import { useAviationSelectionStore } from '@/stores/aviation-selection'
import { useAircraftStore } from '@/stores/aircraft'
import { useAirportStore } from '@/stores/airport'
import { useSimulatedWebSocketStore } from '@/stores/simulate-websocket'
import { clearSelectedBillboardHighlight } from './composables/highlight-manager/billboard-highlight-manager'

import { initCesiumCameraEvents } from './composables/cesium-events/cesium-camera-events'

import { useSpatialSelectionStore } from '@/stores/spatial-selection.ts'
import { useDrawingToolStore } from '@/stores/drawing-tool.ts'
import { useDistanceMeasurementStore } from '@/stores/distance-measurement.ts'

import { clearAllBillboardHighlight } from '@/views/aviation-situation/composables/highlight-manager/billboard-highlight-manager.ts'
import { clearAllDrawingToolHighlight } from '@/views/aviation-situation/composables/highlight-manager/drawing-tool-highlight-manager.ts'
import { clearAllControlZoneHighlight } from '@/views/aviation-situation/composables/highlight-manager/control-zone-highlight-manager'
import { clearSelectedSatelliteHighlight } from '@/views/aviation-situation/composables/highlight-manager/satellite-highlight-manager'
import { useRegionSelectionStore } from '@/stores/region-selection'

import {drawPolylineGeometry} from "@/views/aviation-situation/composables/cesium-lessons/intermediate-tutorial/lesson02-polylineGeometry.ts"
import {drawPolylineGeometryAppearance} from "@/views/aviation-situation/composables/cesium-lessons/intermediate-tutorial/lesson04-polylineGeometry-appearance.ts"
import { drawPolylineGeometryColorGradient } from '@/views/aviation-situation/composables/cesium-lessons/intermediate-tutorial/lesson04-polylineGeometry-color-gradient.ts'

import { drawCubeUsingVertexArray } from '@/views/aviation-situation/composables/cesium-lessons/cesium-advanced-course/lesson12-draw-cube-using-vertex-array.ts'
import { addTexture2Cube } from '@/views/aviation-situation/composables/cesium-lessons/cesium-advanced-course/lesson13-add-texture-to-cube.ts'
import { changeCubePrimitiveLngLatAlt } from '@/views/aviation-situation/composables/cesium-lessons/cesium-advanced-course/lesson13-01-cubePrimitive-change-lngLatAlt'
import { customVertexColorSettings } from '@/views/aviation-situation/composables/cesium-lessons/cesium-advanced-course/lesson14-custom-vertex-color-settings'
import { drawCubeThroughShader } from '@/views/aviation-situation/composables/cesium-lessons/cesium-advanced-course/lesson15-shader'
import { drawCubePrimitiveDynamicTexture } from '@/views/aviation-situation/composables/cesium-lessons/cesium-advanced-course/lesson16-cubePrimitive-dynamic-texture'

import { applyingCustomShader } from '@/views/aviation-situation/composables/cesium-lessons/custom-shader/lesson01-applying-a-custom-shader.ts'
import { drawColorGradient } from '@/views/aviation-situation/composables/cesium-lessons/custom-shader/lesson02-color-gradient'
import { drawGraphicsInTexture } from '@/views/aviation-situation/composables/cesium-lessons/custom-shader/lesson03-draw-graphics-in-texture'
import { drawGraphicsInTextureByTeacher } from '@/views/aviation-situation/composables/cesium-lessons/custom-shader/lesson04-teacher.ts'
import { useOSMBuilding } from '@/views/aviation-situation/composables/osm-building/useOSMBuilding'
import { useControlZone } from '@/views/aviation-situation/composables/control-zone/useControlZone'
import {
  clearAllOSMBuildingHighlight
} from '@/views/aviation-situation/composables/highlight-manager/osm-building-highlight-manager'
import { useOSMBuildingStore } from '@/stores/osm-building'

const simulatedWebSocketStore = useSimulatedWebSocketStore()
const { viewer: cesiumViewer, initViewer: initCesiumViewer } = useCesiumViewer('cesium-container')
const aviationSelectionStore = useAviationSelectionStore()
const aircraftStore = useAircraftStore()
const airportStore = useAirportStore()

const spatialSelectionStore = useSpatialSelectionStore()
const drawingToolStore = useDrawingToolStore()
const regionSelectionStore = useRegionSelectionStore()
const distanceMeasurementStore = useDistanceMeasurementStore()
const osmBuildingStore = useOSMBuildingStore()

const {
  mouseEvents: {
    initEvents: initCesiumEvents,
    destroyEvents,
  },
  aircraft: {
    initAircrafts,
    loadAndDrawAircrafts,
    tooltip: aircraftTooltip,
    filterAircrafts,
    flyToAircraftByIcao24,
  },
  airport: {
    initAirports,
    loadAndDrawAirports,
    tooltip: airportTooltip,
    filterAirports,
    flyToAirportByIcao,
  },
  satellite: {
    initSatellites,
    loadAndDrawSatellites,
    tooltip: satelliteTooltip,
    filterSatellites,
    flyToSatelliteById,
  },
} = useAviationWiring(cesiumViewer)

const matchedAircraftCount = computed(() => aircraftStore.matchedAircrafts.size)
const matchedAirportCount = computed(() => airportStore.matchedAirports.size)

const { initBuildings } = useBuildings(cesiumViewer)
const {
  initOSMBuildings,
  tooltip:osmBuildingTooltip,
  filterOSMBuildings,
} = useOSMBuilding(cesiumViewer)

const {
  initControlZones,
  tooltip:controlZoneTooltip,
} = useControlZone(cesiumViewer)

const { initSpatialSelection } = useSpatialSelection(cesiumViewer)

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

  initSatellites()
  await loadAndDrawSatellites()

  // test01()
  // initBuildings()
  initOSMBuildings()
  initControlZones()

  // drawPolylineGeometry(cesiumViewer)
  // drawPolylineGeometryAppearance(cesiumViewer)
  // drawPolylineGeometryColorGradient(cesiumViewer)

  // drawCubeUsingVertexArray(cesiumViewer)
  // addTexture2Cube(cesiumViewer)
  // changeCubePrimitiveLngLatAlt(cesiumViewer)
  // customVertexColorSettings(cesiumViewer)
  // drawCubeThroughShader(cesiumViewer)
  // drawCubePrimitiveDynamicTexture(cesiumViewer)

  // applyingCustomShader(cesiumViewer)
  // drawColorGradient(cesiumViewer)
  // drawGraphicsInTexture(cesiumViewer)
  // drawGraphicsInTextureByTeacher(cesiumViewer)

  // let test01 = () => {
  //   let i = 0
  //   return function test02() {
  //     i++
  //     console.log("i", i);
  //   }
  // }
  // const ttt=test01()
  // ttt()
  // ttt()
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

  drawingToolStore.resetSpatialSelectFilterForm()
  spatialSelectionStore.clearActiveAircraftSpatialSelection()
  spatialSelectionStore.clearActiveAirportSpatialSelection()
  spatialSelectionStore.clearAllFinishedSelections()

  drawingToolStore.clearDrawingDataSource()
  regionSelectionStore.clearSelected()

  osmBuildingStore.resetOSMBuildingFilterForm()

  distanceMeasurementStore.clearAllFinishedSelections()

  clearAllBillboardHighlight()
  clearAllDrawingToolHighlight()
  clearAllControlZoneHighlight()
  clearAllOSMBuildingHighlight()
})

const test01 = () => {
  const obj1 = {
    name: 'frank',
    age: 18,
    friendsArray: ['jack', 'tom'],
    jack: {
      name: 'jack',
      age: 30,
    },
  }
  const obj2 = structuredClone(obj1)
  obj2.friendsArray[0] = 'java'
  obj2.jack.name = 'jack01'
  console.log('obj1', obj1)
  console.log('obj2', obj2)
}

// 提供过滤/显隐方法（原有逻辑保留）
provide('filterAircrafts', filterAircrafts)
provide('filterAirports', filterAirports)
provide('filterSatellites', filterSatellites)
provide('matchedAircraftCount', matchedAircraftCount)
provide('matchedAircrafts', aircraftStore.matchedAircrafts)
provide('matchedAirportCount', matchedAirportCount)
provide('flyToAircraftByIcao24', flyToAircraftByIcao24)
provide('flyToAirportByIcao', flyToAirportByIcao)
provide('flyToSatelliteById', flyToSatelliteById)
provide('filterOSMBuildings', filterOSMBuildings)
</script>

<template>
  <!-- 原有模板完全保留 -->
  <div>
    <div id="cesium-container"></div>
    <DistanceSurveyHint />
    <AltitudeLegend />
    <AirportTooltip :tooltip="airportTooltip" />
    <AircraftTooltip :tooltip="aircraftTooltip" />
    <SatelliteTooltip :tooltip="satelliteTooltip" />
    <OSMBuildingTooltip :tooltip="osmBuildingTooltip" />
    <ControlZoneTooltip :tooltip="controlZoneTooltip" />
    <DetailDrawer />
    <!--    <DetailDrawer ref="detailDrawerRef" @close="clearSelectedBillboardHighlight" />-->
    <MapToolsDrawer />
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
