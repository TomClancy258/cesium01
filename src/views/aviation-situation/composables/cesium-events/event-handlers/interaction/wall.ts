import { emitCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import * as Cesium from 'cesium'
import { highlightWallOnHover } from '@/views/aviation-situation/composables/highlight-manager/wall-highlight-manager'
import type { WallPickId } from '@/views/aviation-situation/types/wall'
import { setTooltipPositionFromWindow } from '@/views/aviation-situation/composables/cesium-events/tooltip-position'
import { getWallRenderState } from '@/views/aviation-situation/composables/wall/wall-registry'
import { WALL_INTERACTION_STYLE } from '@/views/aviation-situation/composables/wall/wall-constants'

export const handleWallHover = (
  pickId: WallPickId,
  screenPosition: Cesium.Cartesian2,
): void => {
  const renderState = getWallRenderState(pickId.id)
  if (!renderState) return

  const style =
    renderState.primitives.visualStyle === 'layeredRing'
      ? WALL_INTERACTION_STYLE.layeredRing.hover
      : WALL_INTERACTION_STYLE.arrowWall.hover

  highlightWallOnHover(pickId.id, style)
  setTooltipPositionFromWindow(screenPosition.x, screenPosition.y)
  emitCesiumEvent('wallHover', pickId, screenPosition)
}

export const handleWallLeave = (): void => {
  emitCesiumEvent('wallLeave')
}

export const handleWallLeftClick = (pickId: WallPickId): void => {
  emitCesiumEvent('wallLeftClick', pickId)
}
