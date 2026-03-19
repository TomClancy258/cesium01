//src/views/aviation-situation/composables/cesium-events/event-handlers/shared/useMouseFollowPointLabel.ts
import * as Cesium from 'cesium'
import { ShallowRef } from 'vue'
import { generateBizUniqueId } from '@/utils/uuid'
import { formatLngLatAlt ,cartesian3ToLngLatAlt} from '@/utils/geoUtils.ts'
import {LngLatAlt} from "@/views/aviation-situation/types/shared"
import { EntityProperties } from '@/views/aviation-situation/types/entity'
import {createTempPointLabelStyleConfig} from "@/utils/cesiumUtils"

export interface TempPointLabelPosition  {
  cartesian3: Cesium.Cartesian3 | null | undefined
  lngLatAlt: LngLatAlt
  formattedLngLatAlt: LngLatAlt
}

export interface TempPointLabel {
  entity: Cesium.Entity | null
  position: TempPointLabelPosition
}

export const useMouseFollowPointLabel = (viewer: ShallowRef<Cesium.Viewer | null>) => {
  // 初始化临时坐标标签
  const tempPointLabel: TempPointLabel = {
    entity: null,
    position: {
      cartesian3: null,
      lngLatAlt: { longitude: 0, latitude: 0, height: 0 },
      formattedLngLatAlt: { longitude: 0, latitude: 0, height: 0 }
    }
  };

  // 添加临时坐标标签到 viewer
  const addTempPointLabelToViewer  = () => {
    if (!viewer.value) return;
    const position: TempPointLabelPosition  = tempPointLabel.position

    // 1. 创建动态文本的CallbackProperty
    const textCallback:Cesium.CallbackProperty = new Cesium.CallbackProperty((): string => {
      return `经度：${position.formattedLngLatAlt.longitude}°\n纬度：${position.formattedLngLatAlt.latitude}°\n海拔：${position.formattedLngLatAlt.height}m`;
    }, false);

    // 2. 创建动态位置的CallbackProperty
    const positionCallback:Cesium.CallbackProperty = new Cesium.CallbackProperty((): Cesium.Cartesian3 => {
      return tempPointLabel.position.cartesian3 as Cesium.Cartesian3;
    }, false);

    // 3. 调用通用函数生成样式配置，消除重复代码
    const styleConfig:Cesium.Entity.ConstructorOptions = createTempPointLabelStyleConfig(textCallback, positionCallback);

    // 4. 组装实体配置并添加
    tempPointLabel.entity = viewer.value.entities.add({
      id: 'tempPointLabel',
      show: false,
      ...styleConfig, // 复用通用样式
    });
  };

  const setTempPointLabelVisibility=(visibility:boolean)=>{
    if (!tempPointLabel.entity) {
      return
    }
    tempPointLabel.entity.show=visibility;
  }

  // 添加临时坐标标签到自定义数据源
  const addTempPointLabelToDataSource  = (
    currentDistanceSurveying,
    properties:EntityProperties
  ):LngLatAlt  => {
    if (!currentDistanceSurveying.dataSource || !tempPointLabel.position.cartesian3) return;
    const { lngLatAlt, formattedLngLatAlt }: {
      lngLatAlt: LngLatAlt
      formattedLngLatAlt: LngLatAlt
    } = tempPointLabel.position;
    const uniqueId:string = generateBizUniqueId('tempPointLabel');

    // 1. 生成静态文本
    const staticText:string = `经度：${formattedLngLatAlt.longitude}°\n纬度：${formattedLngLatAlt.latitude}°\n海拔：${formattedLngLatAlt.height}m`;

    // 2. 调用通用函数生成样式配置
    const styleConfig:Cesium.Entity.ConstructorOptions = createTempPointLabelStyleConfig(
      staticText,
      tempPointLabel.position.cartesian3
    );

    if (properties) {
      styleConfig.properties=properties
      styleConfig.properties.label={
        originalFillColor:styleConfig.label?.fillColor
      }
    }

    // 3. 组装实体配置并添加
    const entity: Cesium.Entity = currentDistanceSurveying.dataSource.entities.add({
      id: uniqueId,
      show: true,
      ...styleConfig, // 复用通用样式
    });

    currentDistanceSurveying.surveyPoints.push(entity)
    return lngLatAlt;
  };

  // 清除临时坐标标签
  const removeTempPointLabel  = () => {
    viewer.value?.entities.removeById('tempPointLabel');
    tempPointLabel.entity = null;
  };

  // 更新临时坐标标签的位置和数据
  const updateTempPointLabel = (cartesian3: Cesium.Cartesian3 | null) => {
    if (!cartesian3) return;

    tempPointLabel.position.cartesian3 = cartesian3;
    // 转换坐标
    const lngLatAlt: LngLatAlt  = cartesian3ToLngLatAlt(cartesian3);
    tempPointLabel.position.lngLatAlt = lngLatAlt;
    // 格式化坐标
    tempPointLabel.position.formattedLngLatAlt = formatLngLatAlt(lngLatAlt);

    // 显示标签
    if (tempPointLabel.entity && !tempPointLabel.entity.show) {
      tempPointLabel.entity.show = true;
    }
  };

  return {
    tempPointLabel,
    addTempPointLabelToViewer ,
    addTempPointLabelToDataSource ,
    removeTempPointLabel ,
    updateTempPointLabel,
    setTempPointLabelVisibility,
  };
};
