<script setup lang="ts">
import {drawPoint} from '@/views/webgl/composables/draw-point'
import {drawPointsByPointSize} from '@/views/webgl/composables/draw-points-by-pointSize'
import {drawPointsByPointSizes} from '@/views/webgl/composables/draw-points-by-pointSizes.ts'
import {drawPointsByVarying} from '@/views/webgl/composables/draw-points-by-varying'
import {drawLine} from '@/views/webgl/composables/draw-line.ts'
import {drawTriangle} from '@/views/webgl/composables/draw-triangle'
import {drawTexture} from '@/views/webgl/composables/draw-texture'
import {drawElements} from '@/views/webgl/composables/draw-elements'
import {drawDynamicTexture} from '@/views/webgl/composables/draw-dynamic-texture'
import { onMounted } from 'vue'

onMounted(()=>{

  // drawPoint()
  // drawPointsByPointSize()
  // drawPointsByPointSizes()
  // drawPointsByVarying()
  // drawLine()
  // drawTriangle()
  // drawTexture()
  // drawElements()
  drawDynamicTexture()
})
</script>

<template>
<div>
  <div>aaa</div>
  <canvas width="500" height="500" id="glCanvas" style="background: #2c3e50"></canvas>
</div>
</template>

<style scoped lang="scss">

</style>
