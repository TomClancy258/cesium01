// stores/highlight.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AircraftSelectedData } from '@/views/aviation-situation/types/aircraft'
import type { AirportSelectedData } from '@/views/aviation-situation/types/airport'


export const useHighlightStore = defineStore('highlight', () => {
  const selected = ref<AircraftSelectedData | AirportSelectedData | null>(null)

  const clearSelected = ():void => {
    selected.value = null
  }

  const setSelected = (
    data: AircraftSelectedData | AirportSelectedData | null = null
  ):void => {
    selected.value = data
  }

  const setSelectedPosition = (longitude:number,latitude:number,altitude:number):void => {
    if (selected.value !== null) {
      selected.value.position.longitude = longitude
      selected.value.position.latitude = latitude
      if (selected.value.sourceType === 'aircraft') {
        selected.value.position.baroAltitude = altitude
      } else if (selected.value.sourceType === 'airport') {
        selected.value.position.elevation = altitude
      }
    }
  }

  return {
    selected,
    clearSelected,
    setSelected,
    setSelectedPosition,
  }
})
