// useTempTotalLengthLabel.ts
import * as Cesium from 'cesium'
import { ShallowRef } from 'vue'
import { generateBizUniqueId } from '@/utils/uuid'
import { calculatePolylineTotalLength, formatDistance } from '@/utils/geoUtils.ts'
import type {LngLatAlt} from "@/views/aviation-situation/types/shared"
import type {TempSegmentLengthLabel} from "./useTempSegmentLengthLabel"
import { createEntityLabelConfig } from '@/utils/cesiumUtils'
import { EntityProperties } from '@/views/aviation-situation/types/entity'

export const useTempTotalLengthLabel = (viewer: ShallowRef<Cesium.Viewer | null>) => {
  // 初始化临时坐标标签
  const tempTotalLengthLabel: TempSegmentLengthLabel  = {
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
  const addTempTotalLengthLabelToViewer = ():void => {
    if (!viewer.value) return;
// 1. 创建动态文本的CallbackProperty
    const textCallback:Cesium.CallbackProperty = new Cesium.CallbackProperty((): string => {
      return `总长度：${tempTotalLengthLabel.lengthInfo.formattedDistanceStr}`;
    }, false);

    // 2. 创建动态位置的CallbackProperty
    const positionCallback:Cesium.CallbackProperty = new Cesium.CallbackProperty((): Cesium.Cartesian3 => {
      return tempTotalLengthLabel.position.cartesian3 as Cesium.Cartesian3;
    }, false);

    // 3. 调用通用函数生成Label配置（无Point，仅Label）
    const labelConfig:Cesium.Entity.ConstructorOptions = createEntityLabelConfig(textCallback, positionCallback,'totalDistance');

    // 4. 组装实体并添加
    tempTotalLengthLabel.entity = viewer.value.entities.add({
      id: 'tempTotalLengthLabel',
      show: false,
      ...labelConfig, // 复用通用样式，消除重复代码
    });
  };

  // 添加临时坐标标签到自定义数据源
  const addTempTotalLengthLabelToDataSource = (
    dataSource:Cesium.CustomDataSource,
    lngLatAlt:LngLatAlt,
    lngLatAltArray:number[],
    properties:EntityProperties=null
  ):void => {
    if (lngLatAltArray.length===0 || !lngLatAlt) return;
    const totalDistance:number = calculatePolylineTotalLength(lngLatAltArray);

    const uniqueId:string = generateBizUniqueId('tempTotalLengthLabel');
    const formattedTotalDistanceStr:string=formatDistance(totalDistance)

    // 1. 生成静态文本
    const staticText:string = `总长度：${formattedTotalDistanceStr}`;

    // 2. 调用通用函数生成样式配置
    const styleConfig:Cesium.Entity.ConstructorOptions = createEntityLabelConfig(
      staticText,
      Cesium.Cartesian3.fromDegrees(lngLatAlt.longitude, lngLatAlt.latitude, lngLatAlt.height),
      'totalDistance'
    );

    const entityConfig:Cesium.Entity.ConstructorOptions={
      id: uniqueId,
      show: true,
      ...styleConfig, // 复用通用样式
    }
    if (properties) {
      entityConfig.properties=properties
    }

    // 3. 组装实体配置并添加
    dataSource.entities.add(entityConfig);

  };

  // 清除临时坐标标签
  const removeTempTotalLengthLabel = ():void => {
    viewer.value?.entities.removeById('tempTotalLengthLabel');
    tempTotalLengthLabel.entity = null;
  };

  // 更新临时坐标标签的位置和数据
  const updateTempTotalLengthLabel = (lngLatAlt,distance):void => {
    if (!lngLatAlt) return;
    const cartesian3:Cesium.Cartesian3=Cesium.Cartesian3.fromDegrees(lngLatAlt.longitude, lngLatAlt.latitude, lngLatAlt.height);

    tempTotalLengthLabel.position.cartesian3 = cartesian3;
    // 转换坐标
    tempTotalLengthLabel.position.lngLatAlt = lngLatAlt;
    tempTotalLengthLabel.lengthInfo.distance = distance;
    tempTotalLengthLabel.lengthInfo.formattedDistanceStr = formatDistance(distance);

    // 显示标签
    if (tempTotalLengthLabel.entity && !tempTotalLengthLabel.entity.show) {
      tempTotalLengthLabel.entity.show = true;
    }
  };

  const setTempTotalLengthLabelVisibility=(visibility:boolean)=>{
    if(!tempTotalLengthLabel.entity){
      return
    }
    tempTotalLengthLabel.entity.show=visibility
  }


  return {
    tempTotalLengthLabel,
    addTempTotalLengthLabelToViewer,
    addTempTotalLengthLabelToDataSource,
    removeTempTotalLengthLabel,
    updateTempTotalLengthLabel,
    setTempTotalLengthLabelVisibility,
  };
};
