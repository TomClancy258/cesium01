import { geojsonRequest } from '../request'
import type { RawWall, Wall } from './type'

const API = {
  WALLS: 'wall/walls.json',
} as const

export function normalizeWall(raw: RawWall): Wall {
  return {
    id: raw.id,
    name: raw.name ?? raw.id,
    positions: raw.positions,
    minAltitude: raw.minAltitude,
    maxAltitude: raw.maxAltitude,
    visualStyle: raw.visualStyle,
    country: raw.country,
    level: raw.level,
  }
}

/** 获取全部电子围栏 */
export const getWalls = async (): Promise<Wall[]> => {
  const rawList = await geojsonRequest.get<RawWall[]>(API.WALLS)
  if (!Array.isArray(rawList)) {
    console.warn('[getWalls] invalid response', rawList)
    return []
  }
  return rawList.map(normalizeWall)
}
