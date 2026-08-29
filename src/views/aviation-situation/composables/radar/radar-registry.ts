import type * as Cesium from 'cesium'
import type {
  RadarHighlightStyle,
  RadarTable,
} from '@/views/aviation-situation/types/radar'

/** 单部雷达的 GroundPrimitive + 扫描材质 + 基础样式（高亮还原用） */
export type RadarPrimitivePair = {
  fillPrimitive: Cesium.GroundPrimitive
  scanMaterial: Cesium.Material
  baseStyle: RadarHighlightStyle
}

/** 档案 + 图元（唯一运行时真相） */
export type RadarRenderState = {
  data: RadarTable
  primitives: RadarPrimitivePair
}

const radarRenderMap = new Map<string, RadarRenderState>()

export function registerRadar(
  radarId: string,
  state: RadarRenderState,
): void {
  radarRenderMap.set(radarId, state)
}

export function unregisterRadar(radarId: string): void {
  radarRenderMap.delete(radarId)
}

export function clearRadarRegistry(): void {
  radarRenderMap.clear()
}

export function getRadarRenderState(
  radarId: string,
): RadarRenderState | undefined {
  return radarRenderMap.get(radarId)
}

export function forEachRadarRenderState(
  callback: (state: RadarRenderState, radarId: string) => void,
): void {
  radarRenderMap.forEach(callback)
}

export function getAllRadarScanMaterials(): Cesium.Material[] {
  return [...radarRenderMap.values()].map(
    (state) => state.primitives.scanMaterial,
  )
}
