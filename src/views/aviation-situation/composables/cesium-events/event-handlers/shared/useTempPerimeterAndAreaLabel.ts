// useTempPerimeterAndAreaLabel.ts
import * as Cesium from 'cesium'
import { ShallowRef } from 'vue'
import { generateBizUniqueId } from '@/utils/uuid'
import { calculatePolylineTotalLength, formatDistance } from '@/utils/geoUtils.ts'
import type {LngLatAlt} from "@/views/aviation-situation/types/shared"
import { TEMP_POINT_LABEL_STYLE,TEMP_TOTAL_LENGTH_LABEL_STYLE } from '@/views/aviation-situation/constants/cesiumStyleConstants'

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

// ========== 新增：线段长度Label通用配置函数 ==========
/**
 * 创建线段长度Label的样式配置（仅Label，无Point）
 * @param text Label文本（静态文本/CallbackProperty）
 * @param position 实体位置（静态坐标/CallbackProperty）
 * @returns Label样式配置
 */
const createTotalLengthLabelConfig = (
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
      pixelOffset: TEMP_TOTAL_LENGTH_LABEL_STYLE.LABEL.PIXEL_OFFSET,
      heightReference: TEMP_POINT_LABEL_STYLE.LABEL.HEIGHT_REFERENCE,
      disableDepthTestDistance: Number.POSITIVE_INFINITY, // 防遮挡（常量漏配时兜底）
    },
  };

  // 动态/静态文本、位置单独赋值
  if (text) baseConfig.label!.text = text;
  if (position) baseConfig.position = position;

  return baseConfig;
};

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
    const labelConfig:Cesium.Entity.ConstructorOptions = createTotalLengthLabelConfig(textCallback, positionCallback);

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
    lngLatAlt:LngLatAlt,
    lngLatAltArray:number[],
  ):void => {
    if (lngLatAltArray.length===0 || !lngLatAlt) return;
    const totalDistance:number = calculatePolylineTotalLength(lngLatAltArray);

    const uniqueId:string = generateBizUniqueId('tempPerimeterAndAreaLabel');
    const formattedTotalDistanceStr:number=formatDistance(totalDistance)

    // 1. 生成静态文本
    const staticText:string = `总长度：${formattedTotalDistanceStr}`;

    // 2. 调用通用函数生成样式配置
    const styleConfig:Cesium.Entity.ConstructorOptions = createTotalLengthLabelConfig(
      staticText,
      Cesium.Cartesian3.fromDegrees(lngLatAlt.longitude, lngLatAlt.latitude, lngLatAlt.height),
    );

    // 3. 组装实体配置并添加
    dataSource.entities.add({
      id: uniqueId,
      show: true,
      ...styleConfig, // 复用通用样式
    });
  };

  // 清除临时坐标标签
  const removeTempPerimeterAndAreaLabel = ():void => {
    viewer.value?.entities.removeById('tempPerimeterAndAreaLabel');
    tempPerimeterAndAreaLabel.entity = null;
  };

  // 更新临时坐标标签的位置和数据
  const updateTempPerimeterAndAreaLabel = (lngLatAlt,distance):void => {
    if (!lngLatAlt) return;
    const cartesian3:Cesium.Cartesian3=Cesium.Cartesian3.fromDegrees(lngLatAlt.longitude, lngLatAlt.latitude, lngLatAlt.height);

    tempPerimeterAndAreaLabel.position.cartesian3 = cartesian3;
    // 转换坐标
    tempPerimeterAndAreaLabel.position.lngLatAlt = lngLatAlt;
    tempPerimeterAndAreaLabel.lengthInfo.distance = distance;
    tempPerimeterAndAreaLabel.lengthInfo.formattedDistanceStr = formatDistance(distance);

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
