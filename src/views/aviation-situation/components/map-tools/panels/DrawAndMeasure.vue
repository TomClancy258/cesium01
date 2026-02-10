<script lang="ts" setup>
import { ref } from 'vue'

const drawing = {
  value: ref('close'),
  options: [
    {
      value: 'close',
      label: '关闭绘制',
    },
    {
      value: 'polyline',
      label: '折线',
    },
    {
      value: 'polygon',
      label: '多边形',
    },
    {
      value: 'circle',
      label: '圆',
    },
  ],
  changeDrawing: () => {
    if (drawing.value.value === 'polyline') {
      this.$emit('drawPolyline')
    }
  },
}
</script>

<template>
  <div class="drawing-toolbar">
    <el-select
      v-model="drawing.value"
      placeholder="关闭绘制"
      @change="drawing.changeDrawing"
    >
      <el-option
        v-for="item in drawing.options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
    <div>输入框1</div>
    <div>输入框1</div>
    <div>输入框1</div>
    <div>输入框1</div>
    <div>输入框1</div>
    <div>输入框1</div>
    <div>输入框1</div>
    <div>输入框1</div>
  </div>
</template>

<style scoped lang="scss">

</style>
