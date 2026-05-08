// types/route-full.ts

import { isValidCoordinate } from '@/utils/geoUtils'

/**
 * route-full.json 的原始元组结构（根据你提供的文件）
 */
export type RoutePointTuple = [
  timestamp: number, // [0]
  latitude: number, // [1]
  longitude: number, // [2]
  baroAltitude: number, // [3] (英尺)
  groundSpeed: number, // [4] (节)
  heading: number, // [5] (度)
  unknown1: number, // [6] (恒为0)
  verticalRate: number, // [7] (英尺/分钟)
  extra?: {
    alt_geom?: number // 几何高度 (英尺)
    ias?: number // 指示空速 (节)
    tas?: number // 真空速 (节)
    mach?: number // 马赫数
    wd?: number // 风向
    ws?: number // 风速
    track?: number // 航迹角
    squawk?: string // 应答机编码
    // ... 其他可选字段
  },
  // [9+] 尾部字段（如 "adsb_icao", 38150, 64, 264, -0.7）
]

/**
 * 转换后的结构化航迹点
 */
export interface RoutePoint {
  timestamp: number
  latitude: number
  longitude: number
  baroAltitude: number // 英尺
  groundSpeed: number // 节
  heading: number // 度
  verticalRate: number // 英尺/分钟
  geomAltitude?: number // 英尺
  ias?: number // 节
  tas?: number // 节
  mach?: number
  windDirection?: number
  windSpeed?: number
  track?: number
  squawk?: string
}

/**
 * 转换单个元组 → 结构化对象
 */
export function tupleToRoutePoint(tuple: RoutePointTuple): RoutePoint {
  const extra = typeof tuple[8] === 'object' ? tuple[8] : {}

  return {
    timestamp: tuple[0],
    latitude: tuple[1],
    longitude: tuple[2],
    baroAltitude: tuple[3],
    groundSpeed: tuple[4],
    heading: tuple[5],
    verticalRate: tuple[7],
    geomAltitude: extra?.alt_geom,
    ias: extra?.ias,
    tas: extra?.tas,
    mach: extra?.mach,
    windDirection: extra?.wd,
    windSpeed: extra?.ws,
    track: extra?.track,
    squawk: extra?.squawk,
  }
}

/**
 * 转换整个航迹数组
 */
export function parseRouteFull(data: RoutePointTuple[]): RoutePoint[] {
  const out: RoutePoint[] = []
  for (const tuple of data) {
    const p = tupleToRoutePoint(tuple)
    if (isValidCoordinate(p.longitude, p.latitude, p.baroAltitude)) out.push(p)
  }
  return out
}

/**
 * API 最终返回类型
 */
export type RouteFullResponse = RoutePoint[]
