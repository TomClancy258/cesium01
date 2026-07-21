/** GeoJSON 坐标点：[经度, 纬度]；第三维高度可选，楼脚线一般不用 */
export type PhotogrammetryBuildingPosition = [number, number] | [number, number, number]

/**
 * Polygon 坐标：[[外环点...], [内环点...]?]
 * 外环首尾点需闭合
 */
export type PhotogrammetryBuildingPolygonCoordinates = PhotogrammetryBuildingPosition[][]

/** 裁切用经纬度包围盒（度） */
export interface PhotogrammetryBuildingBBox {
  west: number
  south: number
  east: number
  north: number
}

/** 归一化后的楼栋 Feature.properties（Classification / tooltip / 详情） */
export interface PhotogrammetryBuildingProperties {
  id: string
  name: string
  /**
   * Cesium PolygonGeometry.height：挤出底（椭球高，米）
   * Melbourne 用 structure_min_elevation（绝对高）
   */
  minHeight: number
  /**
   * Cesium PolygonGeometry.extrudedHeight：挤出顶（椭球高，米）
   * 必须 > minHeight
   */
  height: number
  /** 业务楼高（米），供 tooltip；不等于 extrudedHeight */
  buildingHeight?: number
  /** 城市 */
  city?: 'Boston' | 'Melbourne' | 'SanFrancisco'
  /** 用地 / 类型（Boston Land_Use 等） */
  landUse?: string
  /** 屋顶类型（Melbourne roof_type） */
  roofType?: string
}

export interface PhotogrammetryBuildingPolygonGeometry {
  type: 'Polygon'
  coordinates: PhotogrammetryBuildingPolygonCoordinates
}

export interface PhotogrammetryBuildingFeature {
  type: 'Feature'
  properties: PhotogrammetryBuildingProperties
  geometry: PhotogrammetryBuildingPolygonGeometry
}

export interface PhotogrammetryBuildingCrs {
  type: 'name'
  properties: {
    name: string
  }
}

export interface PhotogrammetryBuildingFeatureCollection {
  type: 'FeatureCollection'
  name?: string
  crs?: PhotogrammetryBuildingCrs
  features: PhotogrammetryBuildingFeature[]
}

/** Boston Buildings with Roof Breaks（原始 properties） */
export interface BostonBuildingRawProperties {
  OBJECTID?: number
  PART_USE?: string | null
  Land_Use?: string | null
  GRND_ELEV_2010?: number | null
  ROOF_ELEV_2010?: number | null
  BLDG_HGT_2010?: number | null
  IEL_TYPE?: string | null
}

/** Melbourne 2023 building footprints（原始 properties） */
export interface MelbourneBuildingRawProperties {
  objectid?: string | number
  structure_id?: string | number
  footprint_type?: string | null
  roof_type?: string | null
  structure_extrusion?: number | null
  footprint_extrusion?: number | null
  structure_min_elevation?: number | null
  structure_max_elevation?: number | null
}

export interface PhotogrammetryRawBuildingFeature {
  type: 'Feature'
  id?: string | number
  properties: Record<string, unknown>
  geometry: {
    type: string
    coordinates: unknown
  }
}

export interface PhotogrammetryRawBuildingFeatureCollection {
  type: 'FeatureCollection'
  features: PhotogrammetryRawBuildingFeature[]
}
