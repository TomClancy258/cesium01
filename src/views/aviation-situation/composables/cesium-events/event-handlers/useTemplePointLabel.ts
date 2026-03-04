// useTemplePointLabel.ts
import * as Cesium from 'cesium'
import { ShallowRef } from 'vue'
import { generateBizUniqueId } from '@/utils/uuid'
import { formatLngLatAlt ,cartesian3ToLngLatAlt} from '@/utils/geoUtils.ts'

// 抽离类型定义（建议进一步抽离到全局类型文件）
export interface TemplePointLabelPositionLngLatAlt {
  longitude: number
  latitude: number
  height: number
}

export interface TemplePointLabelPosition {
  cartesian3: Cesium.Cartesian3 | null | undefined
  lngLatAlt: TemplePointLabelPositionLngLatAlt
  lngLatAltFormat: TemplePointLabelPositionLngLatAlt
}

export interface TemplePointLabel {
  entity: Cesium.Entity | null
  position: TemplePointLabelPosition
}

export const useTemplePointLabel = (viewer: ShallowRef<Cesium.Viewer | null>) => {
  // 初始化临时坐标标签
  const templePointLabel: TemplePointLabel = {
    entity: null,
    position: {
      cartesian3: null,
      lngLatAlt: { longitude: 0, latitude: 0, height: 0 },
      lngLatAltFormat: { longitude: 0, latitude: 0, height: 0 }
    }
  };

  // 添加临时坐标标签到 viewer
  const addTempPointLabelEntityToViewer = () => {
    if (!viewer.value) return;
    const position: TemplePointLabelPosition = templePointLabel.position

    templePointLabel.entity = viewer.value.entities.add({
      id: 'tempPointLabelEntity',
      show: false,
      position: new Cesium.CallbackProperty((): Cesium.Cartesian3 => {
        return templePointLabel.position.cartesian3 as Cesium.Cartesian3;
      }, false),
      label: {
        text: new Cesium.CallbackProperty((): string => {
          return `经度：${position.lngLatAltFormat.longitude}°\n纬度：${position.lngLatAltFormat.latitude}°\n海拔：${position.lngLatAltFormat.height}m`
        }, false),
        font: '14px Verdana',
        outlineColor: Cesium.Color.DARKSLATEGREY,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -45),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
      point: {
        pixelSize: 10,
        color: Cesium.Color.fromBytes(243, 242, 99),
        outlineColor: Cesium.Color.fromBytes(219, 218, 111),
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });
  };

  // 添加临时坐标标签到自定义数据源
  const addTempPointLabelEntityToDataSource = (
    currentDistanceSurveying
  ):TemplePointLabelPositionLngLatAlt => {
    if (!currentDistanceSurveying.dataSource || !templePointLabel.position.cartesian3) return;
    const { lngLatAlt, lngLatAltFormat }: {
      lngLatAlt: TemplePointLabelPositionLngLatAlt
      lngLatAltFormat: TemplePointLabelPositionLngLatAlt
    } = templePointLabel.position;
    const uniqueId = generateBizUniqueId('pointLabelEntity');

    const entity:Cesium.Entity=currentDistanceSurveying.dataSource.entities.add({
      id: uniqueId,
      show: true,
      position: templePointLabel.position.cartesian3,
      label: {
        text: `经度：${lngLatAltFormat.longitude}°\n纬度：${lngLatAltFormat.latitude}°\n海拔：${lngLatAltFormat.height}m`,
        font: '14px Verdana',
        outlineColor: Cesium.Color.DARKSLATEGREY,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -45),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
      point: {
        pixelSize: 10,
        color: Cesium.Color.fromBytes(243, 242, 99),
        outlineColor: Cesium.Color.fromBytes(219, 218, 111),
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });

    currentDistanceSurveying.pointStack.push(entity)
    return lngLatAlt;
  };

  // 清除临时坐标标签
  const removeTempPointLabelEntity = () => {
    viewer.value?.entities.removeById('tempPointLabelEntity');
    templePointLabel.entity = null;
  };

  // 更新临时坐标标签的位置和数据
  const updateTemplePointLabel = (cartesian3: Cesium.Cartesian3 | null) => {
    if (!cartesian3) return;

    templePointLabel.position.cartesian3 = cartesian3;
    // 转换坐标
    const lngLatAlt: TemplePointLabelPositionLngLatAlt = cartesian3ToLngLatAlt(cartesian3);
    templePointLabel.position.lngLatAlt = lngLatAlt;
    // 格式化坐标
    templePointLabel.position.lngLatAltFormat = formatLngLatAlt(lngLatAlt);

    // 显示标签
    if (templePointLabel.entity && !templePointLabel.entity.show) {
      templePointLabel.entity.show = true;
    }
  };

  return {
    templePointLabel,
    addTempPointLabelEntityToViewer,
    addTempPointLabelEntityToDataSource,
    removeTempPointLabelEntity,
    updateTemplePointLabel,
  };
};
