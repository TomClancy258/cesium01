import type { TooltipState } from '@/views/aviation-situation/types/shared'
import * as Cesium from 'cesium'

export function isValidCoordinate(
  longitude: unknown,
  latitude: unknown,
  altitude: unknown,
): boolean {
  return (
    longitude != null &&
    latitude != null &&
    altitude != null &&
    typeof longitude === 'number' &&
    typeof latitude === 'number' &&
    typeof altitude === 'number' &&
    isFinite(longitude) &&
    isFinite(latitude) &&
    isFinite(altitude)
  )
}

export function updateTooltip<T>(
  tooltip: TooltipState<T>,
  screenPosition: Cartesian2,
  properties: T
): void {
  tooltip.position.left = screenPosition.x + 10
  tooltip.position.top = screenPosition.y + 50
  tooltip.properties = { ...properties }
  tooltip.visible = true
}

/**
 * 让相机飞行到指定笛卡尔坐标位置，并将该位置的海拔抬高指定高度
 * @param viewer Cesium 视图实例
 * @param targetPosition 目标位置的笛卡尔坐标 (Cartesian3)
 * @param heightOffset 海拔偏移量（单位：米，正数升高，负数降低）
 * @param flyDuration 飞行时长（单位：秒，默认1.5秒）
 * @returns {void}
 */
export function flyToPositionWithHeightOffset(
  viewer: Cesium.Viewer,
  targetPosition: Cesium.Cartesian3,
  heightOffset: number,
  flyDuration: number = 1.5
): void {
  // 校验必要参数，避免运行时错误
  if (!viewer || !targetPosition) {
    console.warn('flyToPositionWithHeightOffset: 缺少必要的 viewer 或 targetPosition 参数');
    return;
  }

  try {
    // 将笛卡尔坐标转换为地理坐标（弧度+海拔）
    const cartographic: Cesium.Cartographic = Cesium.Cartographic.fromCartesian(targetPosition);

    // 调整海拔高度
    cartographic.height += heightOffset;

    // 将调整后的地理坐标转回笛卡尔坐标
    const destination: Cesium.Cartesian3 = Cesium.Cartographic.toCartesian(cartographic);

    // 让相机飞行到目标位置
    viewer.camera.flyTo({
      destination: destination,
      duration: flyDuration,
    });
  } catch (error) {
    console.error('flyToPositionWithHeightOffset 执行出错:', error);
  }
}

/**
 * 获取Cesium相机的海拔高度（米）
 * @param camera - 相机实例（从viewer.camera获取）
 * @returns 海拔高度（米）
 */
export const getCameraHeight = (camera: Cesium.Camera): number => {
  const cartographic:Cesium.Cartographic = Cesium.Cartographic.fromCartesian(camera.position);
  return cartographic.height || 0; // 兜底避免undefined
};

// 格式化经纬度（保留指定小数位）
export const formatLngLatAlt = (
  lngLatAlt: TemplePointLabelPositionLngLatAlt
): TemplePointLabelPositionLngLatAlt => {
  return {
    longitude: Number(lngLatAlt.longitude.toFixed(6)),
    latitude: Number(lngLatAlt.latitude.toFixed(6)),
    height: Number(lngLatAlt.height.toFixed(2))
  };
};


// 封装 cartesian3 转经纬度（非弧度）的工具函数
export const cartesian3ToLngLatAlt = (cartesian: Cesium.Cartesian3): TemplePointLabelPositionLngLatAlt => {
  const cartographic:Cesium.Cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  return {
    longitude: Cesium.Math.toDegrees(cartographic.longitude),
    latitude: Cesium.Math.toDegrees(cartographic.latitude),
    height: cartographic.height
  };
};

// 计算两点间距离（米）计算的是两点之间的直线距离（欧几里得距离/弦长），即穿过地球内部的直线长度，而不是沿着地球表面的真实地理距离（大地线距离）。
export const calculateDistance = (pos1: number[], pos2: number[]): number => {
  const cartesian1 = Cesium.Cartesian3.fromDegrees(pos1[0], pos1[1], pos1[2] || 0)
  const cartesian2 = Cesium.Cartesian3.fromDegrees(pos2[0], pos2[1], pos2[2] || 0)
  return Cesium.Cartesian3.distance(cartesian1, cartesian2)
}

//获取沿地球椭球体表面的真实地理距离
export const calculateSurfaceDistance = (pos1: number[], pos2: number[]): number => {
  if (!pos1 || !pos2) return 0;

  const ellipsoid:Cesium.Ellipsoid = Cesium.Ellipsoid.WGS84;

  // 1. 将经纬度转换为 Cartographic (弧度制)
  // EllipsoidGeodesic 需要的是 Cartographic 对象 (longitude, latitude, height)，单位是弧度
  const cartographic1:Cesium.Cartographic = Cesium.Cartographic.fromDegrees(pos1[0], pos1[1], pos1[2] || 0);
  const cartographic2:Cesium.Cartographic = Cesium.Cartographic.fromDegrees(pos2[0], pos2[1], pos2[2] || 0);

  // 2. 创建大地测量对象
  const geodesic:Cesium.EllipsoidGeodesic = new Cesium.EllipsoidGeodesic(cartographic1, cartographic2, ellipsoid);

  // 3. 获取表面距离 (单位：米)
  const distance:number = geodesic.surfaceDistance;

  return distance;
};

/**
 * 计算两点在地表上的中间点 (沿大地线)
 * @param pos1 [经度, 纬度, 高度]
 * @param pos2 [经度, 纬度, 高度]
 * @returns { lon: number, lat: number, height: number } 返回角度制的经纬度和平均高度
 */
export const getSurfaceMidpoint = (pos1: number[], pos2: number[]) => {
  if (!pos1 || !pos2) return null;

  const ellipsoid = Cesium.Ellipsoid.WGS84;

  // 1. 转换为弧度制的 Cartographic
  const start = Cesium.Cartographic.fromDegrees(pos1[0], pos1[1], pos1[2] || 0);
  const end = Cesium.Cartographic.fromDegrees(pos2[0], pos2[1], pos2[2] || 0);

  // 2. 创建大地测量对象
  const geodesic = new Cesium.EllipsoidGeodesic(start, end, ellipsoid);

  // 3. 【修正】使用 interpolateUsingFraction 获取中间点
  // 参数 0.5 表示 50% 处 (起点是 0.0, 终点是 1.0)
  // 该方法返回的是 Cartographic (弧度制)
  const midCartographic = geodesic.interpolateUsingFraction(0.5);

  // 4. 处理高度 (取两点高度的平均值)
  const avgHeight = ((pos1[2] || 0) + (pos2[2] || 0)) / 2;

  // 覆盖高度，因为 interpolateUsingFraction 返回的高度通常是 0 (椭球面)
  midCartographic.height = avgHeight;

  // 5. 转回角度制方便使用
  return {
    longitude: Cesium.Math.toDegrees(midCartographic.longitude),
    latitude: Cesium.Math.toDegrees(midCartographic.latitude),
    height: midCartographic.height
  };
};

/**
 * 格式化距离显示：自动切换 m/km 并保留合适的小数位
 * @param distanceInMeters 距离（单位：米）
 * @returns 格式化后的字符串，如 "12.56 m" 或 "1.25 km"
 */
export const formatDistance = (distanceInMeters: number): string => {
  if (distanceInMeters < 0) return '0 m'; // 防止负数

  // 1. 小于 1000 米：显示为米，保留 2 位小数
  if (distanceInMeters < 1000) {
    return `${distanceInMeters.toFixed(2)} m`;
  }

  // 2. 大于等于 1000 米：转换为千米
  const km = distanceInMeters / 1000;

  // 3. 小于 10 千米：保留 2 位小数 (例如 1.25 km)
  if (km < 10) {
    return `${km.toFixed(2)} km`;
  }

  // 4. 大于等于 10 千米：保留 1 位小数 (例如 15.3 km)
  return `${km.toFixed(1)} km`;
};
