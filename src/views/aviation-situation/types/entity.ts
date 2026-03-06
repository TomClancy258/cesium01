import * as Cesium from 'cesium'

// 定义Entity支持的子组件类型及对应高亮属性
export type EntityComponent =
  | { type: 'polyline', prop: 'material', value: Cesium.Material | Cesium.Color }
  | { type: 'label', prop: 'fillColor', value: Cesium.Color }
  | { type: 'point', prop: 'color', value: Cesium.Color }
  | { type: 'polygon', prop: 'material', value: Cesium.Material | Cesium.Color }; // 预留扩展

// Entity属性类型（按组件分类保存原始值）
export interface EntityProperties {
  sourceType: string; // distanceSurvey/xxx
  type: string; // polyline/polygon/label/point （Entity整体类型）
  dataSourceName?: string;
  originalShow?: boolean; // 整体显隐状态
  // 按组件类型存储原始属性（键名规则：original + 组件类型 + 属性名）
  originalPolylineMaterial?: Cesium.Material | Cesium.Color;
  originalLabelFillColor?: Cesium.Color;
  originalPointColor?: Cesium.Color;
  originalPolygonMaterial?: Cesium.Material | Cesium.Color;
}

// 高亮配置类型（支持多组件同时高亮）
export type EntityHighlightConfig = {
  show?: boolean; // 整体显隐
  components?: EntityComponent[]; // 子组件高亮配置
};
