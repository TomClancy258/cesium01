<script setup lang="ts">
import { onMounted } from 'vue'
import { useThreeScene } from './composables/useThreeScene'
import { setupVaryingUniformAttribute } from './composables/varying_uniform_attribute/setupVaryingUniformAttribute'
import { setupTexture } from '@/views/shader/composables/texture/setupTexture.ts'
import { setupStepMixSmoothstep } from '@/views/shader/composables/step_ mix_ smoothstep/setupStepMixSmoothstep.ts'
import { setupSinCos } from '@/views/shader/composables/sin_cos/setupSinCos.ts'

const { containerRef, scene, onBeforeRender, initScene } = useThreeScene()

onMounted(() => {
  initScene()
  // setupVaryingUniformAttribute(scene)
  // setupTexture(scene)
  // setupStepMixSmoothstep(scene)
  setupSinCos(scene, onBeforeRender)
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
