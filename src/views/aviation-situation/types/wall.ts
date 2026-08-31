import type { Wall, WallLevel, WallVisualStyle } from '@/network/wall/type'
import type { Aircraft } from '@/network/aircraft/types/aircraft'
import type { BBox } from 'geojson'
import type { Graphic } from '@/views/aviation-situation/types/shared'

export interface WallFilterForm {
  id: string
  name: string
  visualStyles: WallVisualStyle[]
  countries: string[]
  levels: WallLevel[]
  visible: boolean
}

export interface WallTable extends Wall {
  graphic: Graphic
  bbox: BBox
}

export type MatchedWall = {
  wall: WallTable
  aircraft: { aircraftMap: Map<string, Aircraft> }
}

export function createMatchedWall(wall: WallTable): MatchedWall {
  return {
    wall,
    aircraft: { aircraftMap: new Map() },
  }
}

export type WallHoveredProperties = WallTable & {
  aircraftCount: number
}

export type WallLayeredRingHighlightStyle = {
  kind: 'layeredRing'
  color: import('cesium').Color
}

export type WallArrowWallHighlightStyle = {
  kind: 'arrowWall'
  image: string
}

export type WallHighlightStyle = WallLayeredRingHighlightStyle | WallArrowWallHighlightStyle

export type WallBaseStyle = WallHighlightStyle

/** GeometryInstance.id / pick 身份 */
export type WallPickId = {
  sourceType: 'wall'
  id: string
}

export interface WallTableRowOperation {
  operationType: 'detail'
  id: string
}
