<script setup lang="ts">
import { onMounted } from 'vue'
import { useThreeScene } from './composables/useThreeScene'
import { useStationModels } from './composables/useStationModels'
import { useScenePicking } from './composables/useScenePicking'

const { containerRef, scene, camera, renderer, controls, initScene } = useThreeScene()
const { interactiveModels, loadModels, loading, loadedCount, totalCount } = useStationModels(
  scene,
  camera,
  controls,
)
const { hoveredName, selectedName, bindPicking } = useScenePicking(
  camera,
  renderer,
  interactiveModels,
)

onMounted(async () => {
  initScene()
  await loadModels()
  bindPicking()
})
</script>

<template>
  <div class="water-pump-station">
    <div ref="containerRef" class="three-container"></div>
    <div v-if="loading" class="loading-tip">
      模型加载中 {{ loadedCount }} / {{ totalCount }}
    </div>
    <div v-else class="pick-tip">
      <div>Hover: {{ hoveredName || '-' }}</div>
      <div>Click: {{ selectedName || '-' }}</div>
    </div>
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
}
</style>
