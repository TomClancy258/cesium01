<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useThreeScene } from './composables/useThreeScene'
import { setupSphereParticlesPhysics } from '@/views/three-js-ultimate-tutorial/composables/sphere-particles-physics/setupSphereParticlesPhysics.ts'
import { setupGalaxy } from '@/views/three-js-ultimate-tutorial/composables/setupGalaxy.ts'
import {
  useScenePicking,
  type ScenePickHit,
} from '@/views/webgpu-tsl/composables/useScenePicking.ts'

const { containerRef, scene, camera, renderer, controls, setFrameRender, initScene,onBeforeRender} =
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

let disposeSphereParticlesPhysics: (() => void) | undefined
let disposeGalaxy: (() => void) | undefined

onMounted(async () => {
  await initScene()

  // const sphereParticlesPhysicsApi = (await setupSphereParticlesPhysics({
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
  // disposeSphereParticlesPhysics = sphereParticlesPhysicsApi?.dispose
  // updateSphereParticles = sphereParticlesPhysicsApi?.updateSphereParticles

  const galaxyApi = (await setupGalaxy({
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
  disposeGalaxy = galaxyApi?.dispose

  bindPicking()
})

onUnmounted(() => {
  unbindPicking()
  addImpact = undefined
  disposeSphereParticlesPhysics?.()
  disposeSphereParticlesPhysics = undefined
  disposeGalaxy?.()
  disposeGalaxy = undefined
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
