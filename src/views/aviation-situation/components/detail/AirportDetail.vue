<script setup lang="ts">
import { useAviationSelectionStore } from '@/stores/aviation-selection'

const aviationSelectionStore=useAviationSelectionStore()

</script>

<template>
  <div>
    <h3>机场详情</h3>
    <p>ICAO: {{ aviationSelectionStore.selected?.icao }}</p>
  </div>
</template>

<style scoped lang="scss">

</style>
