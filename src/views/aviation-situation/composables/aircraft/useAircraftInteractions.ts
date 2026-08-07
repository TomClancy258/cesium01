import * as Cesium from 'cesium'
import { onCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import type { Aircraft } from '@/network/aircraft/types/aircraft'
import type {
  AircraftBaseProperties,
  AircraftBillboardProperties,
  AircraftSelectedData,
} from '@/views/aviation-situation/types/aircraft'
import type { AviationSelectedData } from '@/views/aviation-situation/types/shared'
import { highlightBillboardOnHover } from '../highlight-manager/billboard-highlight-manager'
import { selectBillboard } from '@/views/aviation-situation/composables/selection/useAviationSelectionActions'
import { toAircraftBaseProperties, toAircraftSelectedData } from './aircraft-property-utils'

interface AviationSelectionStoreLike {
  hovered: AviationSelectedData
  selected: AviationSelectedData
  setHovered: (data: AircraftSelectedData) => void
  clearHovered: () => void
  setSelected: (data: AircraftSelectedData) => void
}

interface UseAircraftInteractionsOptions {
  aviationSelectionStore: AviationSelectionStoreLike
  getAircraftByIcao24: (icao24: string) => Aircraft | undefined
  showAircraftTooltip: (position: Cesium.Cartesian2, properties: AircraftBaseProperties) => void
  hideAircraftTooltip: () => void
  onMouseWheel: (camera: Cesium.Camera) => void
  hoveredImageUrl: string
  selectedImageUrl: string
}

export function useAircraftInteractions(options: UseAircraftInteractionsOptions) {
  const {
    aviationSelectionStore,
    getAircraftByIcao24,
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
      (properties: AircraftBillboardProperties, position: Cesium.Cartesian2, billboard: Cesium.Billboard) => {
        const aircraft = getAircraftByIcao24(properties.icao24)
        if (!aircraft) return

        const tooltipProperties = toAircraftBaseProperties(aircraft)
        const selectedData = toAircraftSelectedData(aircraft)

        showAircraftTooltip(position, tooltipProperties)
        highlightBillboardOnHover(selectedData, billboard, hoveredImageUrl)
        const hovered = aviationSelectionStore.hovered
        if (
          hovered === null ||
          hovered.sourceType !== 'aircraft' ||
          hovered.icao24 !== properties.icao24
        ) {
          aviationSelectionStore.setHovered(selectedData)
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
      (properties: AircraftBillboardProperties, billboard: Cesium.Billboard) => {
        const aircraft = getAircraftByIcao24(properties.icao24)
        if (!aircraft) return
        selectBillboard(billboard, selectedImageUrl, toAircraftSelectedData(aircraft))
      }
    )

    unsubMouseWheel = onCesiumEvent('mouseWheel', (camera) => {
      onMouseWheel(camera)
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
