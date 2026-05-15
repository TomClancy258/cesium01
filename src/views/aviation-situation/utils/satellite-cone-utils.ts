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
  // v = P - A
  const v = Cesium.Cartesian3.subtract(p, cone.apexPosition, new Cesium.Cartesian3())

  // 轴向投影距离 t
  const t = Cesium.Cartesian3.dot(v, cone.axisDirection)

  // 不在圆锥高度区间
  if (t < -EPS || t > cone.length + EPS) return false

  // 该截面允许半径 r(t)
  const r = (cone.bottomRadius / cone.length) * Math.max(0, t)

  // 径向距离 radial = |v - d*t|
  const dt = Cesium.Cartesian3.multiplyByScalar(cone.axisDirection, t, new Cesium.Cartesian3())
  const radialVec = Cesium.Cartesian3.subtract(v, dt, new Cesium.Cartesian3())
  const radial = Cesium.Cartesian3.magnitude(radialVec)

  // 侧面+内部
  if (radial <= r + EPS) return true

  // 可选：底面单独算命中（只在底面平面附近）
  if (includeBase) {
    const nearBasePlane = Math.abs(t - cone.length) <= EPS
    if (nearBasePlane && radial <= cone.bottomRadius + EPS) return true
  }

  return false
}
