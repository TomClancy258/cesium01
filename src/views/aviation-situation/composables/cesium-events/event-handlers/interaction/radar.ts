import { emitCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import * as Cesium from 'cesium'
import { RADAR_INTERACTION_STYLE } from '@/views/aviation-situation/composables/radar/radar-constants'
import { highlightRadarOnHover } from '@/views/aviation-situation/composables/highlight-manager/radar-highlight-manager'
import type { RadarPickId } from '@/views/aviation-situation/types/radar'
import { setTooltipPositionFromWindow } from '@/views/aviation-situation/composables/cesium-events/tooltip-position'

export const handleRadarHover = (
  pickId: RadarPickId,
  screenPosition: Cesium.Cartesian2,
): void => {
  highlightRadarOnHover(pickId.id, {
    color: RADAR_INTERACTION_STYLE.hover.color,
  })
  setTooltipPositionFromWindow(screenPosition.x, screenPosition.y)
  emitCesiumEvent('radarHover', pickId, screenPosition)
}

export const handleRadarLeave = (): void => {
  emitCesiumEvent('radarLeave')
}

export const handleRadarLeftClick = (pickId: RadarPickId): void => {
  emitCesiumEvent('radarLeftClick', pickId)
}
