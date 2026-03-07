<script setup lang="ts">
import { useHighlightStore } from '@/stores/aviationSelection'

const highlightStore=useHighlightStore()

</script>

<template>
  <div>
    <h3>飞机详情</h3>
    <p>ICAO24: {{ highlightStore.selected?.icao24 }}</p>
  </div>
</template>

<style scoped lang="scss">

</style>
