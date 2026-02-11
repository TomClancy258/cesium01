// index.ts
import request01 from '../request'
import {
  parseAircraftStates,
  type AircraftStatesResponse,
  type AircraftStatesRawResponse
} from './types/aircraft'
import {
  parseRouteFull,
  type RouteFullResponse,
  type RoutePointTuple
} from './types/route-full'

const API = {
  AIRCRAFTS: '/airplanes/data.json',
  ROUTE_FULL: '/airplanes/route-full.json', // ✅ 确保路径正确
} as const

/**
 * 获取飞机列表（已解析为 Aircraft[]）
 */
export const getAircrafts = async (): Promise<AircraftStatesResponse> => {
  const response = await request01.get<AircraftStatesRawResponse>(API.AIRCRAFTS)
  const states = response?.states ?? []
  return parseAircraftStates(states)
}

/**
 * 获取航迹数据（已解析为 RoutePoint[]）
 */
export const getAircraftRouteFull = async (): Promise<RouteFullResponse> => {
  const rawData = await request01.get<RoutePointTuple[]>(API.ROUTE_FULL)
  return parseRouteFull(rawData) // ✅ 在 API 层完成解析
}
