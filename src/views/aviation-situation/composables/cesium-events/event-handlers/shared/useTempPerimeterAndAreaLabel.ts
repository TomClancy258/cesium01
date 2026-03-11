// useTempPerimeterAndAreaLabel.ts
import * as Cesium from 'cesium'
import { ShallowRef } from 'vue'
import { generateBizUniqueId } from '@/utils/uuid'
import {
  calculateArea, calculateCentroidLngLatAlt,
  calculatePerimeter,
  formatArea,
  formatDistance
} from '@/utils/geoUtils.ts'
import type {LngLatAlt} from "@/views/aviation-situation/types/shared"
import * as turf from '@turf/turf'
import { createEntityLabelConfig, getPolygon } from '@/utils/cesiumUtils'
import { EntityProperties } from '@/views/aviation-situation/types/entity'

export interface PerimeterInfo {
  perimeter: number;
  formattedPerimeterStr: string;
}

export interface AreaInfo {
  area: number;
  formattedAreaStr: string;
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
}

export const useTempPerimeterAndAreaLabel = (viewer: ShallowRef<Cesium.Viewer | null>) => {
  // 初始化临时坐标标签
  const tempPerimeterAndAreaLabel: TempPerimeterAndAreaLabel  = {
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
  };

  // 添加临时坐标标签到 viewer
  const addTempPerimeterAndAreaLabelToViewer = ():void => {
    if (!viewer.value) return;
// 1. 创建动态文本的CallbackProperty
    const textCallback:Cesium.CallbackProperty = new Cesium.CallbackProperty((): string => {
      return `周长：${tempPerimeterAndAreaLabel.perimeterInfo.formattedPerimeterStr}\n
      面积：${tempPerimeterAndAreaLabel.areaInfo.formattedAreaStr}`;
    }, false);

    // 2. 创建动态位置的CallbackProperty
    const positionCallback:Cesium.CallbackProperty = new Cesium.CallbackProperty((): Cesium.Cartesian3 => {
      return tempPerimeterAndAreaLabel.position.cartesian3 as Cesium.Cartesian3;
    }, false);

    // 3. 调用通用函数生成Label配置（无Point，仅Label）
    const labelConfig:Cesium.Entity.ConstructorOptions = createEntityLabelConfig(textCallback, positionCallback);

    // 4. 组装实体并添加
    tempPerimeterAndAreaLabel.entity = viewer.value.entities.add({
      id: 'tempPerimeterAndAreaLabel',
      show: false,
      ...labelConfig, // 复用通用样式，消除重复代码
    });
  };

  // 添加临时坐标标签到自定义数据源
  const addTempPerimeterAndAreaLabelToDataSource = (
    dataSource:Cesium.CustomDataSource,
    lngLatAltArray:number[],
    properties:EntityProperties=null,
    graphic
  ):void => {
    if (lngLatAltArray.length===0) return;
    const perimeter:number = calculatePerimeter(lngLatAltArray);

    const area = calculateArea(lngLatAltArray); // 单位：平方米

    const uniqueId:string = generateBizUniqueId('tempPerimeterAndAreaLabel');
    const formattedPerimeterStr:string=formatDistance(perimeter)
    const formattedAreaStr:string=formatArea(area)

    // 1. 生成静态文本
    const staticText:string = `周长：${formattedPerimeterStr}\n
    面积：${formattedAreaStr}`;

    const center = turf.centerOfMass(graphic);
    const centerCoord = center.geometry.coordinates;
    const lngLatAlt={
      longitude:centerCoord[0],
      latitude:centerCoord[1],
      height:0,
    }

    // 2. 调用通用函数生成样式配置
    const styleConfig:Cesium.Entity.ConstructorOptions = createEntityLabelConfig(
      staticText,
      Cesium.Cartesian3.fromDegrees(lngLatAlt.longitude, lngLatAlt.latitude,lngLatAlt.height),
    );

    const entityConfig:Cesium.Entity.ConstructorOptions={
      id: uniqueId,
      show: false,
      ...styleConfig, // 复用通用样式
    }
    if (properties) {
      entityConfig.properties=properties
    }

    // 3. 组装实体配置并添加
    dataSource.entities.add(entityConfig);
  };

  // 清除临时坐标标签
  const removeTempPerimeterAndAreaLabel = ():void => {
    viewer.value?.entities.removeById('tempPerimeterAndAreaLabel');
    tempPerimeterAndAreaLabel.entity = null;
  };

  // 更新临时坐标标签的位置和数据
  const updateTempPerimeterAndAreaLabel = (lngLatAltArray:number[],graphic):void => {
    if (lngLatAltArray.length===0) return;

    const perimeter:number = calculatePerimeter(lngLatAltArray);
    const area = calculateArea(lngLatAltArray); // 单位：平方米

    const center = turf.centerOfMass(graphic);
    const centerCoord = center.geometry.coordinates;
    const lngLatAlt={
      longitude:centerCoord[0],
      latitude:centerCoord[1],
      height:0,
    }

    const cartesian3:Cesium.Cartesian3=Cesium.Cartesian3.fromDegrees(lngLatAlt.longitude, lngLatAlt.latitude, lngLatAlt.height);

    tempPerimeterAndAreaLabel.position.cartesian3 = cartesian3;
    tempPerimeterAndAreaLabel.position.lngLatAlt = lngLatAlt;

    tempPerimeterAndAreaLabel.perimeterInfo.perimeter = perimeter;
    tempPerimeterAndAreaLabel.perimeterInfo.formattedPerimeterStr = formatDistance(perimeter);

    tempPerimeterAndAreaLabel.areaInfo.area = area;
    tempPerimeterAndAreaLabel.areaInfo.formattedAreaStr = formatArea(area);

    // 显示标签
    if (tempPerimeterAndAreaLabel.entity && !tempPerimeterAndAreaLabel.entity.show) {
      tempPerimeterAndAreaLabel.entity.show = true;
    }
  };

  const setTempPerimeterAndAreaLabelVisibility=(visibility:boolean)=>{
    if(!tempPerimeterAndAreaLabel.entity){
      return
    }
    tempPerimeterAndAreaLabel.entity.show=visibility
  }


  return {
    tempPerimeterAndAreaLabel,
    addTempPerimeterAndAreaLabelToViewer,
    addTempPerimeterAndAreaLabelToDataSource,
    removeTempPerimeterAndAreaLabel,
    updateTempPerimeterAndAreaLabel,
    setTempPerimeterAndAreaLabelVisibility,
  };
};
