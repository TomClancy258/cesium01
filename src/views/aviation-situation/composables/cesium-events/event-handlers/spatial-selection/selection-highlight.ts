import * as turf from '@turf/turf';
import * as Cesium from 'cesium';

// 类型定义：机场/飞机点数据
interface PointEntity {
  id: string;
  position: Cesium.Cartesian3; // Cesium坐标
  entity: Cesium.Entity; // Cesium实体（用于修改样式）
  type: 'airport' | 'airplane'; // 类型标识
}

// 存储所有机场/飞机实体
const pointEntities: PointEntity[] = [];

/**
 * 初始化：收集所有机场/飞机实体（示例）
 * @param viewer Cesium.Viewer实例
 */
export function initPointEntities(viewer: Cesium.Viewer) {
  // 假设你已通过接口/本地数据加载机场/飞机，这里模拟添加
  // 实际场景替换为你的真实数据逻辑
  const airports = [/* 你的机场数据 */];
  const airplanes = [/* 你的飞机数据 */];

  airports.forEach(item => {
    const entity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(item.lng, item.lat, item.alt),
      billboard: {
        image: item.imgUrl,
        color: Cesium.Color.WHITE, // 默认颜色
      }
    });
    pointEntities.push({
      id: item.id,
      position: entity.position.getValue(Cesium.JulianDate.now()),
      entity,
      type: 'airport'
    });
  });

  airplanes.forEach(item => {
    // 飞机实体逻辑类似...
  });
}

/**
 * 判断点是否在多边形内，并修改样式
 * @param polygonCoords 多边形经纬度坐标数组 [[lng1, lat1], [lng2, lat2], ...]
 */
export function highlightPointsInPolygon(polygonCoords: number[][]) {
  // 1. 构建Turf多边形
  const turfPolygon = turf.polygon([polygonCoords]);

  // 2. 遍历所有点，判断并修改样式
  pointEntities.forEach(point => {
    // 将Cesium笛卡尔坐标转为经纬度
    const cartographic = Cesium.Cartographic.fromCartesian(point.position);
    const lng = Cesium.Math.toDegrees(cartographic.longitude);
    const lat = Cesium.Math.toDegrees(cartographic.latitude);

    // 构建Turf点
    const turfPoint = turf.point([lng, lat]);

    // 3. 判断是否在内，并修改颜色
    const isInPolygon = turf.booleanPointInPolygon(turfPoint, turfPolygon);
    if (isInPolygon) {
      // 被框选：设置突出颜色（如红色）
      if (point.entity.billboard) {
        point.entity.billboard.color = Cesium.Color.RED;
      }
    } else {
      // 未被框选：恢复默认颜色
      if (point.entity.billboard) {
        point.entity.billboard.color = Cesium.Color.WHITE;
      }
    }
  });
}

/**
 * 判断点是否在圆形内，并修改样式
 * @param center [lng, lat] 圆心经纬度
 * @param radius 半径（单位：米）
 */
export function highlightPointsInCircle(center: number[], radius: number) {
  const turfCenter = turf.point(center);

  pointEntities.forEach(point => {
    const cartographic = Cesium.Cartographic.fromCartesian(point.position);
    const lng = Cesium.Math.toDegrees(cartographic.longitude);
    const lat = Cesium.Math.toDegrees(cartographic.latitude);
    const turfPoint = turf.point([lng, lat]);

    // Turf的圆形判断：半径单位为千米，需转换（米→千米）
    const isInCircle = turf.booleanPointInCircle(turfPoint, turfCenter, radius / 1000);
    if (isInCircle) {
      point.entity.billboard.color = Cesium.Color.RED;
    } else {
      point.entity.billboard.color = Cesium.Color.WHITE;
    }
  });
}

/**
 * 矩形框选：将矩形转为多边形，复用多边形判断逻辑
 * @param rectCoords 矩形四个角经纬度 [[lng1, lat1], [lng2, lat2], [lng3, lat3], [lng4, lat4]]
 */
export function highlightPointsInRectangle(rectCoords: number[][]) {
  // 矩形本质是多边形，直接调用多边形判断
  highlightPointsInPolygon(rectCoords);
}
