//geoUtils.ts
import {
  LngLatAlt,
  TooltipState,
  SelectionRegionBase,
  FinishedSpatialSelectionData,
  FinishedPolygonSpatialSelectionData,
  FinishedCircleSpatialSelectionData,
  FinishedHemisphereSpatialSelectionData
} from '@/views/aviation-situation/types/shared'
import * as Cesium from 'cesium'
import * as turf from '@turf/turf'
import {ShallowRef} from "vue"
import {LngLatAltArray} from "@/views/aviation-situation/types/shared.ts"

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

// 判断飞机/机场是否在半球内
export const isInsideHemisphere = (
  targetLngLatAlt: number[],   // 目标点 [lng, lat, alt]
  centerLngLatAlt: number[],   // 球心 [lng, lat, alt]
  radius: number,              // 绘制时用 calculateSurfaceDistance 得到的半径
): boolean => {
  // ✅ 用三维直线距离判断是否在球体内
  const distance = calculateDistance(targetLngLatAlt, centerLngLatAlt)
  if (distance > radius) return false

  // ✅ 半球：只保留球心以上的部分（高度 >= 球心高度）
  const targetAlt = targetLngLatAlt[2] ?? 0
  const centerAlt = centerLngLatAlt[2] ?? 0
  return targetAlt >= centerAlt
}

//获取沿地球椭球体表面的真实地理距离
export const calculateSurfaceDistance = (pos1: number[], pos2: number[]): number => {
  const geodesic=calculateSurfaceGeodesic(pos1,pos2)

  // 3. 获取表面距离 (单位：米)
  const distance:number = geodesic.surfaceDistance;

  // const posS = geodesic.interpolateUsingFraction(0);
  // const posE = geodesic.interpolateUsingFraction(1);
  // const coordS=[
  //   Cesium.Math.toDegrees(posS.longitude),
  //   Cesium.Math.toDegrees(posS.latitude)
  // ]
  // const coordE=[
  //   Cesium.Math.toDegrees(posE.longitude),
  //   Cesium.Math.toDegrees(posE.latitude)
  // ]
  //
  // console.log("pos1", pos1);
  // console.log("coordS", coordS);
  // console.log('\n')
  // console.log("pos2", pos2);
  // console.log("coordE", coordE);

  return distance;
};

//获取沿地球椭球体表面的真实地理距离
export const calculateSurfaceGeodesic = (pos1: number[], pos2: number[]): Cesium.EllipsoidGeodesic => {
  if (!pos1 || !pos2) return 0;

  const ellipsoid:Cesium.Ellipsoid = Cesium.Ellipsoid.WGS84;

  // 1. 将经纬度转换为 Cartographic (弧度制)
  // EllipsoidGeodesic 需要的是 Cartographic 对象 (longitude, latitude, height)，单位是弧度
  const cartographic1:Cesium.Cartographic = Cesium.Cartographic.fromDegrees(pos1[0], pos1[1], pos1[2] || 0);
  const cartographic2:Cesium.Cartographic = Cesium.Cartographic.fromDegrees(pos2[0], pos2[1], pos2[2] || 0);

  // 2. 创建大地测量对象
  const geodesic:Cesium.EllipsoidGeodesic = new Cesium.EllipsoidGeodesic(cartographic1, cartographic2, ellipsoid);

  return geodesic;
};

/**
 * 计算两点在地表上的中间点 (沿大地线)
 * @param pos1 [经度, 纬度, 高度]
 * @param pos2 [经度, 纬度, 高度]
 * @returns { lon: number, lat: number, height: number } 返回角度制的经纬度和平均高度
 */
export const getSurfaceMidpoint = (pos1: number[], pos2: number[]):LngLatAlt => {
  if (!pos1 || !pos2) return null;

  const ellipsoid:Cesium.Ellipsoid = Cesium.Ellipsoid.WGS84;

  // 1. 转换为弧度制的 Cartographic
  const start:Cesium.Cartographic = Cesium.Cartographic.fromDegrees(pos1[0], pos1[1], pos1[2] || 0);
  const end:Cesium.Cartographic = Cesium.Cartographic.fromDegrees(pos2[0], pos2[1], pos2[2] || 0);

  // 2. 创建大地测量对象
  const geodesic:Cesium.EllipsoidGeodesic = new Cesium.EllipsoidGeodesic(start, end, ellipsoid);

  // 3. 【修正】使用 interpolateUsingFraction 获取中间点
  // 参数 0.5 表示 50% 处 (起点是 0.0, 终点是 1.0)
  // 该方法返回的是 Cartographic (弧度制)
  const midCartographic:Cesium.Cartographic = geodesic.interpolateUsingFraction(0.5);

  // 4. 处理高度 (取两点高度的平均值)
  const avgHeight:number = ((pos1[2] || 0) + (pos2[2] || 0)) / 2;

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
  const km:number = distanceInMeters / 1000;

  // 3. 小于 10 千米：保留 2 位小数 (例如 1.25 km)
  if (km < 10) {
    return `${km.toFixed(2)} km`;
  }

  // 4. 大于等于 10 千米：保留 1 位小数 (例如 15.3 km)
  return `${km.toFixed(1)} km`;
};


/**
 * 计算折线总长度（所有线段长度之和）
 * @param lngLatAltArray 经纬度海拔数组（3个一组）
 * @returns 总长度（单位和`calculateSurfaceDistance`保持一致）
 */
export const calculatePolylineTotalDistance = (lngLatAltArray: number[]): number => {
  let totalLength = 0;
  // 至少2个点（6个元素）才计算长度
  if (lngLatAltArray.length < 6) return totalLength;

  // 遍历所有线段，累加长度
  for (let i = 0; i < lngLatAltArray.length - 3; i += 3) {
    const startPoint = [
      lngLatAltArray[i],
      lngLatAltArray[i + 1],
      lngLatAltArray[i + 2],
    ];
    const endPoint = [
      lngLatAltArray[i + 3],
      lngLatAltArray[i + 4],
      lngLatAltArray[i + 5],
    ];
    totalLength += calculateSurfaceDistance(startPoint, endPoint);
  }
  return totalLength;
};

export const calculatePolygonPerimeter = (lngLatAltArray: number[]): number => {
  let perimeter = 0;
  // 至少3个点（9个元素）才计算长度
  if (lngLatAltArray.length < 9) return perimeter;

  const lngLatAltArrayPushFirstPoint:number[]=closePolygonRing(lngLatAltArray)
  // 遍历所有线段，累加长度
  for (let i = 0; i < lngLatAltArrayPushFirstPoint.length - 3; i += 3) {
    const startPoint = [
      lngLatAltArrayPushFirstPoint[i],
      lngLatAltArrayPushFirstPoint[i + 1],
      lngLatAltArrayPushFirstPoint[i + 2],
    ];
    const endPoint = [
      lngLatAltArrayPushFirstPoint[i + 3],
      lngLatAltArrayPushFirstPoint[i + 4],
      lngLatAltArrayPushFirstPoint[i + 5],
    ];
    perimeter += calculateSurfaceDistance(startPoint, endPoint);
  }
  return perimeter;
};

export const closePolygonRing=(lngLatAltArray: number[]):number[]=>{
  const pointCount:number=lngLatAltArray.length/3
  if (pointCount <= 2) {
    return lngLatAltArray
  }
  return [...lngLatAltArray,lngLatAltArray[0],lngLatAltArray[1],lngLatAltArray[2]]
}

export const calculateArea = (lngLatAltArray: number[]): number => {
  let area:number = 0;
  // 至少3个点（9个元素）才计算长度
  if (lngLatAltArray.length < 9) return area;

  const polygon:turf.Feature<turf.Polygon> = createPolygonFromLngLatAltArray(lngLatAltArray); // 注意嵌套：polygon([[...]])

  area = turf.area(polygon); // 单位：平方米
  return area;
};

export const calculateAreaFromGraphic = (graphic): number => {
  let area:number = 0;

  area = turf.area(graphic); // 单位：平方米
  return area;
};

/**
 * 格式化面积显示：自动切换 m² / ha / km² 并保留合适的小数位
 * @param areaInSquareMeters 面积（单位：平方米）
 * @returns 格式化后的字符串，如 "1234.56 m²"、"12.34 ha" 或 "1.25 km²"
 */
export const formatArea = (areaInSquareMeters: number): string => {
  if (areaInSquareMeters < 0) return '0 m²'; // 防止负数

  const absArea:number = areaInSquareMeters;

  // 1. 小于 10,000 平方米：显示为 m²，保留 2 位小数
  if (absArea < 10_000) {
    return `${absArea.toFixed(2)} m²`;
  }

  // 2. 小于 1,000,000 平方米（即 < 100 公顷）：转换为公顷（1 ha = 10,000 m²）
  if (absArea < 1_000_000) {
    const hectares = absArea / 10_000;
    return `${hectares.toFixed(2)} ha`;
  }

  // 3. 大于等于 1,000,000 平方米：转换为平方公里（1 km² = 1,000,000 m²）
  const km2:number = absArea / 1_000_000;

  // 可选：对超大区域（如 > 100 km²）减少小数位，但通常保留 2 位已足够清晰
  if (km2 >= 100) {
    return `${km2.toFixed(1)} km²`;
  }

  return `${km2.toFixed(2)} km²`;
};


export const createPolygonFromLngLatAltArray=(
  lngLatAltArray:number[],
  maxSegmentLength: number = 10000): turf.Feature<turf.Polygon>=>{
  const closedRing:number[]=closePolygonRing(lngLatAltArray)

  const pointCount:number=closedRing.length/3
  if (pointCount < 3) {
    throw new Error('Polygon must have at least 3 points');
  }

  // 2. 提取纯 [lng, lat] 点列（忽略 altitude）
  const originalCoords: [number, number][] = [];
  for (let i = 0; i < pointCount; i++) {
    const idx = i * 3;
    originalCoords.push([closedRing[idx], closedRing[idx + 1]]);
  }

  // 3. 对每条边插值
  const interpolatedCoords: [number, number][] = [];
  // interpolatedCoords.push(originalCoords[0])
  for (let i = 0; i < originalCoords.length - 1; i++) {
    const start = originalCoords[i];
    const end = originalCoords[i + 1];

    // const isLastSegment=i===originalCoords.length - 2;
    // console.log("isLastSegment", isLastSegment);

    //interpolated为[[A经度,A纬度],[A1经度,A1纬度],[B2经度,B2纬度],[B经度,B纬度]]
    const interpolated = interpolateGeodesicEdge(start, end, maxSegmentLength,
      // isLastSegment
    );

    //interpolatedCoords为[[A经度,A纬度],[B经度,B纬度],[C经度,C纬度],[A经度,A纬度]]
    interpolatedCoords.push(...interpolated);
  }
  // console.log("interpolatedCoords", interpolatedCoords);
  // 4. 构建 Turf 多边形（注意：Turf 要求外环是逆时针，但 booleanPointInPolygon 不敏感）
  return turf.polygon([interpolatedCoords]);
}

/**
 * 根据半径动态设置圆的边数（steps）
 * - 小范围（<1km）：32 边足够平滑且高效
 * - 中等范围（1~10km）：64 边
 * - 大范围（10~100km）：128 边
 * - 超大范围（≥100km）：256 边（上限，避免性能问题）
 */
const getCircleSteps = (radiusInMeters: number): number => {
  if (radiusInMeters < 1_000) return 32;
  if (radiusInMeters < 10_000) return 64;
  if (radiusInMeters < 100_000) return 128;
  return 256; // 最大值
};

export const createCircleFromCenterAndRadius = (
  lngLatAltArray: number[],
  radiusInMeters: number
):turf.Feature<turf.Polygon> => {
  const steps = getCircleSteps(radiusInMeters);
  return turf.circle(
    [lngLatAltArray[0], lngLatAltArray[1]],
    radiusInMeters,
    { steps, units: 'meters' }
  );
};

export const calculatePerimeterFromGraphic = (graphic):number => {
  return turf.length(graphic)
};


export const calculateCentroidLngLatAlt=(lngLatAltArray:number[]):LngLatAlt=>{
  const polygon:turf.Feature<turf.Polygon>=createPolygonFromLngLatAltArray(lngLatAltArray)
  const center:turf.Feature<turf.Point> = turf.centerOfMass(polygon);
  const centerCoord = center.geometry.coordinates;
  return {
    longitude:centerCoord[0],
    latitude:centerCoord[1],
    height:0,
  }
}

// geoUtils.ts —— 新增工具函数

/**
 * 对一条测地线边进行插值（按最大分段长度）
 * @param start [lng, lat]
 * @param end   [lng, lat]
 * @param maxSegmentLength 最大分段长度（米），默认 1000 米
 * @returns 插值点数组（包含起点，不含终点）
 */
function interpolateGeodesicEdge(
  start: [number, number],
  end: [number, number],
  maxSegmentLength: number = 10000
): [number, number][] {
  const pos1 = [start[0], start[1], 0];
  const pos2 = [end[0], end[1], 0];

  const geodesic = calculateSurfaceGeodesic(pos1, pos2);
  const distance = geodesic.surfaceDistance;

  if (distance <= maxSegmentLength) {
    return [start, end]; // ✅ 修复这里
  }

  const numSegments = Math.ceil(distance / maxSegmentLength); // 更合理：确保每段 ≤ max
  const points: [number, number][] = [];
  points.push(start);

  // 只插值中间点，避免端点漂移
  for (let i = 1; i < numSegments; i++) {
    const frac = i / numSegments;
    const pos = geodesic.interpolateUsingFraction(frac);
    points.push([
      Cesium.Math.toDegrees(pos.longitude),
      Cesium.Math.toDegrees(pos.latitude)
    ]);
  }

  points.push(end);
  return points;
}

export const isInCircle=(lngLatAltArray:LngLatAltArray,center:LngLatAltArray,radius:number)=>{
  const distance=calculateSurfaceDistance(lngLatAltArray,center)
  return distance <= radius;
}


export function isPointInSelectionRegion(
  lngLat: [number, number],
  selectionRegion: SelectionRegionBase,
): boolean {
  const {
    sourceType,
    graphic,
    centerLngLatAltArray,
  } = selectionRegion

  if (sourceType === 'polygonSpatialSelection') {
    return turf.booleanPointInPolygon(turf.point(lngLat), graphic)
  }
  if (sourceType === 'circleSpatialSelection') {
    const radius=selectionRegion.label.radiusInfo.radius
    return isInCircle(lngLat, centerLngLatAltArray, radius)
  }
  if (sourceType === 'hemisphereSpatialSelection') {
    const radius=selectionRegion.label.radiusInfo.radius
    return isInsideHemisphere(lngLat, centerLngLatAltArray, radius)
  }
  return false
}

// 从 FinishedSpatialSelectionData 构建 SelectionRegionBase（避免直接持有原始对象引用）
export function buildRegionFromData(data: FinishedSpatialSelectionData): SelectionRegionBase {
  // 公共字段（三种 variant 都有）
  const base = {
    dataSourceName: data.dataSourceName,
    type: data.type,
    sourceType: data.sourceType,
    centroidLngLatAlt: data.centroidLngLatAlt,
    aircraft: { icao24Set: new Set(data.aircraft.icao24Set) },
    airport: { icaoSet: new Set(data.airport.icaoSet) },
    spatialSelectionTarget: data.spatialSelectionTarget,
  }

  // early return 使 TS 在每个分支内完成判别式窄化，无需任何 as 断言
  if (data.sourceType === 'polygonSpatialSelection') {
    return {
      ...base,
      graphic: data.graphic,
      label: {
        perimeterInfo: { ...data.label.perimeterInfo },
        areaInfo: { ...data.label.areaInfo },
      },
      polygonState: { ...data.polygonState },
      segments: [...data.segments],
    }
  }

  // circleSpatialSelection | hemisphereSpatialSelection
  return {
    ...base,
    centerLngLatAltArray: [...data.centerLngLatAltArray],
    label: {
      perimeterInfo: { ...data.label.perimeterInfo },
      areaInfo: { ...data.label.areaInfo },
      radiusInfo: { ...data.label.radiusInfo },
    },
  }
}

export const flyToLngLatAlt = (viewer:ShallowRef<Cesium.Viewer>,lngLatAlt: LngLatAlt,offsetHeight:number=500000): void => {
  viewer.value.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      lngLatAlt.longitude,
      lngLatAlt.latitude,
      lngLatAlt.height + offsetHeight
    ),
    orientation: {
      // heading: Cesium.Math.toRadians(0),
      // pitch: Cesium.Math.toRadians(-90), // 俯视
      // roll: 0
    },
    duration: 1.5
  })
}
