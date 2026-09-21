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
import { setupFlag } from '@/views/shader/composables/godot/flag/setupFlag.ts'
import { setupFake3D } from '@/views/shader/composables/godot/fake3D/setupFake3D.ts'
import { setupModelMatrix } from '@/views/shader/composables/godot/model_matrix/setupModelMatrix.ts'
import { setupDungeon } from '@/views/shader/composables/godot/dungeon/setupDungeon.ts'
import { setupGrassScene } from '@/views/shader/composables/godot/grass/setupGrassScene.ts'

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
let disposeFlag: (() => void) | undefined
let disposeFake3D: (() => void) | undefined
let disposeModelMatrix: (() => void) | undefined
let disposeDungeon: (() => void) | undefined
let disposeGrass: (() => void) | undefined

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
  // disposeLiquid = (await setupLiquid(scene, onBeforeRender))?.dispose
  // disposeFlag = (await setupFlag(scene, onBeforeRender))?.dispose
  // disposeFake3D = (await setupFake3D(scene, onBeforeRender))?.dispose
  // disposeModelMatrix = (await setupModelMatrix(scene, onBeforeRender))?.dispose
  // disposeDungeon = (await setupDungeon(scene, onBeforeRender))?.dispose
  disposeGrass = (await setupGrassScene(scene, onBeforeRender))?.dispose
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
  disposeFlag?.()
  disposeFlag = undefined
  disposeFake3D?.()
  disposeFake3D = undefined
  disposeModelMatrix?.()
  disposeModelMatrix = undefined
  disposeDungeon?.()
  disposeDungeon = undefined
  disposeGrass?.()
  disposeGrass = undefined
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
