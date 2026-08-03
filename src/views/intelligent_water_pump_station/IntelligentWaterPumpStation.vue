<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useThreeScene } from './composables/useThreeScene'
import { useStationModels } from './composables/useStationModels'
import { useScenePicking } from './composables/useScenePicking'
import { useStationRealtime } from './composables/useStationRealtime'
import { useEquipmentLabels } from './composables/useEquipmentLabels'
import ReservoirTooltip from './components/tooltip/ReservoirTooltip.vue'
import CoolingTowerTooltip from './components/tooltip/CoolingTowerTooltip.vue'
import CoolingTubeTooltip from './components/tooltip/CoolingTubeTooltip.vue'
import StreetlightTooltip from './components/tooltip/StreetlightTooltip.vue'
import PressureRegulatingTowerTooltip from './components/tooltip/PressureRegulatingTowerTooltip.vue'
import MixingTankTooltip from './components/tooltip/MixingTankTooltip.vue'
import HouseTooltip from './components/tooltip/HouseTooltip.vue'
import VerticalPressurizedTankBodyTooltip from './components/tooltip/VerticalPressurizedTankBodyTooltip.vue'
import EquipmentDrawer from './components/EquipmentDrawer.vue'

const {
  containerRef,
  scene,
  camera,
  renderer,
  controls,
  setOutlineObjects,
  onAfterRender,
  initScene,
} = useThreeScene()
const {
  interactiveModels,
  objectById,
  loadModels,
  loading,
  loadedCount,
  totalCount,
  applyStatusFromPayload,
  flyToByName,
} = useStationModels(scene, camera, controls)
const { tooltipPosition, bindPicking, selectByName } = useScenePicking(
  camera,
  renderer,
  interactiveModels,
  setOutlineObjects,
)
const { initLabelRenderer, rebuildLabels } = useEquipmentLabels(
  containerRef,
  scene,
  camera,
  interactiveModels,
  onAfterRender,
)
const { start, stop } = useStationRealtime(applyStatusFromPayload)

const selectEquipmentByName = (name: string): void => {
  selectByName(name, objectById)
}

onMounted(async () => {
  initScene()
  initLabelRenderer()
  await loadModels()
  rebuildLabels()
  bindPicking()
  start()
})

onUnmounted(() => {
  stop()
})
</script>

<template>
  <div class="water-pump-station">
    <div ref="containerRef" class="three-container"></div>
    <div v-if="loading" class="loading-tip">
      模型加载中 {{ loadedCount }} / {{ totalCount }}
    </div>
    <template v-else>
      <ReservoirTooltip :position="tooltipPosition" />
      <CoolingTowerTooltip :position="tooltipPosition" />
      <CoolingTubeTooltip :position="tooltipPosition" />
      <StreetlightTooltip :position="tooltipPosition" />
      <PressureRegulatingTowerTooltip :position="tooltipPosition" />
      <MixingTankTooltip :position="tooltipPosition" />
      <HouseTooltip :position="tooltipPosition" />
      <VerticalPressurizedTankBodyTooltip :position="tooltipPosition" />
      <EquipmentDrawer
        :fly-to-by-name="flyToByName"
        :select-by-name="selectEquipmentByName"
      />
    </template>
  </div>
</template>

<style scoped lang="scss">
.water-pump-station {
  position: relative;
  width: 100%;
  height: 95vh;
  overflow: hidden;
}

.three-container {
  position: relative;
  width: 100%;
  height: 100%;
  /* composer/setSize 间隙时的兜底，避免透出路由页白底 */
  background: #0b1220;

  :deep(canvas) {
    display: block;
    width: 100%;
    height: 100%;
  }
}

.loading-tip {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  padding: 8px 14px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-size: 14px;
  pointer-events: none;
}
</style>
