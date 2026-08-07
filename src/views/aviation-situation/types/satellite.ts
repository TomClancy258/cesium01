import * as Cesium from 'cesium'
import type { Scan, Satellite } from '@/network/satellite/type'
import type { Aircraft } from '@/network/aircraft/types/aircraft'
import type { Airport } from '@/network/airport/type'
import type { LngLatAlt, TooltipState } from '@/views/aviation-situation/types/shared'

export type MatchedSatellite = Satellite & {
  aircraft: { aircraftMap: Map<string, Aircraft> }
  airport: { airportMap: Map<string, Airport> }
}

export interface SatelliteRenderItem {
  data: Satellite
  entity: Cesium.Entity
  positionProperty: Cesium.SampledPositionProperty
  cylinderLengthProperty: Cesium.ConstantProperty
}

/** tooltip / 选中态业务快照（不挂在 entity.properties 上） */
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
}

export type SatelliteTooltipState = TooltipState<SatelliteHoveredProperties>

/** 挂在卫星 Entity.properties 上：拾取身份 + 高亮还原用渲染态 */
export interface SatelliteProperties {
  id: string
  sourceType: 'satellite'
  model: {
    silhouetteSize: number
    silhouetteColor: Cesium.Color
  }
  path: {
    show: boolean
  }
}

export interface SatelliteModelHighlightStyle {
  silhouetteColor: Cesium.Color
  silhouetteSize: number
}

export interface SatelliteHighlightConfig {
  sourceType: 'satellite'
  modelStyle: SatelliteModelHighlightStyle
  pathStyle: {
    show: boolean
  }
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
  scan: Scan
  lngLatAlt: LngLatAlt
}

export interface SatelliteConeScanResults {
  aircraftBySatelliteId: Map<string, Map<string, Aircraft>>
  airportBySatelliteId: Map<string, Map<string, Airport>>
}

export type SatelliteConeSnapshotListener = (
  aircraftConeSnapshots: ConeSnapshot[],
  airportConeSnapshots: ConeSnapshot[],
) => SatelliteConeScanResults | void
