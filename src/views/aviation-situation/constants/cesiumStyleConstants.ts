// src/views/aviation-situation/constants/cesiumStyleConstants.ts
import * as Cesium from 'cesium'

/**
 * Label 基础样式类型
 */
export type CesiumLabelStyle = {
  FONT: string;
  OUTLINE_COLOR: Cesium.Color;
  OUTLINE_WIDTH: number;
  STYLE: Cesium.LabelStyle;
  PIXEL_OFFSET: Cesium.Cartesian2;
  HEIGHT_REFERENCE: Cesium.HeightReference;
  DISABLE_DEPTH_TEST_DISTANCE: number;
};

/**
 * Point 基础样式类型
 */
export type CesiumPointStyle = {
  PIXEL_SIZE: number;
  COLOR: Cesium.Color;
  OUTLINE_COLOR: Cesium.Color;
  OUTLINE_WIDTH: number;
  HEIGHT_REFERENCE: Cesium.HeightReference;
};

/**
 * 临时点标签样式类型
 */
export type TempPointLabelStyle = {
  LABEL: CesiumLabelStyle;
  POINT: CesiumPointStyle;
};

/**
 * Polyline 基础样式类型（新增：折线样式类型）
 */
export type CesiumPolylineStyle = {
  WIDTH: number;
  MATERIAL: Cesium.Color;
  CLAMP_TO_GROUND: boolean;
  ARC_TYPE: Cesium.ArcType;
};

/**
 * 距离测绘折线样式类型（新增：专属折线样式）
 */
export type DistanceSurveyPolylineStyle = {
  POLYLINE: CesiumPolylineStyle;
};

/**
 * 临时点标签样式常量
 */
export const TEMP_POINT_LABEL_STYLE: TempPointLabelStyle = {
  LABEL: {
    FONT: '14px Verdana',
    OUTLINE_COLOR: Cesium.Color.DARKSLATEGREY,
    OUTLINE_WIDTH: 2,
    STYLE: Cesium.LabelStyle.FILL_AND_OUTLINE,
    PIXEL_OFFSET: new Cesium.Cartesian2(0, -45),
    HEIGHT_REFERENCE: Cesium.HeightReference.CLAMP_TO_GROUND,
    DISABLE_DEPTH_TEST_DISTANCE: Number.POSITIVE_INFINITY
  },
  POINT: {
    PIXEL_SIZE: 10,
    COLOR: Cesium.Color.fromBytes(243, 242, 99),
    OUTLINE_COLOR: Cesium.Color.fromBytes(219, 218, 111),
    OUTLINE_WIDTH: 2,
    HEIGHT_REFERENCE: Cesium.HeightReference.CLAMP_TO_GROUND
  }
} as const;

/**
 * 距离测绘折线样式常量（新增：核心折线样式）
 */
export const DISTANCE_SURVEY_POLYLINE_STYLE: DistanceSurveyPolylineStyle = {
  POLYLINE: {
    WIDTH: 3, // 折线宽度
    MATERIAL: Cesium.Color.fromCssColorString('#38BDF8'), // 折线颜色
    CLAMP_TO_GROUND: true, // 贴地
    ARC_TYPE: Cesium.ArcType.GEODESIC // 大地线（贴合地球曲率）
  }
} as const;


// 扩展示例：其他样式常量（复用子类型）
export const HIGHLIGHT_POINT_LABEL_STYLE: TempPointLabelStyle = {
  LABEL: {
    ...TEMP_POINT_LABEL_STYLE.LABEL,
    FONT: '16px Verdana', // 放大字体
    OUTLINE_COLOR: Cesium.Color.RED // 红色描边
  },
  POINT: {
    ...TEMP_POINT_LABEL_STYLE.POINT,
    PIXEL_SIZE: 12, // 放大点尺寸
    COLOR: Cesium.Color.RED // 红色点
  }
} as const;
