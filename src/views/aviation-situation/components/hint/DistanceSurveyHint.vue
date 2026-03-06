<script setup lang="ts">
 import {computed} from 'vue'
 import { useSpatialSelectStore } from '@/stores/spatialSelect'
 const spatialSelectStore = useSpatialSelectStore()

 const isHintVisible = computed(() => {
   return spatialSelectStore.spatialSelectForm.operationType === 'distanceSurvey'
 })
</script>

<template>
<div class="cesium-hint" v-show="isHintVisible">
  <div class="hint-title">
    <span class="icon">📏</span> 距离测绘
  </div>
  <div class="hint-content">
    <p><kbd>左键</kbd>：添加测点</p>
    <p><kbd>Backspace</kbd>：撤销上一点</p>
    <p><kbd>右键</kbd>：完成绘制</p>
    <p><kbd>Esc</kbd>：退出</p>
  </div>
</div>
</template>

<style scoped lang="scss">
.cesium-hint {
  position: absolute;
  top: 50px;
  left: 20px; /* 左上角 */
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  color: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
  z-index: 100; /* 确保在 Cesium 之上 */
  pointer-events: none; /* 让鼠标事件穿透，不影响地图操作 */
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1);
}

.hint-title {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 8px;
  color: #38BDF8; /* 与你的折线颜色呼应 */
  display: flex;
  align-items: center;
  gap: 6px;
}

.hint-content p {
  margin: 2px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
