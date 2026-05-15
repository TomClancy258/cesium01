import * as Cesium from 'cesium'
const EPS = 1e-3

export function isPointInCone(
  p: Cesium.Cartesian3,
  cone: {
    apexPosition: Cesium.Cartesian3
    axisDirection: Cesium.Cartesian3 // unit vector
    length: number
    bottomRadius: number
  },
  includeBase = true,
): boolean {
  void includeBase

  const axis = Cesium.Cartesian3.normalize(cone.axisDirection, new Cesium.Cartesian3())

  // v = P - A
  const v = Cesium.Cartesian3.subtract(p, cone.apexPosition, new Cesium.Cartesian3())
  const vMagnitude = Cesium.Cartesian3.magnitude(v)
  if (vMagnitude <= EPS) return false

  // 点需在圆锥朝向前方：dot(v, axisDirection) > 0
  const t = Cesium.Cartesian3.dot(v, axis)
  if (t <= EPS) return false

  // 允许一定“曲率补偿”的深度上限，避免无限锥导致的远距离误命中。
  // sagitta ~= R - sqrt(R^2 - r^2)，r 用底部半径近似地面覆盖半径。
  const earthRadius = Cesium.Ellipsoid.WGS84.maximumRadius
  const footprintRadius = Math.min(Math.max(cone.bottomRadius, 0), earthRadius - 1)
  const curvatureAllowance =
    footprintRadius > 0
      ? earthRadius - Math.sqrt(Math.max(0, earthRadius * earthRadius - footprintRadius * footprintRadius))
      : 0
  if (t > cone.length + curvatureAllowance + EPS) return false

  // 半角 alpha = atan(bottomRadius / length)
  const safeLength = Math.max(cone.length, EPS)
  const alpha = Math.atan(cone.bottomRadius / safeLength)
  const cosAlpha = Math.cos(alpha)

  // angle(v, axisDirection) <= alpha
  // 采用 cos 比较，等价且更稳定：
  // cos(theta) = dot(normalize(v), axis)
  const normalizedV = Cesium.Cartesian3.divideByScalar(v, vMagnitude, new Cesium.Cartesian3())
  const cosTheta = Cesium.Cartesian3.dot(normalizedV, axis)

  // 不再依赖 t <= length 的有限截断，避免曲率引发的边缘漏判
  return cosTheta + EPS >= cosAlpha
}
