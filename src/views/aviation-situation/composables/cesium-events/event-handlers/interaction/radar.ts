import { emitCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import * as Cesium from 'cesium'
import { RADAR_INTERACTION_OUTLINE } from '@/views/aviation-situation/composables/radar/radar-constants'
import { highlightRadarOnHover } from '@/views/aviation-situation/composables/radar/radar-highlight-manager'
import type { RadarPickId } from '@/views/aviation-situation/composables/radar/radar-highlight-manager'
import { RADAR_DEFAULT_STYLE } from '@/views/aviation-situation/composables/radar/radar-constants'
import { setTooltipPositionFromWindow } from '@/views/aviation-situation/composables/cesium-events/tooltip-position'

export const handleRadarHover = (
  pickId: RadarPickId,
  screenPosition: Cesium.Cartesian2,
): void => {
  highlightRadarOnHover(pickId.id, {
    fillColor: RADAR_DEFAULT_STYLE.fillColor,
    outlineColor: RADAR_INTERACTION_OUTLINE.hover,
  })
  setTooltipPositionFromWindow(screenPosition.x, screenPosition.y)
  emitCesiumEvent('radarHover', pickId, screenPosition)
}

export const handleRadarLeave = (): void => {
  emitCesiumEvent('radarLeave')
}
