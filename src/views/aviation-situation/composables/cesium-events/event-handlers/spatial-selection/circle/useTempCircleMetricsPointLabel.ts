// src/views/aviation-situation/composables/cesium-events/event-handlers/spatial-selection/circle/useTempCircleMetricsPointLabel.ts
import * as Cesium from 'cesium'
import { ShallowRef } from 'vue'
import { generateBizUniqueId } from '@/utils/uuid'
import {
  calculateAreaFromGraphic, calculatePerimeterFromGraphic,
  formatArea,
  formatDistance
} from '@/utils/geoUtils.ts'
import type {LngLatAlt} from "@/views/aviation-situation/types/shared"
import { createTempPointLabelStyleConfig } from '@/utils/cesiumUtils'
import { EntityProperties } from '@/views/aviation-situation/types/entity'

export interface PerimeterInfo {
  perimeter: number;
  formattedPerimeterStr: string;
}

export interface AreaInfo {
  area: number;
  formattedAreaStr: string;
}

export interface RadiusInfo {
  radius: number;
  formattedRadiusStr: string;
}

export interface CircleData {
  radius: number;
  center: LngLatAlt;
}


export interface TempPerimeterAndAreaLabelPosition {
  cartesian3: Cesium.Cartesian3 | null;
  lngLatAlt: LngLatAlt;
}

export interface TempPerimeterAndAreaLabel {
  entity: Cesium.Entity | null;
  position: TempPerimeterAndAreaLabelPosition;
  perimeterInfo: PerimeterInfo;
  areaInfo: AreaInfo;
  radiusInfo: RadiusInfo;
}

export const useTempCircleMetricsPointLabel = (viewer: ShallowRef<Cesium.Viewer | null>) => {
  // 初始化临时坐标标签
  const tempCircleMetricsPointLabel: TempPerimeterAndAreaLabel  = {
    entity: null,
    position: {
      cartesian3: null,
      lngLatAlt: { longitude: 0, latitude: 0, height: 0 },
    },
    perimeterInfo:{
      perimeter:0,
      formattedPerimeterStr:'',
    },
    areaInfo:{
      area:0,
      formattedAreaStr:'',
    },
    radiusInfo:{
      radius:0,
      formattedRadiusStr:'',
    },
  };

  // 添加临时坐标标签到 viewer
  const addTempCircleMetricsPointLabelToViewer  = ():void => {
    if (!viewer.value) return;
// 1. 创建动态文本的CallbackProperty
    const textCallback:Cesium.CallbackProperty = new Cesium.CallbackProperty((): string => {
      return `周长：${tempCircleMetricsPointLabel.perimeterInfo.formattedPerimeterStr}\n
      面积：${tempCircleMetricsPointLabel.areaInfo.formattedAreaStr}\n
      半径：${tempCircleMetricsPointLabel.radiusInfo.formattedRadiusStr}`;
    }, false);

    // 2. 创建动态位置的CallbackProperty
    const positionCallback:Cesium.CallbackProperty = new Cesium.CallbackProperty((): Cesium.Cartesian3 => {
      return tempCircleMetricsPointLabel.position.cartesian3 as Cesium.Cartesian3;
    }, false);

    const pointLabelConfig:Cesium.Entity.ConstructorOptions = createTempPointLabelStyleConfig(textCallback, positionCallback);

    // 4. 组装实体并添加
    tempCircleMetricsPointLabel.entity = viewer.value.entities.add({
      id: 'tempCircleMetricsPointLabel',
      show: false,
      ...pointLabelConfig, // 复用通用样式，消除重复代码
    });
  };

  // 添加临时坐标标签到自定义数据源
  const addTempCircleMetricsPointLabelToDataSource = (
    dataSource:Cesium.CustomDataSource,
    circleData:CircleData,
    properties:EntityProperties=null,
    graphic
  ):void => {
    if (circleData.radius===0) return;
    const perimeter:number = calculatePerimeterFromGraphic(graphic);

    const area = calculateAreaFromGraphic(graphic); // 单位：平方米

    const uniqueId:string = generateBizUniqueId('tempCircleMetricsPointLabel');
    const formattedPerimeterStr:string=formatDistance(perimeter)
    const formattedAreaStr:string=formatArea(area)
    const formattedRadiusStr:string=formatDistance(circleData.radius)

    // 1. 生成静态文本
    const staticText:string = `周长：${formattedPerimeterStr}\n
    面积：${formattedAreaStr}\n
    半径：${formattedRadiusStr}`;

    // 2. 调用通用函数生成样式配置
    const styleConfig:Cesium.Entity.ConstructorOptions = createTempPointLabelStyleConfig(
      staticText,
      tempCircleMetricsPointLabel.position.cartesian3,
    );

    const entityConfig:Cesium.Entity.ConstructorOptions={
      id: uniqueId,
      show: true,
      ...styleConfig, // 复用通用样式
    }
    if (properties) {
      properties.label={
        originalFillColor:styleConfig.label?.fillColor
      }
      entityConfig.properties=properties
    }
    styleConfig.label.fillColor=Cesium.Color.TRANSPARENT

    // 3. 组装实体配置并添加
    dataSource.entities.add(entityConfig);
  };

  // 清除临时坐标标签
  const removeTempCircleMetricsPointLabel = ():void => {
    viewer.value?.entities.removeById('tempCircleMetricsPointLabel');
    tempCircleMetricsPointLabel.entity = null;
  };

  // 更新临时坐标标签的位置和数据
  const updateTempCircleMetricsPointLabel = (radius:number,graphic):void => {
    if (radius===0) return;

    const perimeter:number = calculatePerimeterFromGraphic(graphic);

    const area = calculateAreaFromGraphic(graphic); // 单位：平方米

    tempCircleMetricsPointLabel.perimeterInfo.perimeter = perimeter;
    tempCircleMetricsPointLabel.perimeterInfo.formattedPerimeterStr = formatDistance(perimeter);

    tempCircleMetricsPointLabel.areaInfo.area = area;
    tempCircleMetricsPointLabel.areaInfo.formattedAreaStr = formatArea(area);

    tempCircleMetricsPointLabel.radiusInfo.radius = radius;
    tempCircleMetricsPointLabel.radiusInfo.formattedRadiusStr = formatDistance(radius);

    // 显示标签
    if (tempCircleMetricsPointLabel.entity && !tempCircleMetricsPointLabel.entity.show) {
      tempCircleMetricsPointLabel.entity.show = true;
    }
  };

  const setTempPerimeterAndAreaLabelVisibility=(visibility:boolean)=>{
    if(!tempCircleMetricsPointLabel.entity){
      return
    }
    tempCircleMetricsPointLabel.entity.show=visibility
  }


  return {
    tempCircleMetricsPointLabel,
    addTempCircleMetricsPointLabelToViewer ,
    addTempCircleMetricsPointLabelToDataSource,
    removeTempCircleMetricsPointLabel,
    updateTempCircleMetricsPointLabel,
    setTempPerimeterAndAreaLabelVisibility,
  };
};
