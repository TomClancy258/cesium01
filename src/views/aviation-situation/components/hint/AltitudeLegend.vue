<script setup lang="ts">
import { computed } from 'vue'
import { useHighlightStore } from '@/stores/aviationSelection'
const highlightStore = useHighlightStore()

const isAltitudeLegendVisible = computed(() => {
  return highlightStore.selected && highlightStore.selected.sourceType === 'aircraft'
})
</script>

<template>
  <img
    v-show="isAltitudeLegendVisible"
    src="@/assets/img/map/altitude-legend.svg"
    class="altitude-legend"
    alt="高度图例"
  />
</template>

<style scoped lang="scss">
.altitude-legend {
  position: fixed;
  bottom: 20px;
  right: 30px;
  width: 50vw;
  pointer-events: none;
}
</style>
