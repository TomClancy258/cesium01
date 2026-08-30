import type {
  RadarHighlightStyle,
  RadarPickId,
} from '@/views/aviation-situation/types/radar'
import {
  getRadarRenderState,
  getRadarScanMaterial,
  type RadarPrimitivePair,
} from '@/views/aviation-situation/composables/radar/radar-registry'

export type { RadarPrimitivePair }

let hoveredRadarId: string | null = null
let selectedRadarId: string | null = null

const applyRadarStyle = (pair: RadarPrimitivePair, style: RadarHighlightStyle): void => {
  getRadarScanMaterial(pair).uniforms.color = style.color
}

const restoreBaseStyle = (radarId: string): void => {
  const state = getRadarRenderState(radarId)
  if (!state) return
  applyRadarStyle(state.primitives, state.primitives.baseStyle)
}

export function highlightRadarOnHover(radarId: string, style: RadarHighlightStyle): void {
  if (selectedRadarId === radarId) return
  if (hoveredRadarId === radarId) return

  if (hoveredRadarId && hoveredRadarId !== selectedRadarId) {
    restoreBaseStyle(hoveredRadarId)
  }

  const state = getRadarRenderState(radarId)
  if (!state) return

  hoveredRadarId = radarId
  applyRadarStyle(state.primitives, style)
}

export function highlightRadarOnSelect(radarId: string, style: RadarHighlightStyle): void {
  if (selectedRadarId === radarId) return

  if (selectedRadarId) {
    restoreBaseStyle(selectedRadarId)
  }
  if (hoveredRadarId === radarId) {
    hoveredRadarId = null
  }

  const state = getRadarRenderState(radarId)
  if (!state) return

  selectedRadarId = radarId
  applyRadarStyle(state.primitives, style)
}

export function clearHoveredRadarHighlight(): void {
  if (!hoveredRadarId || hoveredRadarId === selectedRadarId) {
    hoveredRadarId = null
    return
  }
  restoreBaseStyle(hoveredRadarId)
  hoveredRadarId = null
}

export function clearSelectedRadarHighlight(): void {
  if (!selectedRadarId) return
  restoreBaseStyle(selectedRadarId)
  selectedRadarId = null
}

export function clearAllRadarHighlight(): void {
  clearHoveredRadarHighlight()
  clearSelectedRadarHighlight()
}

export function getHoveredRadarId(): string | null {
  return hoveredRadarId
}

export function getSelectedRadarId(): string | null {
  return selectedRadarId
}

export function isRadarPickId(value: unknown): value is RadarPickId {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as RadarPickId).sourceType === 'radar' &&
    typeof (value as RadarPickId).id === 'string'
  )
}
