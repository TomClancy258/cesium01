//src/views/aviation-situation/composables/cesium-events/event-handlers/shared/useTempTotalDistanceLabel.ts
import * as Cesium from 'cesium'
import { ShallowRef } from 'vue'
import { generateBizUniqueId } from '@/utils/uuid'
import { calculatePolylineTotalDistance, formatDistance } from '@/utils/geoUtils.ts'
import type {LngLatAlt} from "@/views/aviation-situation/types/shared"
import type {TempSegmentDistanceLabel} from "./useTempSegmentDistanceLabel"
import { createEntityLabelConfig } from '@/utils/cesiumUtils'
import { DrawingToolEntityProperties } from '@/views/aviation-situation/types/entity'

export const useTempTotalDistanceLabel = (viewer: ShallowRef<Cesium.Viewer | null>) => {
  // 初始化临时坐标标签
  const tempTotalDistanceLabel: TempSegmentDistanceLabel  = {
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
  const addTempTotalDistanceLabelToViewer = ():void => {
    if (!viewer.value) return;
// 1. 创建动态文本的CallbackProperty
    const textCallback:Cesium.CallbackProperty = new Cesium.CallbackProperty((): string => {
      return `总长度：${tempTotalDistanceLabel.distanceInfo.formattedDistanceStr}`;
    }, false);

    // 2. 创建动态位置的CallbackProperty
    const positionCallback:Cesium.CallbackProperty = new Cesium.CallbackProperty((): Cesium.Cartesian3 => {
      return tempTotalDistanceLabel.position.cartesian3 as Cesium.Cartesian3;
    }, false);

    // 3. 调用通用函数生成Label配置（无Point，仅Label）
    const labelConfig:Cesium.Entity.ConstructorOptions = createEntityLabelConfig(textCallback, positionCallback,'totalDistance');

    // 4. 组装实体并添加
    tempTotalDistanceLabel.entity = viewer.value.entities.add({
      id: 'tempTotalDistanceLabel',
      show: false,
      ...labelConfig, // 复用通用样式，消除重复代码
    });
  };

  // 添加临时坐标标签到自定义数据源
  const addTempTotalDistanceLabelToDataSource = (
    dataSource:Cesium.CustomDataSource,
    lngLatAlt:LngLatAlt,
    lngLatAltArray:number[],
    properties:DrawingToolEntityProperties=null
  ):void => {
    if (lngLatAltArray.length===0 || !lngLatAlt) return;
    const totalDistance:number = calculatePolylineTotalDistance(lngLatAltArray);

    const uniqueId:string = generateBizUniqueId('tempTotalDistanceLabel');
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
  const removeTempTotalDistanceLabel = ():void => {
    viewer.value?.entities.removeById('tempTotalDistanceLabel');
    tempTotalDistanceLabel.entity = null;
  };

  // 更新临时坐标标签的位置和数据
  const updateTempTotalDistanceLabel = (lngLatAlt,distance):void => {
    if (!lngLatAlt) return;
    const cartesian3:Cesium.Cartesian3=Cesium.Cartesian3.fromDegrees(lngLatAlt.longitude, lngLatAlt.latitude, lngLatAlt.height);

    tempTotalDistanceLabel.position.cartesian3 = cartesian3;
    // 转换坐标
    tempTotalDistanceLabel.position.lngLatAlt = lngLatAlt;
    tempTotalDistanceLabel.distanceInfo.distance = distance;
    tempTotalDistanceLabel.distanceInfo.formattedDistanceStr = formatDistance(distance);

    // 显示标签
    if (tempTotalDistanceLabel.entity && !tempTotalDistanceLabel.entity.show) {
      tempTotalDistanceLabel.entity.show = true;
    }
  };

  const setTempTotalDistanceLabelVisibility=(visibility:boolean)=>{
    if(!tempTotalDistanceLabel.entity){
      return
    }
    tempTotalDistanceLabel.entity.show=visibility
  }


  return {
    tempTotalDistanceLabel,
    addTempTotalDistanceLabelToViewer,
    addTempTotalDistanceLabelToDataSource,
    removeTempTotalDistanceLabel,
    updateTempTotalDistanceLabel,
    setTempTotalDistanceLabelVisibility,
  };
};
