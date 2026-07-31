<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useThreeScene } from './composables/useThreeScene'
import { useStationModels } from './composables/useStationModels'
import { useScenePicking } from './composables/useScenePicking'
import { useStationRealtime } from './composables/useStationRealtime'
import { TABLE_LABEL } from './types/station-equipment'

const { containerRef, scene, camera, renderer, controls, initScene } = useThreeScene()
const { interactiveModels, objectById, loadModels, loading, loadedCount, totalCount } =
  useStationModels(scene, camera, controls)
const { hoveredName, selectedName, bindPicking } = useScenePicking(
  camera,
  renderer,
  interactiveModels,
)
const { store, start, stop } = useStationRealtime(objectById)
const { hoveredRow, selectedRow, tick, connected, activeTableKey } = storeToRefs(store)

const tooltipText = computed(() => {
  const row = hoveredRow.value
  if (!row) return ''
  const statusText =
    row.status === 'normal' ? '正常' : row.status === 'alarm' ? '告警' : '故障'
  return `${row.text}（${row.name}）· ${statusText}`
})

watch(hoveredName, (id) => {
  store.setHoveredId(id)
})

watch(selectedName, (id) => {
  store.setSelectedId(id)
  // 后续：打开下侧 drawer，切到 activeTableKey，分页定位 selectedId 行
})

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
        <div>WS: {{ connected ? '模拟推送中' : '未连接' }} · tick {{ tick }}</div>
        <div>Hover: {{ hoveredName || '-' }}</div>
        <div>Click: {{ selectedName || '-' }}</div>
        <div v-if="selectedRow">
          表: {{ TABLE_LABEL[activeTableKey] }} · {{ selectedRow.text }} ·
          {{ selectedRow.status }}
        </div>
      </div>
      <div v-if="tooltipText" class="hover-tooltip">{{ tooltipText }}</div>
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
.pick-tip,
.hover-tooltip {
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

.hover-tooltip {
  left: 12px;
  bottom: 12px;
  max-width: 60%;
}
</style>
