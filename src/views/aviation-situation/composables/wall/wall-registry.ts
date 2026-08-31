import type * as Cesium from 'cesium'
import type { WallVisualStyle } from '@/network/wall/type'
import type {
  WallBaseStyle,
  WallTable,
} from '@/views/aviation-situation/types/wall'

export type WallPrimitivePair = {
  wallPrimitive: Cesium.Primitive
  visualStyle: WallVisualStyle
  baseStyle: WallBaseStyle
  /** layeredRing / arrowWall 动画周期（ms） */
  durationMs?: number
}

export type WallRenderState = {
  data: WallTable
  primitives: WallPrimitivePair
}

const wallRenderMap = new Map<string, WallRenderState>()

export function getWallMaterial(pair: WallPrimitivePair): Cesium.Material {
  return (pair.wallPrimitive.appearance as Cesium.MaterialAppearance).material
}

export function registerWall(wallId: string, state: WallRenderState): void {
  wallRenderMap.set(wallId, state)
}

export function unregisterWall(wallId: string): void {
  wallRenderMap.delete(wallId)
}

export function clearWallRegistry(): void {
  wallRenderMap.clear()
}

export function getWallRenderState(wallId: string): WallRenderState | undefined {
  return wallRenderMap.get(wallId)
}

export function forEachWallRenderState(
  callback: (state: WallRenderState, wallId: string) => void,
): void {
  wallRenderMap.forEach(callback)
}

export function getAllWallMaterials(): Cesium.Material[] {
  return [...wallRenderMap.values()].map((state) => getWallMaterial(state.primitives))
}

export function getAllWallRenderStatesForAnimation(): WallRenderState[] {
  return [...wallRenderMap.values()]
}
