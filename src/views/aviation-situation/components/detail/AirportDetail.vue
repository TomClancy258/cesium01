<script setup lang="ts">
import { useHighlightStore } from '@/stores/highlight'

const highlightStore=useHighlightStore()

</script>

<template>
  <div>
    <h3>机场详情</h3>
    <p>ICAO: {{ highlightStore.selected?.icao }}</p>
  </div>
</template>

<style scoped lang="scss">

</style>
