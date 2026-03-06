import * as Cesium from 'cesium';

/**
 * 克隆 Cesium Entity 的 Label/Point 样式（通用工具函数）
 * @param sourceEntity 源实体
 * @param newEntityId 新实体ID
 * @returns 克隆后的实体配置对象
 */
export const cloneEntityStyle = (
  sourceEntity: Cesium.Entity,
  newEntityId: string
): Cesium.Entity.ConstructorOptions => {

  // ✅ 修复：使用具体的 Cesium 类型代替 any
  const cloneConfig: Cesium.Entity.ConstructorOptions = {
    id: newEntityId,
    show: false,
    position: sourceEntity.position,
  };

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

