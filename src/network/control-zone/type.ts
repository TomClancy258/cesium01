import * as Cesium from 'cesium'

/** 管控区告警级别 */
export type ControlZoneLevel = 'warning' | 'danger' | 'info' | 'normal'

/** GeoJSON 坐标点：[经度, 纬度] 或 [经度, 纬度, 高度] */
export type ControlZonePosition = [number, number] | [number, number, number]

/**
 * Polygon 坐标：[[外环点...], [内环点...]?]
 * 外环首尾点需闭合
 */
export type ControlZonePolygonCoordinates = ControlZonePosition[][]

/** 后台 Feature.properties / 业务数据 */
export interface ControlZoneRawProperties {
  id: string
  name: string
  level: ControlZoneLevel
  minAltitude: number
  maxAltitude: number
}

/** 挂在 Entity.properties 上：拾取身份 + 高亮还原用渲染态 */
export interface ControlZoneProperties {
  id: string
  sourceType: 'controlZone'
  polygon: {
    outlineColor: Cesium.Color
  }
}

export interface ControlZonePolygonGeometry {
  type: 'Polygon'
  coordinates: ControlZonePolygonCoordinates
}

export interface ControlZoneFeature {
  type: 'Feature'
  properties: ControlZoneRawProperties
  geometry: ControlZonePolygonGeometry
}

/** getControlZones 返回的 GeoJSON FeatureCollection */
export interface ControlZoneFeatureCollection {
  type: 'FeatureCollection'
  features: ControlZoneFeature[]
}
