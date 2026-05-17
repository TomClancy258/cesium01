import * as Cesium from 'cesium'
import { onCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import type {
  AircraftBaseProperties,
  AircraftSelectedData,
} from '@/views/aviation-situation/types/aircraft'
import type { AviationSelectedData } from '@/views/aviation-situation/types/shared'
import {
  highlightBillboardOnHover,
  highlightBillboardOnSelect,
} from '../highlight-manager/billboard-highlight-manager'

interface AviationSelectionStoreLike {
  hovered: AviationSelectedData
  selected: AviationSelectedData
  setHovered: (data: AircraftBaseProperties) => void
  clearHovered: () => void
  setSelected: (data: AircraftSelectedData) => void
}

interface UseAircraftInteractionsOptions {
  aviationSelectionStore: AviationSelectionStoreLike
  showAircraftTooltip: (position: Cesium.Cartesian2, properties: AircraftBaseProperties) => void
  hideAircraftTooltip: () => void
  onMouseWheel: () => void
  hoveredImageUrl: string
  selectedImageUrl: string
}

export function useAircraftInteractions(options: UseAircraftInteractionsOptions) {
  const {
    aviationSelectionStore,
    showAircraftTooltip,
    hideAircraftTooltip,
    onMouseWheel,
    hoveredImageUrl,
    selectedImageUrl,
  } = options

  let unsubAircraftHover: (() => void) | undefined
  let unsubAircraftLeave: (() => void) | undefined
  let unsubAircraftLeftClick: (() => void) | undefined
  let unsubMouseWheel: (() => void) | undefined

  const subscribe = (): void => {
    unsubAircraftHover = onCesiumEvent(
      'aircraftHover',
      (properties: AircraftBaseProperties, position: Cesium.Cartesian2, billboard: Cesium.Billboard) => {
        showAircraftTooltip(position, properties)
        highlightBillboardOnHover(properties, billboard, hoveredImageUrl)
        const hovered = aviationSelectionStore.hovered
        if (
          hovered === null ||
          hovered.sourceType !== 'aircraft' ||
          hovered.icao24 !== properties.icao24
        ) {
          aviationSelectionStore.setHovered(properties)
        }
      }
    )

    unsubAircraftLeave = onCesiumEvent('aircraftLeave', () => {
      hideAircraftTooltip()
      const hovered = aviationSelectionStore.hovered
      if (hovered?.sourceType === 'aircraft') {
        aviationSelectionStore.clearHovered()
      }
    })

    unsubAircraftLeftClick = onCesiumEvent(
      'aircraftLeftClick',
      (data: AircraftSelectedData, billboard: Cesium.Billboard) => {
        highlightBillboardOnSelect(billboard, selectedImageUrl)
        const selected = aviationSelectionStore.selected
        if (selected?.sourceType !== 'aircraft' || selected.icao24 !== data.icao24) {
          aviationSelectionStore.setSelected(data)
        }
      }
    )

    unsubMouseWheel = onCesiumEvent('mouseWheel', () => {
      onMouseWheel()
    })
  }

  const unsubscribe = (): void => {
    unsubAircraftHover?.()
    unsubAircraftLeave?.()
    unsubAircraftLeftClick?.()
    unsubMouseWheel?.()
    unsubAircraftHover = undefined
    unsubAircraftLeave = undefined
    unsubAircraftLeftClick = undefined
    unsubMouseWheel = undefined
  }

  return {
    subscribe,
    unsubscribe,
  }
}
