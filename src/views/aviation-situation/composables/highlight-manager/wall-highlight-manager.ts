import type {
  WallHighlightStyle,
  WallPickId,
} from '@/views/aviation-situation/types/wall'
import {
  getWallMaterial,
  getWallRenderState,
  type WallPrimitivePair,
} from '@/views/aviation-situation/composables/wall/wall-registry'

let hoveredWallId: string | null = null
let selectedWallId: string | null = null

const applyWallStyle = (pair: WallPrimitivePair, style: WallHighlightStyle): void => {
  const material = getWallMaterial(pair)
  if (style.kind === 'layeredRing') {
    material.uniforms.color = style.color
    return
  }
  material.uniforms.image = style.image
}

const restoreBaseStyle = (wallId: string): void => {
  const state = getWallRenderState(wallId)
  if (!state) return
  applyWallStyle(state.primitives, state.primitives.baseStyle)
}

export function highlightWallOnHover(wallId: string, style: WallHighlightStyle): void {
  if (selectedWallId === wallId) return
  if (hoveredWallId === wallId) return

  if (hoveredWallId && hoveredWallId !== selectedWallId) {
    restoreBaseStyle(hoveredWallId)
  }

  const state = getWallRenderState(wallId)
  if (!state) return

  hoveredWallId = wallId
  applyWallStyle(state.primitives, style)
}

export function highlightWallOnSelect(wallId: string, style: WallHighlightStyle): void {
  if (selectedWallId === wallId) return

  if (selectedWallId) {
    restoreBaseStyle(selectedWallId)
  }
  if (hoveredWallId === wallId) {
    hoveredWallId = null
  }

  const state = getWallRenderState(wallId)
  if (!state) return

  selectedWallId = wallId
  applyWallStyle(state.primitives, style)
}

export function clearHoveredWallHighlight(): void {
  if (!hoveredWallId || hoveredWallId === selectedWallId) {
    hoveredWallId = null
    return
  }
  restoreBaseStyle(hoveredWallId)
  hoveredWallId = null
}

export function clearSelectedWallHighlight(): void {
  if (!selectedWallId) return
  restoreBaseStyle(selectedWallId)
  selectedWallId = null
}

export function clearAllWallHighlight(): void {
  clearHoveredWallHighlight()
  clearSelectedWallHighlight()
}

export function isWallPickId(value: unknown): value is WallPickId {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as WallPickId).sourceType === 'wall' &&
    typeof (value as WallPickId).id === 'string'
  )
}
