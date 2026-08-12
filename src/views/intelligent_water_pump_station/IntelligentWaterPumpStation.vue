<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useThreeScene } from './composables/useThreeScene'
import { useStationModels } from './composables/useStationModels'
import { usePlayerCharacter } from './composables/usePlayerCharacter'
import { useScenePicking } from './composables/useScenePicking'
import { useStationRealtime } from './composables/useStationRealtime'
import { useEquipmentLabels } from './composables/useEquipmentLabels'
import type { EquipmentSource } from './types/station-equipment'
import ReservoirTooltip from './components/tooltip/ReservoirTooltip.vue'
import CoolingTowerTooltip from './components/tooltip/CoolingTowerTooltip.vue'
import CoolingTubeTooltip from './components/tooltip/CoolingTubeTooltip.vue'
import StreetlightTooltip from './components/tooltip/StreetlightTooltip.vue'
import PressureRegulatingTowerTooltip from './components/tooltip/PressureRegulatingTowerTooltip.vue'
import MixingTankTooltip from './components/tooltip/MixingTankTooltip.vue'
import FactoryBuildingTooltip from './components/tooltip/FactoryBuildingTooltip.vue'
import VerticalPressurizedTankBodyTooltip from './components/tooltip/VerticalPressurizedTankBodyTooltip.vue'
import EquipmentDrawer from './components/EquipmentDrawer.vue'
import EquipmentOverviewDrawer from './components/EquipmentOverviewDrawer.vue'

const {
  containerRef,
  scene,
  camera,
  renderer,
  controls,
  setOutlineObjects,
  onBeforeRender,
  onAfterRender,
  initScene,
} = useThreeScene()
const {
  modelsGroup,
  interactiveModels,
  loadModels,
  loading,
  loadedCount,
  totalCount,
  applyStatusFromPayload,
  getObjectByName,
  flyToByName,
} = useStationModels(scene, camera, controls, onAfterRender)
const {
  roamEnabled,
  loadRobot,
  setRoamEnabled,
} = usePlayerCharacter(scene, camera, renderer, controls, modelsGroup, onBeforeRender)
const { tooltipPosition, bindPicking, setGazePickingEnabled, selectByName } = useScenePicking(
  camera,
  renderer,
  interactiveModels,
  setOutlineObjects,
  getObjectByName,
  onBeforeRender,
)
const { initLabelRenderer, rebuildLabels } = useEquipmentLabels(
  containerRef,
  scene,
  camera,
  interactiveModels,
  onAfterRender,
)
const { start, stop } = useStationRealtime(applyStatusFromPayload)

const equipmentDrawerRef = ref<InstanceType<typeof EquipmentDrawer> | null>(null)

const onOverviewSelectSource = (source: EquipmentSource): void => {
  equipmentDrawerRef.value?.openToSource(source)
}

watch(roamEnabled, (enabled) => {
  setRoamEnabled(enabled)
  setGazePickingEnabled(enabled)
})

onMounted(async () => {
  initScene()
  initLabelRenderer()
  await loadModels()
  await loadRobot()
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
    <div v-if="roamEnabled" class="roam-crosshair" aria-hidden="true" />
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
      <FactoryBuildingTooltip :position="tooltipPosition" />
      <VerticalPressurizedTankBodyTooltip :position="tooltipPosition" />
      <EquipmentOverviewDrawer
        v-model:roam-enabled="roamEnabled"
        @select-source="onOverviewSelectSource"
      />
      <EquipmentDrawer
        ref="equipmentDrawerRef"
        :fly-to-by-name="flyToByName"
        :select-by-name="selectByName"
      />
    </template>
  </div>
</template>

<style scoped lang="scss">
.water-pump-station {
  position: relative;
  width: 100%;
  height: calc(100vh - 48px);
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

.roam-crosshair {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 14px;
  height: 14px;
  margin: -7px 0 0 -7px;
  pointer-events: none;
  z-index: 5;
  border: 2px solid rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.35);

  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    background: rgba(255, 255, 255, 0.9);
  }

  &::before {
    width: 10px;
    height: 2px;
    margin: -1px 0 0 -5px;
  }

  &::after {
    width: 2px;
    height: 10px;
    margin: -5px 0 0 -1px;
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
