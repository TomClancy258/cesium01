import type { AviationRenderItem } from '@/views/aviation-situation/types/shared.ts'
import type { Aircraft } from '@/network/aircraft/types/aircraft'
import {
  clearWallHighlight,
  highlightBillboardOnWall,
} from '@/views/aviation-situation/composables/highlight-manager/billboard-highlight-manager.ts'
import { useWallStore } from '@/stores/wall'
import { useAircraftStore } from '@/stores/aircraft'
import { isPointInWallRegion } from '@/views/aviation-situation/composables/wall/wall-utils'

interface Options {
  renderMap: Map<string, AviationRenderItem<Aircraft>>
  dangerWallImageUrl: string
  warningWallImageUrl: string
}

export function useAircraftWall({
  renderMap,
  dangerWallImageUrl,
  warningWallImageUrl,
}: Options) {
  const wallStore = useWallStore()
  const aircraftStore = useAircraftStore()

  const highlightAircraftByWall = (): void => {
    wallStore.clearWallAircraftMaps()

    const activeHighlightWallIds = new Set<string>()
    for (const [wallId, matched] of wallStore.matchedWallMap) {
      const level = matched.wall.level
      if (level === 'danger' || level === 'warning') {
        activeHighlightWallIds.add(wallId)
      }
    }

    for (const icao24 of aircraftStore.matchedAircraftMap.keys()) {
      const item = renderMap.get(icao24)
      if (!item?.sets?.wallId) continue
      for (const wallId of [...item.sets.wallId]) {
        if (!activeHighlightWallIds.has(wallId)) {
          clearWallHighlight(wallId, item.billboard, item.sets)
        }
      }
    }

    for (const [wallId, matchedWall] of wallStore.matchedWallMap) {
      const level = matchedWall.wall.level
      if (level !== 'danger' && level !== 'warning') continue

      const wallImage =
        level === 'danger' ? dangerWallImageUrl : warningWallImageUrl

      for (const icao24 of aircraftStore.matchedAircraftMap.keys()) {
        const item = renderMap.get(icao24)
        if (!item?.sets) continue

        const lngLat: [number, number] = [item.data.longitude, item.data.latitude]
        const inWall = isPointInWallRegion(
          lngLat,
          item.data.baroAltitude ?? 0,
          matchedWall,
        )

        if (inWall) {
          wallStore.addAircraftToWall(wallId, item.data)
          highlightBillboardOnWall(wallId, item.billboard, wallImage, item.sets)
        } else {
          clearWallHighlight(wallId, item.billboard, item.sets)
        }
      }
    }

    wallStore.commitWallAircraftMaps()
  }

  return {
    highlightAircraftByWall,
  }
}
