import { defineStore } from 'pinia'
import { computed, reactive, shallowRef, triggerRef } from 'vue'
import type { Aircraft } from '@/network/aircraft/types/aircraft'
import type { MatchedWall, WallFilterForm } from '@/views/aviation-situation/types/wall'
import {
  allWallLevelValues,
  allWallVisualStyleValues,
  selectedWallCountryValues,
} from '@/views/aviation-situation/constants/wall-filter-data'

export const useWallStore = defineStore('useWallStore', () => {
  const wallFilterForm = reactive<WallFilterForm>({
    id: '',
    name: '',
    visualStyles: [...allWallVisualStyleValues],
    countries: [...selectedWallCountryValues],
    levels: [...allWallLevelValues],
    visible: true,
  })

  const matchedWallMap = shallowRef<Map<string, MatchedWall>>(new Map())
  const matchedWalls = computed(() => [...matchedWallMap.value.values()])

  const clearMatchedWalls = (): void => {
    matchedWallMap.value.clear()
  }

  const setMatchedWall = (matched: MatchedWall): void => {
    matchedWallMap.value.set(matched.wall.id, matched)
  }

  const commitMatchedWalls = (): void => {
    triggerRef(matchedWallMap)
  }

  const resetWallFilterForm = (): void => {
    wallFilterForm.id = ''
    wallFilterForm.name = ''
    wallFilterForm.visualStyles = [...allWallVisualStyleValues]
    wallFilterForm.countries = [...selectedWallCountryValues]
    wallFilterForm.levels = [...allWallLevelValues]
    wallFilterForm.visible = true
  }

  const clearWallAircraftMaps = (): void => {
    for (const [, matched] of matchedWallMap.value) {
      matched.aircraft = { aircraftMap: new Map() }
    }
  }

  const addAircraftToWall = (wallId: string, aircraft: Aircraft): void => {
    const matched = matchedWallMap.value.get(wallId)
    if (!matched) return
    matched.aircraft.aircraftMap.set(aircraft.icao24, aircraft)
  }

  const commitWallAircraftMaps = (): void => {
    for (const [, matched] of matchedWallMap.value) {
      matched.aircraft = { aircraftMap: new Map(matched.aircraft.aircraftMap) }
    }
    triggerRef(matchedWallMap)
  }

  return {
    wallFilterForm,
    resetWallFilterForm,
    matchedWallMap,
    matchedWalls,
    clearMatchedWalls,
    setMatchedWall,
    commitMatchedWalls,
    clearWallAircraftMaps,
    addAircraftToWall,
    commitWallAircraftMaps,
  }
})
