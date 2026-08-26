import { geojsonRequest } from '../request'
import type { RawRadar, Radar } from './type'

const API = {
  RADARS: 'radar/radars.json',
} as const

export function normalizeRadar(raw: RawRadar): Radar {
  return {
    id: raw.id,
    name: raw.name ?? raw.id,
    center: {
      longitude: raw.center.longitude,
      latitude: raw.center.latitude,
      height: raw.center.altitude ?? 0,
    },
    radiusMeters: raw.radiusMeters,
    detectAircraft: raw.detectAircraft,
    country: raw.country,
  }
}

/** 获取全部地面雷达（复数 getRadars，与 getControlZones 一致） */
export const getRadars = async (): Promise<Radar[]> => {
  const rawList = await geojsonRequest.get<RawRadar[]>(API.RADARS)
  if (!Array.isArray(rawList)) {
    console.warn('[getRadars] invalid response', rawList)
    return []
  }
  return rawList.map(normalizeRadar)
}
