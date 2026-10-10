<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useThreeScene } from './composables/useThreeScene'
import { setupWebgpuBasics } from './composables/setupWebgpuBasics'
import { setupPatterns } from '@/views/webgpu-tsl/composables/setupPatterns.ts'
import { setupCoffeSmoke } from '@/views/webgpu-tsl/composables/setupCoffeSmoke.ts'
import { setupPostProcessing } from '@/views/webgpu-tsl/composables/post-processing/setupPostProcessing.ts'
import { setupShied } from '@/views/webgpu-tsl/composables/shield/setupShied.ts'
import { setupMagicExplosion } from '@/views/webgpu-tsl/composables/magic-explosion/setupMagicExplosion.ts'
import { setupGalaxy } from '@/views/webgpu-tsl/composables/galaxy/setupGalaxy.ts'
import { setupAnvil } from '@/views/webgpu-tsl/composables/anvil/setupAnvil.ts'
import {
  useScenePicking,
  type ScenePickHit,
} from '@/views/webgpu-tsl/composables/useScenePicking.ts'

const { containerRef, scene, camera, renderer, controls, setFrameRender, initScene,onBeforeRender} =
  useThreeScene()

let addImpact: ((hit: ScenePickHit) => void) | undefined
let addAnvilImpact: ((hit: ScenePickHit) => void) | undefined
let addExplosion: ((hit: ScenePickHit) => void) | undefined

const {
  registerObject,
  unregisterObject,
  setBlocked,
  bindPicking,
  unbindPicking,
} = useScenePicking({
  camera,
  renderer,
  onHover: (hit) => {
    console.log('[WebGPU] hover', hit?.object.name ?? null, hit?.point ?? null)
  },
  onSelect: (hit) => {
    // addImpact?.(hit)
    // addExplosion?.(hit)
    addAnvilImpact?.(hit)
  },
})

let disposeBasics: (() => void) | undefined
let disposePatterns: (() => void) | undefined
let disposeCoffeeSmoke: (() => void) | undefined
let disposePostProcessing: (() => void) | undefined
let disposeShield: (() => void) | undefined
let disposeMagicExplosion: (() => void) | undefined
let disposeGalaxy: (() => void) | undefined
let disposeAnvil: (() => void) | undefined

onMounted(async () => {
  await initScene()
  // disposeBasics = setupWebgpuBasics({scene,camera,renderer,controls,})?.dispose
  // disposePatterns = setupPatterns({ scene, camera, renderer, controls, })?.dispose
  // disposeCoffeeSmoke = (
  //   await setupCoffeSmoke({ scene, camera, renderer, controls })
  // )?.dispose
  // disposePostProcessing = (
  //   await setupPostProcessing({
  //     scene,
  //     camera,
  //     renderer,
  //     controls,
  //     setFrameRender,
  //   })
  // )?.dispose
  // const shieldApi = (await setupShied({
  //   scene,
  //   camera,
  //   renderer,
  //   controls,
  //   setFrameRender,
  //   registerObject,
  //   unregisterObject,
  //   setPickingBlocked: setBlocked,
  // })) as {
  //   dispose: () => void
  //   addImpact: (hit: ScenePickHit) => void
  // } | null
  // disposeShield = shieldApi?.dispose
  // addImpact = shieldApi?.addImpact

  const anvilApi = (await setupAnvil({
    scene,
    camera,
    renderer,
    controls,
    setFrameRender,
    registerObject,
    unregisterObject,
    setPickingBlocked: setBlocked,
    onBeforeRender,
  })) as {
    dispose: () => void
    // addImpact: (hit: ScenePickHit) => void
  } | null
  disposeAnvil = anvilApi?.dispose
  addAnvilImpact = anvilApi?.addImpact

  // const explosionApi = (await setupMagicExplosion({
  //   scene,
  //   camera,
  //   renderer,
  //   controls,
  //   setFrameRender,
  //   registerObject,
  //   unregisterObject,
  //   setPickingBlocked: setBlocked,
  // })) as {
  //   dispose: () => void
  //   addExplosion: (hit: ScenePickHit) => void
  // } | null
  // disposeMagicExplosion = explosionApi?.dispose
  // addExplosion = explosionApi?.addExplosion

  // const galaxyApi = (await setupGalaxy({
  //   scene,
  //   camera,
  //   renderer,
  //   controls,
  //   setFrameRender,
  // })) as {
  //   dispose: () => void
  // } | null
  // disposeGalaxy = galaxyApi?.dispose

  bindPicking()
})

onUnmounted(() => {
  unbindPicking()
  addImpact = undefined
  addExplosion = undefined
  disposeBasics?.()
  disposeBasics = undefined
  disposePatterns?.()
  disposePatterns = undefined
  disposeCoffeeSmoke?.()
  disposeCoffeeSmoke = undefined
  disposePostProcessing?.()
  disposePostProcessing = undefined
  disposeShield?.()
  disposeShield = undefined
  disposeMagicExplosion?.()
  disposeMagicExplosion = undefined
  disposeGalaxy?.()
  disposeGalaxy = undefined
  disposeAnvil?.()
  disposeAnvil = undefined
  addAnvilImpact?.()
  addAnvilImpact = undefined
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
