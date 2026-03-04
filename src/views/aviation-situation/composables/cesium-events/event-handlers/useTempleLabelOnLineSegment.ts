// useTemplePointLabel.ts
import * as Cesium from 'cesium'
import { ShallowRef } from 'vue'
import { generateBizUniqueId } from '@/utils/uuid'
import { formatDistance } from '@/utils/geoUtils.ts'

// 抽离类型定义（建议进一步抽离到全局类型文件）
export interface TempleLabelPositionLngLatAlt {
  longitude: number
  latitude: number
  height: number
}
export interface TempleLabelLabel {
  distance: number,
  distanceStrFormat: string
}

export interface TempleLabelPosition {
  cartesian3: Cesium.Cartesian3 | null | undefined
  lngLatAlt: TempleLabelPositionLngLatAlt
}

export interface TempleLabel {
  entity: Cesium.Entity | null
  position: TempleLabelPosition
  label:TempleLabelLabel
}

export const useTempleLabel = (viewer: ShallowRef<Cesium.Viewer | null>) => {
  // 初始化临时坐标标签
  const templeLabel: TempleLabel = {
    entity: null,
    position: {
      cartesian3: null,
      lngLatAlt: { longitude: 0, latitude: 0, height: 0 },
    },
    label:{
      distance:0,
      distanceStrFormat:'',
    }
  };

  // 添加临时坐标标签到 viewer
  const addTempLabelEntityToViewer = () => {
    if (!viewer.value) return;
    templeLabel.entity = viewer.value.entities.add({
      id: 'tempLabelEntity',
      show: false,
      position: new Cesium.CallbackProperty((): Cesium.Cartesian3 => {
        return templeLabel.position.cartesian3 as Cesium.Cartesian3;
      }, false),
      label: {
        text: new Cesium.CallbackProperty((): string => {
          return `长度：${templeLabel.label.distanceStrFormat}`
        }, false),
        font: '14px Verdana',
        outlineColor: Cesium.Color.DARKSLATEGREY,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -45),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });
  };

  // 添加临时坐标标签到自定义数据源
  const addTempLabelEntityToDataSource = (
    currentDistanceSurveying
  ):TempleLabelPositionLngLatAlt => {
    if (!currentDistanceSurveying.dataSource || !templeLabel.position.cartesian3) return;
    const { lngLatAlt }: {
      lngLatAlt: TempleLabelPositionLngLatAlt
    } = templeLabel.position;
    const uniqueId = generateBizUniqueId('labelEntity');

    const entity=currentDistanceSurveying.dataSource.entities.add({
      id: uniqueId,
      show: true,
      position: templeLabel.position.cartesian3,
      label: {
        text: `长度：${templeLabel.label.distanceStrFormat}`,
        font: '14px Verdana',
        outlineColor: Cesium.Color.DARKSLATEGREY,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -45),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });

    // const cloneEntity=Cesium.clone(templeLabel.entity,true)
    // const entity=currentDistanceSurveying.dataSource.entities.add(cloneEntity)

    currentDistanceSurveying.labelStack.push(entity)
    return lngLatAlt;
  };

  // 清除临时坐标标签
  const removeTempLabelEntity = () => {
    viewer.value?.entities.removeById('tempLabelEntity');
    templeLabel.entity = null;
  };

  // 更新临时坐标标签的位置和数据
  const updateTempleLabel = (position,distance) => {
    if (!position) return;
    const cartesian3=Cesium.Cartesian3.fromDegrees(position.longitude, position.latitude, position.height);

    templeLabel.position.cartesian3 = cartesian3;
    // 转换坐标
    templeLabel.position.lngLatAlt = position;
    templeLabel.label.distance = distance;
    templeLabel.label.distanceStrFormat = formatDistance(distance);

    // 显示标签
    if (templeLabel.entity && !templeLabel.entity.show) {
      templeLabel.entity.show = true;
    }
  };

  return {
    templeLabel,
    addTempLabelEntityToViewer,
    addTempLabelEntityToDataSource,
    removeTempLabelEntity,
    updateTempleLabel,
  };
};
