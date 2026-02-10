<script setup lang="ts">
import {defineProps} from "vue"
import type { AircraftClickData } from '@/views/aviation-situation/types/aircraft'

const props = defineProps<{
  data: AircraftClickData
}>()
</script>

<template>
  <h3>飞机详情</h3>
  <p>ICAO24: {{ props.data.icao24 }}</p>
</template>

<style scoped lang="scss">

</style>
