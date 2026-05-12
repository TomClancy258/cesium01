import * as Cesium from 'cesium'
import type { Satellite } from '@/network/satellite/type'

export interface SatelliteRenderItem {
  data: Satellite
  entity: Cesium.Entity
  positionProperty: Cesium.SampledPositionProperty
  cylinderLengthProperty: Cesium.ConstantProperty
}

export interface SatelliteHoveredProperties{
  id:string,
  sourceType:'satellite',
  name:string,
  country:string,
  description:string,
  lngLatAlt:{
    longitude: number
    latitude: number
    height: number
  },
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

export interface SatelliteFilterForm{
  id: string,
  name: string,
  countries: string[],
  visible: boolean,
}
