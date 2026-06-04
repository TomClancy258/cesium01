import * as Cesium from 'cesium'

const EPS = 1e-3
const SAFETY_M = 5000
const WGS84_R = Cesium.Ellipsoid.WGS84.maximumRadius

const scratchV = new Cesium.Cartesian3()
const scratchNormV = new Cesium.Cartesian3()
const scratchCarto = new Cesium.Cartographic()

export interface ConeInput {
  apexPosition: Cesium.Cartesian3
  axisDirection: Cesium.Cartesian3
  length: number
  bottomRadius: number
  lngLatAlt: { longitude: number; latitude: number }
}

export interface ConeQueryContext {
  apexPosition: Cesium.Cartesian3
  axisDirection: Cesium.Cartesian3
  maxAxialDistance: number
  maxChordDistanceSq: number
  nadirLatRad: number
  nadirLonRad: number
  maxSurfaceDistanceM: number
  minLatRad: number
  maxLatRad: number
  minLonRad: number
  maxLonRad: number
  cosAlpha: number
}

function computeCurvatureAllowance(bottomRadius: number): number {
  const footprintRadius = Math.min(Math.max(bottomRadius, 0), WGS84_R - 1)
  if (footprintRadius <= 0) return 0
  return WGS84_R - Math.sqrt(Math.max(0, WGS84_R * WGS84_R - footprintRadius * footprintRadius))
}

function haversineM(lon1Rad: number, lat1Rad: number, lon2Rad: number, lat2Rad: number): number {
  const dLat = lat2Rad - lat1Rad
  const dLon = lon2Rad - lon1Rad
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2
  return 2 * WGS84_R * Math.asin(Math.min(1, Math.sqrt(a)))
}

function isLonInRange(lonRad: number, minLonRad: number, maxLonRad: number): boolean {
  if (minLonRad <= maxLonRad) {
    return lonRad >= minLonRad && lonRad <= maxLonRad
  }
  return lonRad >= minLonRad || lonRad <= maxLonRad
}

export function createConeQueryContext(cone: ConeInput): ConeQueryContext {
  const curvatureAllowance = computeCurvatureAllowance(cone.bottomRadius)
  const maxAxialDistance = cone.length + curvatureAllowance + EPS
  const maxChord = Math.hypot(maxAxialDistance, cone.bottomRadius) + SAFETY_M
  const maxSurfaceDistanceM = cone.bottomRadius + curvatureAllowance + SAFETY_M

  const nadirLatRad = Cesium.Math.toRadians(cone.lngLatAlt.latitude)
  const nadirLonRad = Cesium.Math.toRadians(cone.lngLatAlt.longitude)

  const deltaLat = maxSurfaceDistanceM / 111_320
  const cosLat = Math.max(Math.cos(nadirLatRad), 0.01)
  const deltaLon = maxSurfaceDistanceM / (111_320 * cosLat)

  const safeLength = Math.max(cone.length, EPS)
  const alpha = Math.atan(cone.bottomRadius / safeLength)

  return {
    apexPosition: cone.apexPosition,
    axisDirection: Cesium.Cartesian3.normalize(cone.axisDirection, new Cesium.Cartesian3()),
    maxAxialDistance,
    maxChordDistanceSq: maxChord * maxChord,
    nadirLatRad,
    nadirLonRad,
    maxSurfaceDistanceM,
    minLatRad: nadirLatRad - deltaLat,
    maxLatRad: nadirLatRad + deltaLat,
    minLonRad: nadirLonRad - deltaLon,
    maxLonRad: nadirLonRad + deltaLon,
    cosAlpha: Math.cos(alpha),
  }
}

function passesCoarseFilter(p: Cesium.Cartesian3, ctx: ConeQueryContext): boolean {
  const chordSq = Cesium.Cartesian3.distanceSquared(p, ctx.apexPosition)
  if (chordSq > ctx.maxChordDistanceSq) return false

  Cesium.Cartesian3.subtract(p, ctx.apexPosition, scratchV)
  const t = Cesium.Cartesian3.dot(scratchV, ctx.axisDirection)
  if (t <= EPS || t > ctx.maxAxialDistance) return false

  Cesium.Cartographic.fromCartesian(p, Cesium.Ellipsoid.WGS84, scratchCarto)
  const lat = scratchCarto.latitude
  const lon = scratchCarto.longitude
  if (lat < ctx.minLatRad || lat > ctx.maxLatRad) return false
  if (!isLonInRange(lon, ctx.minLonRad, ctx.maxLonRad)) return false

  return haversineM(ctx.nadirLonRad, ctx.nadirLatRad, lon, lat) <= ctx.maxSurfaceDistanceM
}

function passesPreciseConeAngle(p: Cesium.Cartesian3, ctx: ConeQueryContext): boolean {
  Cesium.Cartesian3.subtract(p, ctx.apexPosition, scratchV)
  const vMagnitude = Cesium.Cartesian3.magnitude(scratchV)
  if (vMagnitude <= EPS) return false

  Cesium.Cartesian3.divideByScalar(scratchV, vMagnitude, scratchNormV)
  const cosTheta = Cesium.Cartesian3.dot(scratchNormV, ctx.axisDirection)
  return cosTheta + EPS >= ctx.cosAlpha
}

export function isPointInConeWithContext(p: Cesium.Cartesian3, ctx: ConeQueryContext): boolean {
  if (!passesCoarseFilter(p, ctx)) return false
  return passesPreciseConeAngle(p, ctx)
}

export function isPointInCone(
  p: Cesium.Cartesian3,
  cone: ConeInput,
  includeBase = true,
): boolean {
  void includeBase
  return isPointInConeWithContext(p, createConeQueryContext(cone))
}
