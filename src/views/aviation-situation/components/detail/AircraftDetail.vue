<script setup lang="ts">
import { useAviationSelectionStore } from '@/stores/aviationSelection'

const aviationSelectionStore=useAviationSelectionStore()

</script>

<template>
  <div>
    <h3>飞机详情</h3>
    <p>ICAO24: {{ aviationSelectionStore.selected?.icao24 }}</p>
  </div>
</template>

<style scoped lang="scss">

</style>
