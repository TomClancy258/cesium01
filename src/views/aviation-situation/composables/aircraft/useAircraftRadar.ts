import type { ShallowRef } from 'vue'
import type { AviationRenderItem } from '@/views/aviation-situation/types/shared.ts'
import type { Aircraft } from '@/network/aircraft/types/aircraft'
import {
  clearRadarHighlight,
  highlightBillboardOnRadar,
} from '@/views/aviation-situation/composables/highlight-manager/billboard-highlight-manager.ts'
import { useRadarStore } from '@/stores/radar'
import { useAircraftStore } from '@/stores/aircraft'
import { isPointInRadarRegion } from '@/views/aviation-situation/composables/radar/radar-utils'

interface Options {
  renderMap: Map<string, AviationRenderItem<Aircraft>>
  radarHighlightImageUrl: string
}

export function useAircraftRadar({ renderMap, radarHighlightImageUrl }: Options) {
  const radarStore = useRadarStore()
  const aircraftStore = useAircraftStore()

  const highlightAircraftByRadar = (): void => {
    radarStore.clearRadarAircraftMaps()

    const activeDetectRadarIds = new Set<string>()
    for (const [radarId, matched] of radarStore.matchedRadarMap) {
      if (matched.radar.detectAircraft) {
        activeDetectRadarIds.add(radarId)
      }
    }

    for (const icao24 of aircraftStore.matchedAircraftMap.keys()) {
      const item = renderMap.get(icao24)
      if (!item?.sets?.radarId) continue
      for (const radarId of [...item.sets.radarId]) {
        if (!activeDetectRadarIds.has(radarId)) {
          clearRadarHighlight(radarId, item.billboard, item.sets)
        }
      }
    }

    for (const [radarId, matchedRadar] of radarStore.matchedRadarMap) {
      if (!matchedRadar.radar.detectAircraft) continue

      for (const icao24 of aircraftStore.matchedAircraftMap.keys()) {
        const item = renderMap.get(icao24)
        if (!item?.sets) continue

        const lngLat: [number, number] = [item.data.longitude, item.data.latitude]
        const inRadar = isPointInRadarRegion(lngLat, matchedRadar)

        if (inRadar) {
          radarStore.addAircraftToRadar(radarId, item.data)
          highlightBillboardOnRadar(radarId, item.billboard, radarHighlightImageUrl, item.sets)
        } else {
          clearRadarHighlight(radarId, item.billboard, item.sets)
        }
      }
    }

    radarStore.commitRadarAircraftMaps()
  }

  return {
    highlightAircraftByRadar,
  }
}
