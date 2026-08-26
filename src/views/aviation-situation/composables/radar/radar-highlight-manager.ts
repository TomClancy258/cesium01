import * as Cesium from 'cesium'
import type { RadarHighlightStyle } from '@/views/aviation-situation/types/radar'
import type { RadarPickId, RadarPrimitivePair } from './radar-highlight-manager-types'

export type { RadarPickId, RadarPrimitivePair } from './radar-highlight-manager-types'

const pairById = new Map<string, RadarPrimitivePair>()
let hoveredRadarId: string | null = null
let selectedRadarId: string | null = null

export function registerRadarPrimitivePair(
  radarId: string,
  pair: RadarPrimitivePair,
): void {
  pairById.set(radarId, pair)
}

export function unregisterRadarPrimitivePair(radarId: string): void {
  pairById.delete(radarId)
}

const applyRadarStyle = (pair: RadarPrimitivePair, style: RadarHighlightStyle): void => {
  const fillMaterial = pair.fillPrimitive.appearance.material
  const outlineMaterial = pair.outlinePrimitive.appearance.material
  if (fillMaterial) {
    fillMaterial.uniforms.color = style.fillColor
  }
  if (outlineMaterial) {
    outlineMaterial.uniforms.color = style.outlineColor
  }
}

const restoreBaseStyle = (radarId: string): void => {
  const pair = pairById.get(radarId)
  if (!pair) return
  applyRadarStyle(pair, pair.baseStyle)
}

export function highlightRadarOnHover(radarId: string, style: RadarHighlightStyle): void {
  if (selectedRadarId === radarId) return
  if (hoveredRadarId === radarId) return

  if (hoveredRadarId && hoveredRadarId !== selectedRadarId) {
    restoreBaseStyle(hoveredRadarId)
  }

  const pair = pairById.get(radarId)
  if (!pair) return

  hoveredRadarId = radarId
  applyRadarStyle(pair, style)
}

export function highlightRadarOnSelect(radarId: string, style: RadarHighlightStyle): void {
  if (selectedRadarId === radarId) return

  if (selectedRadarId) {
    restoreBaseStyle(selectedRadarId)
  }
  if (hoveredRadarId === radarId) {
    hoveredRadarId = null
  }

  const pair = pairById.get(radarId)
  if (!pair) return

  selectedRadarId = radarId
  applyRadarStyle(pair, style)
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
