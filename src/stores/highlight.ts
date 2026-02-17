// stores/highlight.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AircraftSelectedData } from '@/views/aviation-situation/types/aircraft'
import type { AirportSelectedData } from '@/views/aviation-situation/types/airport'


export const useHighlightStore = defineStore('highlight', () => {
  const selected = ref<AircraftSelectedData | AirportSelectedData | null>(null)

  const clearSelected = () => {
    selected.value = null
  }

  const setSelected = (
    data: AircraftSelectedData | AirportSelectedData | null = null
  ) => {
    selected.value = data
  }

  return {
    selected,
    clearSelected,
    setSelected
  }
})
