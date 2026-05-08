import * as Cesium from 'cesium'
import type { Satellite } from '@/network/satellite/type'

export interface SatelliteRenderItem {
  data: Satellite
  entity: Cesium.Entity
  positionProperty: Cesium.SampledPositionProperty
  cylinderLengthProperty: Cesium.ConstantProperty
}
