import * as Cesium from 'cesium'
import type { Satellite, Scan } from '@/network/satellite/type'
import { LngLatAlt } from '@/views/aviation-situation/types/shared'

export interface SatelliteRenderItem {
  data: Satellite
  entity: Cesium.Entity
  positionProperty: Cesium.SampledPositionProperty
  cylinderLengthProperty: Cesium.ConstantProperty
}

export interface SatelliteHoveredProperties {
  id: string
  sourceType: 'satellite'
  name: string
  country: string
  scan: Scan
  description: string
  lngLatAlt: {
    longitude: number
    latitude: number
    height: number
  }
  // screenPosition:Cesium.Cartesian2
}

export type SatelliteProperties = SatelliteHoveredProperties

export interface SatelliteModelHighlightStyle {
  silhouetteColor: Cesium.Color
  silhouetteSize: number
}

export interface SatelliteHighlightConfig {
  sourceType: 'satellite'
  style: SatelliteModelHighlightStyle
}

export interface SatelliteFilterForm {
  id: string
  name: string
  countries: string[]
  visible: boolean
}

export interface ConeSnapshot {
  id: string
  topRadius: number
  bottomRadius: number
  length: number
  apexPosition: Cesium.Cartesian3
  axisDirection: Cesium.Cartesian3
  lngLatAlt: LngLatAlt
}
