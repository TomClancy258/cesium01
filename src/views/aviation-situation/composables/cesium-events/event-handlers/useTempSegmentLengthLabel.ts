// useTempSegmentLengthLabel.ts
import * as Cesium from 'cesium'
import { ShallowRef } from 'vue'
import { generateBizUniqueId } from '@/utils/uuid'
import { formatDistance } from '@/utils/geoUtils.ts'
import type {LngLatAlt} from "@/views/aviation-situation/types/shared"
import { TEMP_POINT_LABEL_STYLE } from '@/views/aviation-situation/constants/cesiumStyleConstants'
import type {DistanceSurveySession} from "./useDistanceSurvey"

export interface SegmentLengthInfo  {
  distance: number,
  formattedDistanceStr: string
}

export interface TempSegmentLabelPosition  {
  cartesian3: Cesium.Cartesian3 | null | undefined
  lngLatAlt: LngLatAlt
}

export interface TempSegmentLengthLabel  {
  entity: Cesium.Entity | null
  position: TempSegmentLabelPosition
  lengthInfo:SegmentLengthInfo
}

// ========== 新增：线段长度Label通用配置函数 ==========
/**
 * 创建线段长度Label的样式配置（仅Label，无Point）
 * @param text Label文本（静态文本/CallbackProperty）
 * @param position 实体位置（静态坐标/CallbackProperty）
 * @returns Label样式配置
 */
const createSegmentLengthLabelConfig = (
  text: string | Cesium.CallbackProperty | null = null,
  position: Cesium.Cartesian3 | Cesium.CallbackProperty | null = null
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

  // 动态/静态文本、位置单独赋值
  if (text) baseConfig.label!.text = text;
  if (position) baseConfig.position = position;

  return baseConfig;
};

export const useTempSegmentLengthLabel = (viewer: ShallowRef<Cesium.Viewer | null>) => {
  // 初始化临时坐标标签
  const tempSegmentLengthLabel: TempSegmentLengthLabel  = {
    entity: null,
    position: {
      cartesian3: null,
      lngLatAlt: { longitude: 0, latitude: 0, height: 0 },
    },
    lengthInfo:{
      distance:0,
      formattedDistanceStr:'',
    }
  };

  // 添加临时坐标标签到 viewer
  const addTempSegmentLengthLabelToViewer = ():void => {
    if (!viewer.value) return;
// 1. 创建动态文本的CallbackProperty
    const textCallback:Cesium.CallbackProperty = new Cesium.CallbackProperty((): string => {
      return `长度：${tempSegmentLengthLabel.lengthInfo.formattedDistanceStr}`;
    }, false);

    // 2. 创建动态位置的CallbackProperty
    const positionCallback:Cesium.CallbackProperty = new Cesium.CallbackProperty((): Cesium.Cartesian3 => {
      return tempSegmentLengthLabel.position.cartesian3 as Cesium.Cartesian3;
    }, false);

    // 3. 调用通用函数生成Label配置（无Point，仅Label）
    const labelConfig:Cesium.Entity.ConstructorOptions = createSegmentLengthLabelConfig(textCallback, positionCallback);

    // 4. 组装实体并添加
    tempSegmentLengthLabel.entity = viewer.value.entities.add({
      id: 'tempSegmentLengthLabel',
      show: false,
      ...labelConfig, // 复用通用样式，消除重复代码
    });
  };

  // 添加临时坐标标签到自定义数据源
  const addTempSegmentLengthLabelToDataSource = (
    activeDistanceSurvey:DistanceSurveySession
  ):LngLatAlt => {
    if (!activeDistanceSurvey.dataSource || !tempSegmentLengthLabel.position.cartesian3) return;
    const { lngLatAlt }: {
      lngLatAlt: LngLatAlt
    } = tempSegmentLengthLabel.position;
    const uniqueId:string = generateBizUniqueId('tempSegmentLengthLabel');

    // 1. 生成静态文本
    const staticText:string = `长度：${tempSegmentLengthLabel.lengthInfo.formattedDistanceStr}`;

    // 2. 调用通用函数生成样式配置
    const styleConfig:Cesium.Entity.ConstructorOptions = createSegmentLengthLabelConfig(
      staticText,
      tempSegmentLengthLabel.position.cartesian3
    );

    // 3. 组装实体配置并添加
    const entity: Cesium.Entity = activeDistanceSurvey.dataSource.entities.add({
      id: uniqueId,
      show: true,
      ...styleConfig, // 复用通用样式
    });

    // const cloneEntity=Cesium.clone(tempSegmentLengthLabel.entity,true)
    // const entity=activeDistanceSurvey.dataSource.entities.add(cloneEntity)

    activeDistanceSurvey.segmentLengthLabels.push(entity)
    return lngLatAlt;
  };

  // 清除临时坐标标签
  const removeTempSegmentLengthLabel = ():void => {
    viewer.value?.entities.removeById('tempSegmentLengthLabel');
    tempSegmentLengthLabel.entity = null;
  };

  // 更新临时坐标标签的位置和数据
  const updateTempSegmentLengthLabel = (position,distance):void => {
    if (!position) return;
    const cartesian3:Cesium.Cartesian3=Cesium.Cartesian3.fromDegrees(position.longitude, position.latitude, position.height);

    tempSegmentLengthLabel.position.cartesian3 = cartesian3;
    // 转换坐标
    tempSegmentLengthLabel.position.lngLatAlt = position;
    tempSegmentLengthLabel.lengthInfo.distance = distance;
    tempSegmentLengthLabel.lengthInfo.formattedDistanceStr = formatDistance(distance);

    // 显示标签
    if (tempSegmentLengthLabel.entity && !tempSegmentLengthLabel.entity.show) {
      tempSegmentLengthLabel.entity.show = true;
    }
  };

  return {
    tempSegmentLengthLabel,
    addTempSegmentLengthLabelToViewer,
    addTempSegmentLengthLabelToDataSource,
    removeTempSegmentLengthLabel,
    updateTempSegmentLengthLabel,
  };
};
