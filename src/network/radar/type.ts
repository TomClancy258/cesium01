import type { LngLatAlt } from '@/views/aviation-situation/types/shared'

/** 后端 / 静态 JSON 原始字段（altitude 与前端 height 在 normalize 层映射） */
export interface RawRadar {
  id: string
  name?: string
  center: {
    longitude: number
    latitude: number
    altitude?: number
  }
  radiusMeters: number
  detectAircraft: boolean
  country: string
}

/** 前端统一业务模型 */
export interface Radar {
  id: string
  name: string
  center: LngLatAlt
  radiusMeters: number
  detectAircraft: boolean
  country: string
}
