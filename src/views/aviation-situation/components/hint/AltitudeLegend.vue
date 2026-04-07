<script setup lang="ts">
import { computed } from 'vue'
import { useAviationSelectionStore } from '@/stores/aviation-selection'
const aviationSelectionStore = useAviationSelectionStore()

const isAltitudeLegendVisible = computed(() => {
  return aviationSelectionStore.selected && aviationSelectionStore.selected.sourceType === 'aircraft'
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
