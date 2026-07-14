import * as Cesium from 'cesium';
import {
  BOX_SELECTION_STYLE,
  TEMP_POINT_LABEL_STYLE,
  TEMP_TOTAL_LENGTH_LABEL_STYLE
} from '@/views/aviation-situation/constants/cesium-style-constants'
import { ShallowRef } from 'cesium'
import {EntityProperties} from "@/views/aviation-situation/types/entity"

import type {DrawingToolEntitiesResult} from "@/views/aviation-situation/types/shared"

/**
 * 克隆 Cesium Entity 的 Label/Point 样式（通用工具函数）
 * @param sourceEntity 源实体
 * @param newEntityId 新实体ID
 * @returns 克隆后的实体配置对象
 */
export const cloneEntityAsConfig = (
  sourceEntity: Cesium.Entity,
  newEntityId: string,
  viewer:ShallowRef<Cesium.Viewer>
): Cesium.Entity.ConstructorOptions => {

  // ✅ 修复：使用具体的 Cesium 类型代替 any
  const cloneConfig: Cesium.Entity.ConstructorOptions = {
    id: newEntityId,
    show:sourceEntity.show,
    // show: false,
    // position: sourceEntity.position,
  };
  if (sourceEntity.properties) {
    const props: EntityProperties = sourceEntity.properties.getValue()
    props.dataSourceName=newEntityId
    cloneConfig.properties=props
  }

  // /*
  if (Cesium.defined(sourceEntity.position)) {
    // 获取当前时刻的位置值（Cartesian3）
    const currentTime:Cesium.JulianDate = viewer.value.clock.currentTime; // 需要传入 viewer 或 clock
    const posValue:Cesium.Cartesian3 | undefined = sourceEntity.position.getValue(currentTime);

    if (Cesium.defined(posValue)) {
      cloneConfig.position = posValue; // Cesium 会自动包装为 ConstantProperty
    }
  }
  // */

  // 克隆 Label 样式（如果有）
  // 注意：sourceEntity.label 是一个 LabelGraphics 对象，我们需要提取其属性
  if (sourceEntity.label) {
    const srcLabel:Cesium.LabelGraphics = sourceEntity.label;
    cloneConfig.label = {
      fillColor: srcLabel.fillColor,
      text: srcLabel.text,
      font: srcLabel.font,
      outlineColor: srcLabel.outlineColor,
      outlineWidth: srcLabel.outlineWidth,
      style: srcLabel.style,
      pixelOffset: srcLabel.pixelOffset,
      heightReference: srcLabel.heightReference,
      disableDepthTestDistance: srcLabel.disableDepthTestDistance,
    };
  }

  // 克隆 Point 样式（如果有）
  if (sourceEntity.point) {
    const srcPoint:Cesium.PointGraphics = sourceEntity.point;
    cloneConfig.point = {
      pixelSize: srcPoint.pixelSize,
      color: srcPoint.color,
      outlineColor: srcPoint.outlineColor,
      outlineWidth: srcPoint.outlineWidth,
      heightReference: srcPoint.heightReference,
    };
  }
  if (sourceEntity.ellipse) {
    const srcEllipse:Cesium.EllipseGraphics = sourceEntity.ellipse;
    cloneConfig.ellipse = {
      semiMinorAxis: srcEllipse.semiMinorAxis,
      semiMajorAxis: srcEllipse.semiMajorAxis,
      material: srcEllipse.material,
      outline: srcEllipse.outline,
      outlineWidth: srcEllipse.outlineWidth,
      outlineColor: srcEllipse.outlineColor,
      height: srcEllipse.height,
      heightReference: srcEllipse.heightReference,
    };
  }
  if (sourceEntity.ellipsoid) {
    const srcEllipsoid:Cesium.EllipsoidGraphics = sourceEntity.ellipsoid;
    cloneConfig.ellipsoid = {
      material: srcEllipsoid.material,
      outline: srcEllipsoid.outline,
      outlineWidth: srcEllipsoid.outlineWidth,
      outlineColor: srcEllipsoid.outlineColor,
      minimumCone: srcEllipsoid.minimumCone,
      maximumCone: srcEllipsoid.maximumCone,
      heightReference: srcEllipsoid.heightReference,
    };
  }

  return cloneConfig;
};

export const showEntities=(entities:Cesium.Entity[])=>{
  for (const entity of entities){
    const props: EntityProperties = entity.properties.getValue()
    if (props.sourceType === 'circleSpatialSelection'||props.sourceType === 'hemisphereSpatialSelection') {
      entity.label.show=true
      entity.point.show=true
    }else{
      entity.show = true;
    }
  }
}

export const hideEntities=(entities:Cesium.Entity[])=>{
  for (const entity of entities){
    const props: EntityProperties = entity.properties.getValue()
    if (props.sourceType === 'circleSpatialSelection'||props.sourceType === 'hemisphereSpatialSelection') {
      entity.label.show=false
      entity.point.show=false
    }else{
      entity.show = false;
    }
  }
}

export const showMeasurementEntities=(entities:Cesium.Entity[])=>{
  for (const entity of entities){
    if(entity.label){
      const props: EntityProperties = entity.properties.getValue()
      entity.label.fillColor = props.label.originalFillColor;
    }
    if(entity.point){
      entity.point.show=true
    }
  }
}

export const hideMeasurementEntities=(entities:Cesium.Entity[])=>{
  for (const entity of entities){
    if(entity.label){
      entity.label.fillColor = Cesium.Color.TRANSPARENT;
    }
    if(entity.point){
      entity.point.show=false
    }
  }
}

/**
 * 创建线段长度Label的样式配置（仅Label，无Point）
 * @param text Label文本（静态文本/CallbackProperty）
 * @param position 实体位置（静态坐标/CallbackProperty）
 * @returns Label样式配置
 */
export const createEntityLabelConfig = (
  text: string | Cesium.CallbackProperty | null = null,
  position: Cesium.Cartesian3 | Cesium.CallbackProperty | null = null,
  type:string
):Cesium.Entity.ConstructorOptions => {
  const baseConfig: Cesium.Entity.ConstructorOptions = {
    label: {
      // 复用临时点Label的基础样式（保持视觉统一）
      fillColor: TEMP_POINT_LABEL_STYLE.LABEL.FILL_COLOR,
      font: TEMP_POINT_LABEL_STYLE.LABEL.FONT,
      outlineColor: TEMP_POINT_LABEL_STYLE.LABEL.OUTLINE_COLOR,
      outlineWidth: TEMP_POINT_LABEL_STYLE.LABEL.OUTLINE_WIDTH,
      style: TEMP_POINT_LABEL_STYLE.LABEL.STYLE,
      pixelOffset: TEMP_POINT_LABEL_STYLE.LABEL.PIXEL_OFFSET,
      heightReference: TEMP_POINT_LABEL_STYLE.LABEL.HEIGHT_REFERENCE,
      disableDepthTestDistance: Number.POSITIVE_INFINITY, // 防遮挡（常量漏配时兜底）
    },
  };

  if (type === 'totalDistance') {
    baseConfig.label.pixelOffset=TEMP_TOTAL_LENGTH_LABEL_STYLE.LABEL.PIXEL_OFFSET
  }
  // 动态/静态文本、位置单独赋值
  if (text)baseConfig.label!.text = text;
  // baseConfig.label!.fillColor = Cesium.Color.RED;
  if (position) baseConfig.position = position;

  return baseConfig;
};

/**
 * 创建临时点的 Label/Point 样式配置（复用常量，仅传可变量）
 * @param text Label文本（可选，动态文本用CallbackProperty时传null）
 * @param position 实体位置（可选，动态位置用CallbackProperty时传null）
 * @returns Label/Point 样式配置
 */
export const createTempPointLabelStyleConfig = (
  text: string | Cesium.CallbackProperty | null = null,
  position: Cesium.Cartesian3 | Cesium.CallbackProperty | null = null
):Cesium.Entity.ConstructorOptions => {
  const baseConfig: Cesium.Entity.ConstructorOptions= {
    label: {
      font: TEMP_POINT_LABEL_STYLE.LABEL.FONT,
      outlineColor: TEMP_POINT_LABEL_STYLE.LABEL.OUTLINE_COLOR,
      outlineWidth: TEMP_POINT_LABEL_STYLE.LABEL.OUTLINE_WIDTH,
      style: TEMP_POINT_LABEL_STYLE.LABEL.STYLE,
      pixelOffset: TEMP_POINT_LABEL_STYLE.LABEL.PIXEL_OFFSET,
      heightReference: TEMP_POINT_LABEL_STYLE.LABEL.HEIGHT_REFERENCE,
      disableDepthTestDistance: Number.POSITIVE_INFINITY, // 补充防遮挡配置（常量里漏了的话）
    },
    point: {
      pixelSize: TEMP_POINT_LABEL_STYLE.POINT.PIXEL_SIZE,
      color: TEMP_POINT_LABEL_STYLE.POINT.COLOR,
      outlineColor: TEMP_POINT_LABEL_STYLE.POINT.OUTLINE_COLOR,
      outlineWidth: TEMP_POINT_LABEL_STYLE.POINT.OUTLINE_WIDTH,
      heightReference: TEMP_POINT_LABEL_STYLE.POINT.HEIGHT_REFERENCE,
    },
  };

  // 动态文本/位置单独处理
  if (text) baseConfig.label!.text = text;
  if (position) baseConfig.position = position;

  return baseConfig;
};

/**
 * 显示距离测量相关的实体（测量点和分段长度标签）
 * @param viewer Cesium Viewer 实例
 * @param properties 实体属性
 * @returns 显示的实体数组
 */
export const getDrawingToolEntitiesAndHighlightEntity = (
  viewer: ShallowRef<Cesium.Viewer | null>,
  properties: EntityProperties,
  startIndex:number=1,
): DrawingToolEntitiesResult |undefined => {
  // 重置显示的实体数组
  const measurementEntities:Cesium.Entity[]=[]

  if (!viewer.value) return

  const dataSourceName: string = properties.dataSourceName
  const dataSources: Cesium.CustomDataSource[] = viewer.value.dataSources.getByName(dataSourceName)
  if (dataSources.length === 0) {
    return
  }

  const dataSource: Cesium.CustomDataSource = dataSources[0]
  const values: Cesium.Entity[] = dataSource.entities.values
  // 从第i+1个实体开始遍历（索引i），显示测量相关元素
  for (let i: number = startIndex; i < values.length; i++) {
    // 存储显示的实体（调整索引从0开始）
    measurementEntities[i - startIndex] = values[i]

    // const entityProperties: EntityProperties = values[i].properties.getValue()
    // 根据实体类型显示对应的组件
    // if (entityProperties.type === 'surveyPoint') {
    //   values[i].label.show = true
    //   values[i].point.show = true
    // } else if (entityProperties.type === 'segmentLengthLabel') {
    //   values[i].label.show = true
    // }
  }

  return {measurementEntities,highlightEntity:values[0]}
}
