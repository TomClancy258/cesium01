import * as Cesium from 'cesium'
import type { MatchedRadar } from '@/views/aviation-situation/types/radar'
import { isInCircle } from '@/utils/geoUtils'

/** 在 ENU 局部坐标系中采样圆环顶点，用于 GroundPolylineGeometry */
export const computeCircleRingPositions = (
  center: Cesium.Cartesian3,
  radiusMeters: number,
  segments = 128,
): Cesium.Cartesian3[] => {
  const transform = Cesium.Transforms.eastNorthUpToFixedFrame(center)
  const positions: Cesium.Cartesian3[] = []

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Cesium.Math.TWO_PI
    const local = new Cesium.Cartesian3(
      Math.cos(angle) * radiusMeters,
      Math.sin(angle) * radiusMeters,
      0,
    )
    positions.push(Cesium.Matrix4.multiplyByPoint(transform, local, new Cesium.Cartesian3()))
  }

  return positions
}

/** 地表水平距离判定：与圆形框选 / CircleGeometry 同语义 */
export const isPointInRadarRegion = (
  lngLat: [number, number],
  matchedRadar: MatchedRadar,
): boolean => {
  const { radar } = matchedRadar
  return isInCircle(
    [lngLat[0], lngLat[1], 0],
    [radar.center.longitude, radar.center.latitude, 0],
    radar.radiusMeters,
  )
}

