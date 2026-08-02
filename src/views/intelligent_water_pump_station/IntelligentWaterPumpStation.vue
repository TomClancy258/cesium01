<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useStationEquipmentStore } from '@/stores/station-equipment'
import { useThreeScene } from './composables/useThreeScene'
import { useStationModels } from './composables/useStationModels'
import { useScenePicking } from './composables/useScenePicking'
import { useStationRealtime } from './composables/useStationRealtime'
import ReservoirTooltip from './components/tooltip/ReservoirTooltip.vue'
import CoolingTowerTooltip from './components/tooltip/CoolingTowerTooltip.vue'
import CoolingTubeTooltip from './components/tooltip/CoolingTubeTooltip.vue'
import StreetlightTooltip from './components/tooltip/StreetlightTooltip.vue'
import PressureRegulatingTowerTooltip from './components/tooltip/PressureRegulatingTowerTooltip.vue'
import MixingTankTooltip from './components/tooltip/MixingTankTooltip.vue'
import HouseTooltip from './components/tooltip/HouseTooltip.vue'
import VerticalPressurizedTankBodyTooltip from './components/tooltip/VerticalPressurizedTankBodyTooltip.vue'
import EquipmentDrawer from './components/EquipmentDrawer.vue'
import { TABLE_LABEL } from './types/station-equipment'

const {
  containerRef,
  scene,
  camera,
  renderer,
  controls,
  setOutlineObjects,
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
const { start, stop } = useStationRealtime(applyStatusFromPayload)
/** Pinia store 单例；模板里用 store.xxx 保持响应式，不必 storeToRefs */
const store = useStationEquipmentStore()

const selectEquipmentByName = (name: string): void => {
  selectByName(name, objectById)
}

onMounted(async () => {
  initScene()
  await loadModels()
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
      <div class="pick-tip">
        <div>WS: {{ store.connected ? '模拟推送中' : '未连接' }} · index {{ store.index }}</div>
        <div>
          Hover:
          {{ store.hovered ? `${store.hovered.source}/${store.hovered.name}` : '-' }}
        </div>
        <div>
          Click:
          {{ store.selected ? `${store.selected.source}/${store.selected.name}` : '-' }}
        </div>
        <div v-if="store.selectedRow">
          表: {{ TABLE_LABEL[store.activeTableKey] }} · {{ store.selectedRow.text }} ·
          {{ store.selectedRow.status }}
        </div>
      </div>
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
  width: 100%;
  height: 100%;

  :deep(canvas) {
    display: block;
    width: 100%;
    height: 100%;
  }
}

.loading-tip,
.pick-tip {
  position: absolute;
  padding: 8px 14px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-size: 14px;
  pointer-events: none;
}

.loading-tip {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.pick-tip {
  left: 12px;
  top: 12px;
  line-height: 1.6;
  z-index: 2;
}
</style>
