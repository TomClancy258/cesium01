import * as Cesium from 'cesium'

// ===================== 通用基础类型（抽离复用） =====================
/**
 * Label 基础样式类型
 */
export type CesiumLabelStyle = {
  FILL_COLOR: string,
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
 * Polyline 基础样式类型
 */
export type CesiumPolylineStyle = {
  WIDTH: number;
  MATERIAL: Cesium.Color;
  CLAMP_TO_GROUND: boolean;
  ARC_TYPE: Cesium.ArcType;
};

/**
 * Polygon 基础样式类型（新增：框选多边形专属）
 */
export type CesiumPolygonStyle = {
  OUTLINE_WIDTH: number;
  OUTLINE_COLOR: Cesium.Color;
  OUTLINE:boolean,
  HEIGHT:number,
  MATERIAL: Cesium.Color;
  CLAMP_TO_GROUND: boolean;
  ARC_TYPE: Cesium.ArcType;
};

/**
 * Ellipse（圆形）基础样式类型（新增：框选圆形专属）
 */
export type CesiumEllipseStyle = {
  OUTLINE_WIDTH: number;
  OUTLINE_COLOR: Cesium.Color;
  MATERIAL: Cesium.Color;
  HEIGHT_REFERENCE: Cesium.HeightReference;
  OUTLINE:boolean,
  HEIGHT:number
};

export type CesiumEllipsoidStyle = {
  OUTLINE_WIDTH: number;
  OUTLINE_COLOR: Cesium.Color;
  MATERIAL: Cesium.Color;
  HEIGHT_REFERENCE: Cesium.HeightReference;
  OUTLINE:boolean,

  RADII: Cesium.Cartesian3,
  MINIMUM_CONE:number,
  MAXIMUM_CONE: number,
};

/**
 * Rectangle（矩形）基础样式类型（新增：框选矩形专属）
 */
export type CesiumRectangleStyle = {
  OUTLINE_WIDTH: number;
  OUTLINE_COLOR: Cesium.Color;
  MATERIAL: Cesium.Color;
  CLAMP_TO_GROUND: boolean;
  ARC_TYPE: Cesium.ArcType;
};

// ===================== 业务组合类型（按场景划分） =====================
/**
 * 临时点标签样式类型
 */
export type TempPointLabelStyle = {
  LABEL: CesiumLabelStyle;
  POINT: CesiumPointStyle;
};

/**
 * 距离测绘折线样式类型（单一业务场景）
 */
export type DistanceSurveyPolylineStyle = {
  POLYLINE: CesiumPolylineStyle;
};

/**
 * 框选样式类型（包含多图形类型的组合）
 */
export type SpatialSelectionStyle = {
  POLYGON: CesiumPolygonStyle;    // 多边形框选
  RECTANGLE: CesiumRectangleStyle;// 矩形框选
  ELLIPSE: CesiumEllipseStyle;    // 圆形框选
  ELLIPSOID: CesiumEllipsoidStyle;    // 圆形框选
};

/**
 * 总长度标签样式类型（精简复用）
 */
export type TempTotalLengthLabelStyle = {
  LABEL: Pick<CesiumLabelStyle, 'PIXEL_OFFSET'>;
};

// ===================== 样式常量（独立维护，语义清晰） =====================
/**
 * 临时点标签样式常量
 */
export const TEMP_POINT_LABEL_STYLE: TempPointLabelStyle = {
  LABEL: {
    FILL_COLOR:Cesium.Color.WHITE,
    FONT: '14px Verdana',
    OUTLINE_COLOR: Cesium.Color.DARKSLATEGREY,
    OUTLINE_WIDTH: 2,
    STYLE: Cesium.LabelStyle.FILL_AND_OUTLINE,
    PIXEL_OFFSET: new Cesium.Cartesian2(0, -45),
    HEIGHT_REFERENCE: Cesium.HeightReference.NONE,
    DISABLE_DEPTH_TEST_DISTANCE: Number.POSITIVE_INFINITY
  },
  POINT: {
    PIXEL_SIZE: 10,
    COLOR: Cesium.Color.fromBytes(243, 242, 99),
    OUTLINE_COLOR: Cesium.Color.fromBytes(219, 218, 111),
    OUTLINE_WIDTH: 2,
    HEIGHT_REFERENCE: Cesium.HeightReference.NONE
  }
} as const;

/**
 * 距离测绘折线样式常量（独立维护）
 */
export const DISTANCE_SURVEY_POLYLINE_STYLE: DistanceSurveyPolylineStyle = {
  POLYLINE: {
    WIDTH: 3,
    MATERIAL: Cesium.Color.fromCssColorString('#38BDF8'),
    CLAMP_TO_GROUND: true,
    ARC_TYPE: Cesium.ArcType.GEODESIC
  }
} as const;

/**
 * 框选样式常量（独立维护，包含多图形）
 */
export const BOX_SELECTION_STYLE: SpatialSelectionStyle = {
  // 多边形框选样式（实时绘制态）
  POLYGON: {
    OUTLINE_WIDTH: 2,
    OUTLINE_COLOR: Cesium.Color.BLUE,
    HEIGHT:0,
    OUTLINE: true,
    MATERIAL: Cesium.Color.SKYBLUE.withAlpha(0.25),
    CLAMP_TO_GROUND: true,
    ARC_TYPE: Cesium.ArcType.GEODESIC,
  },
  // 矩形框选样式
  RECTANGLE: {
    OUTLINE_WIDTH: 2,
    OUTLINE_COLOR: Cesium.Color.BLUE,
    MATERIAL: Cesium.Color.SKYBLUE.withAlpha(0.25),
    CLAMP_TO_GROUND: true,
    ARC_TYPE: Cesium.ArcType.GEODESIC
  },
  // 圆形框选样式
  ELLIPSE: {
    OUTLINE_WIDTH: 2,
    OUTLINE_COLOR: Cesium.Color.BLUE,
    MATERIAL: Cesium.Color.SKYBLUE.withAlpha(0.25),
    HEIGHT:0,
    HEIGHT_REFERENCE: Cesium.HeightReference.NONE,
    OUTLINE: true,
  },
  // 球体框选样式
  ELLIPSOID: {
    OUTLINE: true,
    OUTLINE_WIDTH: 1,
    // OUTLINE_COLOR: Cesium.Color.BLUE,
    OUTLINE_COLOR: Cesium.Color.BLUE.withAlpha(.5),
    MATERIAL: Cesium.Color.SKYBLUE.withAlpha(0.25),
    HEIGHT_REFERENCE: Cesium.HeightReference.NONE,
    // HEIGHT_REFERENCE: Cesium.HeightReference.CLAMP_TO_TERRAIN,
    MINIMUM_CONE: Cesium.Math.toRadians(0),
    MAXIMUM_CONE: Cesium.Math.toRadians(90),

  }
} as const;

/**
 * 高亮点标签样式常量（复用基础样式）
 */
export const HIGHLIGHT_POINT_LABEL_STYLE: TempPointLabelStyle = {
  LABEL: {
    ...TEMP_POINT_LABEL_STYLE.LABEL,
    FONT: '16px Verdana',
    OUTLINE_COLOR: Cesium.Color.RED
  },
  POINT: {
    ...TEMP_POINT_LABEL_STYLE.POINT,
    PIXEL_SIZE: 12,
    COLOR: Cesium.Color.RED
  }
} as const;

/**
 * 临时总长度标签样式常量
 */
export const TEMP_TOTAL_LENGTH_LABEL_STYLE: TempTotalLengthLabelStyle = {
  LABEL: {
    PIXEL_OFFSET: new Cesium.Cartesian2(0, -60),
  }
} as const;
