import * as Cesium from 'cesium'
import { Satellite } from '@/network/satellite/type'

export interface SatelliteRenderItem {
  data: Satellite
  entity: Cesium.Entity
}
