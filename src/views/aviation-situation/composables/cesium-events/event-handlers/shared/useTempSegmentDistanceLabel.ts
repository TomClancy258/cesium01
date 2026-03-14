// src/views/aviation-situation/composables/cesium-events/event-handlers/shared/useTempSegmentDistanceLabel.ts
import * as Cesium from 'cesium'
import { ShallowRef } from 'vue'
import { generateBizUniqueId } from '@/utils/uuid'
import { formatDistance } from '@/utils/geoUtils.ts'
import { createEntityLabelConfig } from '@/utils/cesiumUtils'
import type {LngLatAlt} from "@/views/aviation-situation/types/shared"
import type {DistanceSurveySession} from "../useDistanceMeasurement"
import { EntityProperties } from '@/views/aviation-situation/types/entity'

export interface SegmentDistanceInfo  {
  distance: number,
  formattedDistanceStr: string
}

export interface TempSegmentLabelPosition  {
  cartesian3: Cesium.Cartesian3 | null | undefined
  lngLatAlt: LngLatAlt
}

export interface TempSegmentDistanceLabel  {
  entity: Cesium.Entity | null
  position: TempSegmentLabelPosition
  distanceInfo:SegmentDistanceInfo
}

export const useTempSegmentDistanceLabel = (viewer: ShallowRef<Cesium.Viewer | null>) => {
  // 初始化临时坐标标签
  const tempSegmentDistanceLabel: TempSegmentDistanceLabel  = {
    entity: null,
    position: {
      cartesian3: null,
      lngLatAlt: { longitude: 0, latitude: 0, height: 0 },
    },
    distanceInfo:{
      distance:0,
      formattedDistanceStr:'',
    }
  };

  // 添加临时坐标标签到 viewer
  const addTempSegmentDistanceLabelToViewer = ():void => {
    if (!viewer.value) return;
// 1. 创建动态文本的CallbackProperty
    const textCallback:Cesium.CallbackProperty = new Cesium.CallbackProperty((): string => {
      return `长度：${tempSegmentDistanceLabel.distanceInfo.formattedDistanceStr}`;
    }, false);

    // 2. 创建动态位置的CallbackProperty
    const positionCallback:Cesium.CallbackProperty = new Cesium.CallbackProperty((): Cesium.Cartesian3 => {
      return tempSegmentDistanceLabel.position.cartesian3 as Cesium.Cartesian3;
    }, false);

    // 3. 调用通用函数生成Label配置（无Point，仅Label）
    const labelConfig:Cesium.Entity.ConstructorOptions = createEntityLabelConfig(textCallback, positionCallback);

    // 4. 组装实体并添加
    tempSegmentDistanceLabel.entity = viewer.value.entities.add({
      id: 'tempSegmentDistanceLabel',
      show: false,
      ...labelConfig, // 复用通用样式，消除重复代码
    });
  };

  // 添加临时坐标标签到自定义数据源
  const addTempSegmentDistanceLabelToDataSource = (
    activeDistanceSurvey:DistanceSurveySession,
    properties:EntityProperties,
  ):LngLatAlt => {
    if (!activeDistanceSurvey.dataSource || !tempSegmentDistanceLabel.position.cartesian3) return;
    const { lngLatAlt }: {
      lngLatAlt: LngLatAlt
    } = tempSegmentDistanceLabel.position;
    const uniqueId:string = generateBizUniqueId('tempSegmentDistanceLabel');

    // 1. 生成静态文本
    const staticText:string = `长度：${tempSegmentDistanceLabel.distanceInfo.formattedDistanceStr}`;

    // 2. 调用通用函数生成样式配置
    const styleConfig:Cesium.Entity.ConstructorOptions = createEntityLabelConfig(
      staticText,
      tempSegmentDistanceLabel.position.cartesian3
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

    // const cloneEntity=Cesium.clone(tempSegmentDistanceLabel.entity,true)
    // const entity=activeDistanceSurvey.dataSource.entities.add(cloneEntity)

    activeDistanceSurvey.segmentDistanceLabels.push(entity)
    return lngLatAlt;
  };

  // 清除临时坐标标签
  const removeTempSegmentDistanceLabel = ():void => {
    viewer.value?.entities.removeById('tempSegmentDistanceLabel');
    tempSegmentDistanceLabel.entity = null;
  };

  // 更新临时坐标标签的位置和数据
  const updateTempSegmentDistanceLabel = (lngLatAlt,distance):void => {
    if (!lngLatAlt) return;
    const cartesian3:Cesium.Cartesian3=Cesium.Cartesian3.fromDegrees(lngLatAlt.longitude, lngLatAlt.latitude, lngLatAlt.height);

    tempSegmentDistanceLabel.position.cartesian3 = cartesian3;
    // 转换坐标
    tempSegmentDistanceLabel.position.lngLatAlt = lngLatAlt;
    tempSegmentDistanceLabel.distanceInfo.distance = distance;
    tempSegmentDistanceLabel.distanceInfo.formattedDistanceStr = formatDistance(distance);

    // 显示标签
    if (tempSegmentDistanceLabel.entity && !tempSegmentDistanceLabel.entity.show) {
      tempSegmentDistanceLabel.entity.show = true;
    }
  };

  const setTempSegmentDistanceLabelVisibility=(visibility:boolean)=>{
    if(!tempSegmentDistanceLabel.entity){
      return
    }
    tempSegmentDistanceLabel.entity.show=visibility
  }

  return {
    tempSegmentDistanceLabel,
    addTempSegmentDistanceLabelToViewer,
    addTempSegmentDistanceLabelToDataSource,
    removeTempSegmentDistanceLabel,
    updateTempSegmentDistanceLabel,
    setTempSegmentDistanceLabelVisibility,
  };
};
