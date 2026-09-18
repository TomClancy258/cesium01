<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useThreeScene } from './composables/useThreeScene'
import { setupVaryingUniformAttribute } from './composables/varying_uniform_attribute/setupVaryingUniformAttribute'
import { setupTexture } from '@/views/shader/composables/texture/setupTexture.ts'
import { setupStepMixSmoothstep } from '@/views/shader/composables/step_ mix_ smoothstep/setupStepMixSmoothstep.ts'
import { setupSinCos } from '@/views/shader/composables/sin_cos/setupSinCos.ts'
import { setupLight } from '@/views/shader/composables/light/setupLight.ts'
import { setupSimpleTransformations } from '@/views/shader/composables/simple_transformations/setupSimpleTransformations.ts'
import { setupSimpleShape } from '@/views/shader/composables/simple_shape/setupSimpleShape.ts'
import { setupCrosshair } from '@/views/shader/composables/godot/crosshair/setupCrosshair.ts'
import { setupShield } from '@/views/shader/composables/godot/shield/setupShield.ts'
import { setupOutline } from '@/views/shader/composables/godot/outline/setupOutline.ts'
import { setupPixelate } from '@/views/shader/composables/godot/pixelate/setupPixelate.ts'
import { setupDissolve } from '@/views/shader/composables/godot/dissolve/setupDissolve.ts'
import { setupFire } from '@/views/shader/composables/godot/fire/setupFire.ts'
import { setupColorChange } from '@/views/shader/composables/godot/color_change/setupColorChange.ts'
import { setupFrameAnimation } from '@/views/shader/composables/godot/frame_animation/setupFrameAnimation.ts'
import { setupOrbit } from '@/views/shader/composables/godot/orbit/setupOrbit.ts'
import { setupShine } from '@/views/shader/composables/godot/shine/setupShine.ts'
import { setupReload } from '@/views/shader/composables/godot/reload/setupReload.ts'
import { setupStamina } from '@/views/shader/composables/godot/stamina/setupStamina.ts'
import { setupLiquid } from '@/views/shader/composables/godot/liquid/setupLiquid.ts'

const { containerRef, scene, onBeforeRender, onResize, initScene } = useThreeScene()
const { loadModel } = setupLight(scene)//已经执行了setupLight函数，获得了它的return

let disposeCrosshair: (() => void) | undefined
let disposeShield: (() => void) | undefined
let disposeOutline: (() => void) | undefined
let disposePixelate: (() => void) | undefined
let disposeDissolve: (() => void) | undefined
let disposeFire: (() => void) | undefined
let disposeColorChange: (() => void) | undefined
let disposeFrameAnimation: (() => void) | undefined
let disposeOrbit: (() => void) | undefined
let disposeShine: (() => void) | undefined
let disposeReload: (() => void) | undefined
let disposeStamina: (() => void) | undefined
let disposeLiquid: (() => void) | undefined

onMounted(async () => {
  initScene()
  // setupVaryingUniformAttribute(scene)
  // setupTexture(scene)
  // setupStepMixSmoothstep(scene)
  // setupSinCos(scene, onBeforeRender)
  //  loadModel()
  // setupSimpleTransformations(scene, onBeforeRender, onResize)
  // setupSimpleShape(scene, onBeforeRender)
  // disposeCrosshair = setupCrosshair(scene)?.dispose
  // disposeShield = setupShield(scene, onBeforeRender)?.dispose
  // disposeOutline = setupOutline(scene, onBeforeRender)?.dispose
  // disposePixelate = (await setupPixelate(scene, onBeforeRender))?.dispose
  // disposeDissolve = (await setupDissolve(scene, onBeforeRender))?.dispose
  // disposeFire = (await setupFire(scene, onBeforeRender))?.dispose
  // disposeColorChange = (await setupColorChange(scene, onBeforeRender))?.dispose
  // disposeFrameAnimation = (await setupFrameAnimation(scene, onBeforeRender))?.dispose
  // disposeOrbit = (await setupOrbit(scene, onBeforeRender))?.dispose
  // disposeShine = (await setupShine(scene, onBeforeRender))?.dispose
  // disposeReload = (await setupReload(scene, onBeforeRender))?.dispose
  // disposeStamina = (await setupStamina(scene, onBeforeRender))?.dispose
  disposeLiquid = (await setupLiquid(scene, onBeforeRender))?.dispose
})

onUnmounted(() => {
  disposeCrosshair?.()
  disposeCrosshair = undefined
  disposeShield?.()
  disposeShield = undefined
  disposeOutline?.()
  disposeOutline = undefined
  disposePixelate?.()
  disposePixelate = undefined
  disposeDissolve?.()
  disposeDissolve = undefined
  disposeFire?.()
  disposeFire = undefined
  disposeColorChange?.()
  disposeColorChange = undefined
  disposeFrameAnimation?.()
  disposeFrameAnimation = undefined
  disposeOrbit?.()
  disposeOrbit = undefined
  disposeShine?.()
  disposeShine = undefined
  disposeReload?.()
  disposeReload = undefined
  disposeStamina?.()
  disposeStamina = undefined
  disposeLiquid?.()
  disposeLiquid = undefined
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
