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
