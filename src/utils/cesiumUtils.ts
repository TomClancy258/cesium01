import * as Cesium from 'cesium';
import { TEMP_POINT_LABEL_STYLE,TEMP_TOTAL_LENGTH_LABEL_STYLE } from '@/views/aviation-situation/constants/cesiumStyleConstants'
import * as turf from '@turf/turf'
import { getLngLatAltArrayPushFirstPoint } from '@/utils/geoUtils'
import { ShallowRef } from 'cesium'

/**
 * 克隆 Cesium Entity 的 Label/Point 样式（通用工具函数）
 * @param sourceEntity 源实体
 * @param newEntityId 新实体ID
 * @returns 克隆后的实体配置对象
 */
export const cloneEntityStyle = (
  sourceEntity: Cesium.Entity,
  newEntityId: string,
  // viewer:ShallowRef<Cesium.Viewer>
): Cesium.Entity.ConstructorOptions => {

  // ✅ 修复：使用具体的 Cesium 类型代替 any
  const cloneConfig: Cesium.Entity.ConstructorOptions = {
    id: newEntityId,
    show:sourceEntity.show,
    // show: false,
    position: sourceEntity.position,
  };

  /*
  if (Cesium.defined(sourceEntity.position)) {
    // 获取当前时刻的位置值（Cartesian3）
    const currentTime = viewer.clock.currentTime; // 需要传入 viewer 或 clock
    const posValue = sourceEntity.position.getValue(currentTime);

    if (Cesium.defined(posValue)) {
      cloneConfig.position = posValue; // Cesium 会自动包装为 ConstantProperty
    }
  }
  */

  // 克隆 Label 样式（如果有）
  // 注意：sourceEntity.label 是一个 LabelGraphics 对象，我们需要提取其属性
  if (sourceEntity.label) {
    const srcLabel:Cesium.LabelGraphics = sourceEntity.label;
    cloneConfig.label = {
      text: srcLabel.text,
      font: srcLabel.font,
      outlineColor: srcLabel.outlineColor,
      outlineWidth: srcLabel.outlineWidth,
      style: srcLabel.style,
      pixelOffset: srcLabel.pixelOffset,
      heightReference: srcLabel.heightReference,
      // ✅ 关键映射：从源对象读取值，赋值给小驼峰属性名
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

  return cloneConfig;
};

export const showEntities=(entities:Cesium.Entity[])=>{
  for (const entity of entities){
    entity.show = true;
  }
}

export const hideEntities=(entities:Cesium.Entity[])=>{
  for (const entity of entities){
    entity.show = false;
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
  if (text) {}baseConfig.label!.text = text;
  if (position) baseConfig.position = position;

  return baseConfig;
};

/**
 * 显示距离测量相关的实体（测量点和分段长度标签）
 * @param viewer Cesium Viewer 实例
 * @param properties 实体属性
 * @returns 显示的实体数组
 */
export const getShowEntitiesAndHighlightEntity = (
  viewer: ShallowRef<Cesium.Viewer | null>,
  properties: EntityProperties,
  startIndex:number=1,
): Cesium.Entity[] => {
  // 重置显示的实体数组
  const showEntities:Cesium.Entity[]=[]

  if (!viewer.value) return showEntities

  const dataSourceName: string = properties.dataSourceName
  const dataSources: Cesium.CustomDataSource[] = viewer.value.dataSources.getByName(dataSourceName)

  if (dataSources.length === 0) {
    return showEntities
  }

  const dataSource: Cesium.CustomDataSource = dataSources[0]
  const values: Cesium.Entity[] = dataSource.entities.values
  console.log("dataSource.entities.values", dataSource.entities.values);
  // 从第i+1个实体开始遍历（索引i），显示测量相关元素
  for (let i: number = startIndex; i < values.length; i++) {
    // 存储显示的实体（调整索引从0开始）
    showEntities[i - startIndex] = values[i]

    // const entityProperties = values[i].properties.getValue() as EntityProperties
    // 根据实体类型显示对应的组件
    // if (entityProperties.type === 'surveyPoint') {
    //   values[i].label.show = true
    //   values[i].point.show = true
    // } else if (entityProperties.type === 'segmentLengthLabel') {
    //   values[i].label.show = true
    // }
  }

  return {showEntities,highlightEntity:values[0]}
}
