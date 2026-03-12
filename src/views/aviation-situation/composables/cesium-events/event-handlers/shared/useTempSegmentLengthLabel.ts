// src/views/aviation-situation/composables/cesium-events/event-handlers/shared/useTempSegmentLengthLabel.ts
import * as Cesium from 'cesium'
import { ShallowRef } from 'vue'
import { generateBizUniqueId } from '@/utils/uuid'
import { formatDistance } from '@/utils/geoUtils.ts'
import { createEntityLabelConfig } from '@/utils/cesiumUtils'
import type {LngLatAlt} from "@/views/aviation-situation/types/shared"
import type {DistanceSurveySession} from "../useDistanceSurvey"
import { EntityProperties } from '@/views/aviation-situation/types/entity'

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
    const labelConfig:Cesium.Entity.ConstructorOptions = createEntityLabelConfig(textCallback, positionCallback);

    // 4. 组装实体并添加
    tempSegmentLengthLabel.entity = viewer.value.entities.add({
      id: 'tempSegmentLengthLabel',
      show: false,
      ...labelConfig, // 复用通用样式，消除重复代码
    });
  };

  // 添加临时坐标标签到自定义数据源
  const addTempSegmentLengthLabelToDataSource = (
    activeDistanceSurvey:DistanceSurveySession,
    properties:EntityProperties,
  ):LngLatAlt => {
    if (!activeDistanceSurvey.dataSource || !tempSegmentLengthLabel.position.cartesian3) return;
    const { lngLatAlt }: {
      lngLatAlt: LngLatAlt
    } = tempSegmentLengthLabel.position;
    const uniqueId:string = generateBizUniqueId('tempSegmentLengthLabel');

    // 1. 生成静态文本
    const staticText:string = `长度：${tempSegmentLengthLabel.lengthInfo.formattedDistanceStr}`;

    // 2. 调用通用函数生成样式配置
    const styleConfig:Cesium.Entity.ConstructorOptions = createEntityLabelConfig(
      staticText,
      tempSegmentLengthLabel.position.cartesian3
    );

    if (properties) {
      styleConfig.properties=properties
      styleConfig.properties.label={
        originalFillColor:styleConfig.label?.fillColor
      }
    }

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
  const updateTempSegmentLengthLabel = (lngLatAlt,distance):void => {
    if (!lngLatAlt) return;
    const cartesian3:Cesium.Cartesian3=Cesium.Cartesian3.fromDegrees(lngLatAlt.longitude, lngLatAlt.latitude, lngLatAlt.height);

    tempSegmentLengthLabel.position.cartesian3 = cartesian3;
    // 转换坐标
    tempSegmentLengthLabel.position.lngLatAlt = lngLatAlt;
    tempSegmentLengthLabel.lengthInfo.distance = distance;
    tempSegmentLengthLabel.lengthInfo.formattedDistanceStr = formatDistance(distance);

    // 显示标签
    if (tempSegmentLengthLabel.entity && !tempSegmentLengthLabel.entity.show) {
      tempSegmentLengthLabel.entity.show = true;
    }
  };

  const setTempSegmentLengthLabelVisibility=(visibility:boolean)=>{
    if(!tempSegmentLengthLabel.entity){
      return
    }
    tempSegmentLengthLabel.entity.show=visibility
  }

  return {
    tempSegmentLengthLabel,
    addTempSegmentLengthLabelToViewer,
    addTempSegmentLengthLabelToDataSource,
    removeTempSegmentLengthLabel,
    updateTempSegmentLengthLabel,
    setTempSegmentLengthLabelVisibility,
  };
};
