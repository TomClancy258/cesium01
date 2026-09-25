<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useThreeScene } from './composables/useThreeScene'
import { setupWebgpuBasics } from './composables/setupWebgpuBasics'
import { setupPatterns } from '@/views/webgpu-tsl/composables/setupPatterns.ts'

const { containerRef, scene, camera, renderer, controls, initScene } =
  useThreeScene()

let disposeBasics: (() => void) | undefined
let disposePatterns: (() => void) | undefined

onMounted(async () => {
  await initScene()
  // disposeBasics = setupWebgpuBasics({
  //   scene,
  //   camera,
  //   renderer,
  //   controls,
  // })?.dispose
  disposePatterns = setupPatterns({
    scene,
    camera,
    renderer,
    controls,
  })?.dispose
})

onUnmounted(() => {
  disposeBasics?.()
  disposeBasics = undefined
})
</script>

<template>
  <div class="shader-page">
    <div ref="containerRef" class="three-container"></div>
  </div>
</template>

<style scoped lang="scss">
.shader-page {
  position: relative;
  width: 100%;
  height: calc(100vh - 48px);
  overflow: hidden;
}

.three-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #0b1220;

  :deep(canvas) {
    display: block;
    width: 100%;
    height: 100%;
  }
}
</style>
