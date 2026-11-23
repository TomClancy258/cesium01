<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useThreeScene } from './composables/useThreeScene'
import { setupGalaxy } from '@/views/three-js-ultimate-tutorial/composables/setupGalaxy.ts'
// import { setupPhysics01 } from '@/views/three-js-ultimate-tutorial/composables/setupPhysics01.ts'
// import { setupPhysics02 } from '@/views/three-js-ultimate-tutorial/composables/setupPhysics02.ts'
import { setupEnvironmentMap } from '@/views/three-js-ultimate-tutorial/composables/setupEnvironmentMap.ts'
import { setupRealisticRender } from '@/views/three-js-ultimate-tutorial/composables/setupRealisticRender.ts'
import { setupShader } from '@/views/three-js-ultimate-tutorial/composables/shader/setupShader.ts'
import { setupRagingSea } from '@/views/three-js-ultimate-tutorial/composables/setupRagingSea.ts'
import { setupAnimatedGalaxy } from '@/views/three-js-ultimate-tutorial/composables/setupAnimatedGalaxy.ts'
import { setupCoffeeSmoke } from '@/views/three-js-ultimate-tutorial/composables/setupCoffeeSmoke.ts'
import {
  useScenePicking,
  type ScenePickHit,
} from '@/views/webgpu-tsl/composables/useScenePicking.ts'

const { containerRef, scene, camera, renderer, controls, setFrameRender, initScene, onBeforeRender } =
  useThreeScene()

let addImpact: ((hit: ScenePickHit) => void) | undefined
let updateSphereParticles: ((hit: ScenePickHit) => void) | undefined

const {
  registerObject,
  unregisterObject,
  setBlocked,
  bindPicking,
  unbindPicking,
} = useScenePicking({
  camera,
  renderer,
  onHover: (_hit) => {
    // console.log('[WebGPU] hover', hit?.object.name ?? null, hit?.point ?? null)
    // updateSphereParticles(hit)
    // 雪地球体跟随在 setupSnow 内用数学平面求交，不走网格拾取
  },
  onSelect: (_hit) => {
    // addImpact?.(hit)
  },
})

let disposePhysics: (() => void) | undefined
let disposeGalaxy: (() => void) | undefined
let disposeEnvironmentMap: (() => void) | undefined
let disposeRealisticRender: (() => void) | undefined
let disposeShader: (() => void) | undefined
let disposeRagingSea: (() => void) | undefined
let disposeAnimatedGalaxy: (() => void) | undefined
let disposeCoffeeSmoke: (() => void) | undefined

onMounted(async () => {
  await initScene()

  // const galaxyApi = (await setupGalaxy({
  //   scene,
  //   camera,
  //   renderer,
  //   controls,
  //   setFrameRender,
  //   registerObject,
  //   unregisterObject,
  //   setPickingBlocked: setBlocked,
  //   onBeforeRender,
  // })) as {
  //   dispose: () => void
  //   updatePetal: (hit: ScenePickHit) => void
  // } | null
  // disposeGalaxy = galaxyApi?.dispose

  // const physicsApi = await setupPhysics01({
  //   scene,
  //   camera,
  //   renderer,
  //   controls,
  //   setFrameRender,
  //   setPickingBlocked: setBlocked,
  //   onBeforeRender,
  //
  //   registerObject
  // })
  // disposePhysics = physicsApi?.dispose

  // const environmentMapApi = (await setupEnvironmentMap({
  //   scene,
  //   camera,
  //   renderer,
  //   controls,
  //   setFrameRender,
  //   registerObject,
  //   unregisterObject,
  //   setPickingBlocked: setBlocked,
  //   onBeforeRender,
  // })) as {
  //   dispose: () => void
  //   updatePetal: (hit: ScenePickHit) => void
  // } | null
  // disposeEnvironmentMap = environmentMapApi?.dispose

  // const realisticRenderApi = (await setupRealisticRender({
  //   scene,
  //   camera,
  //   renderer,
  //   controls,
  //   setFrameRender,
  //   registerObject,
  //   unregisterObject,
  //   setPickingBlocked: setBlocked,
  //   onBeforeRender,
  // })) as {
  //   dispose: () => void
  //   updatePetal: (hit: ScenePickHit) => void
  // } | null
  // disposeRealisticRender = realisticRenderApi?.dispose

  // const shaderApi = (await setupShader({
  //   scene,
  //   camera,
  //   renderer,
  //   controls,
  //   setFrameRender,
  //   registerObject,
  //   unregisterObject,
  //   setPickingBlocked: setBlocked,
  //   onBeforeRender,
  // })) as {
  //   dispose: () => void
  //   updatePetal: (hit: ScenePickHit) => void
  // } | null
  // disposeShader = shaderApi?.dispose

  // const ragingSeaApi = (await setupRagingSea({
  //   scene,
  //   camera,
  //   renderer,
  //   controls,
  //   setFrameRender,
  //   registerObject,
  //   unregisterObject,
  //   setPickingBlocked: setBlocked,
  //   onBeforeRender,
  // })) as {
  //   dispose: () => void
  //   updatePetal: (hit: ScenePickHit) => void
  // } | null
  // disposeRagingSea = ragingSeaApi?.dispose

  // const animatedGalaxyApi = (await setupAnimatedGalaxy({
  //   scene,
  //   camera,
  //   renderer,
  //   controls,
  //   setFrameRender,
  //   registerObject,
  //   unregisterObject,
  //   setPickingBlocked: setBlocked,
  //   onBeforeRender,
  // })) as {
  //   dispose: () => void
  //   updatePetal: (hit: ScenePickHit) => void
  // } | null
  // disposeAnimatedGalaxy = animatedGalaxyApi?.dispose

  const coffeSmokeApi = (await setupCoffeeSmoke({
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
    updatePetal: (hit: ScenePickHit) => void
  } | null
  disposeCoffeeSmoke = coffeSmokeApi?.dispose

  bindPicking()
})

onUnmounted(() => {
  unbindPicking()
  addImpact = undefined
  disposeGalaxy?.()
  disposeGalaxy = undefined
  disposePhysics?.()
  disposePhysics = undefined
  disposeEnvironmentMap?.()
  disposeEnvironmentMap = undefined
  disposeRealisticRender?.()
  disposeRealisticRender = undefined
  disposeShader?.()
  disposeShader = undefined
  disposeRagingSea?.()
  disposeRagingSea = undefined
  disposeAnimatedGalaxy?.()
  disposeAnimatedGalaxy = undefined
  disposeCoffeeSmoke?.()
  disposeCoffeeSmoke = undefined
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
