<script setup lang="ts">
import {defineProps} from "vue"
import type { AirportClickData } from '@/views/aviation-situation/types/airport'

const props = defineProps<{
  data: AirportClickData
}>()
</script>

<template>
  <h3>机场详情</h3>
  <p>ICAO: {{ props.data.icao }}</p>
</template>

<style scoped lang="scss">

</style>
