// useDistanceSurveying.ts
import * as Cesium from 'cesium'
import { onUnmounted, ShallowRef, watch } from 'vue'
import { SpatialSelectForm, useSpatialSelectStore } from '@/stores/spatialSelect'
import { generateBizUniqueId } from '@/utils/uuid'
import { TempPointLabelPositionLngLatAlt, useMouseFollowPointLabel } from './useMouseFollowPointLabel'
import { useTempSegmentLengthLabel } from './useTempSegmentLengthLabel'
import { useTempTotalLengthLabel } from './useTempTotalLengthLabel'
import { useKeyboardEvents } from './useKeyboardEvents';
import {
  calculatePolylineTotalLength,
  calculateSurfaceDistance,
  getSurfaceMidpoint
} from '@/utils/geoUtils'
import { LngLatAlt } from '@/views/aviation-situation/types/shared'
import {DISTANCE_SURVEY_POLYLINE_STYLE} from "@/views/aviation-situation/constants/cesiumStyleConstants"
import {cloneEntityStyle} from "@/utils/cesiumUtils"

interface DynamicPolylineState {
  lngLatAltArray: number[]; // 经纬度+海拔数组（3个一组）
  pointCount: number; // 坐标点数量（一组算一个）
}

/** 单条距离测绘的完整结构 */
export interface DistanceSurveySession {
  dataSource: Cesium.CustomDataSource|null
  surveyPoints: Cesium.Entity[]
  segmentLengthLabels: Cesium.Entity[]
  dynamicPolyline: Cesium.Entity|null
}

/**
 * 创建线段长度Label的样式配置（仅Label，无Point）
 * @param positions 实体位置（静态坐标/CallbackProperty）
 * @returns Polyline样式配置
 */
const createDynamicPolylineConfig = (
  positions: Cesium.Cartesian3[] | Cesium.CallbackProperty | null = null
):Cesium.Entity.ConstructorOptions => {
  const baseConfig: Cesium.Entity.ConstructorOptions = {
    show: true,
    polyline: {
      width: DISTANCE_SURVEY_POLYLINE_STYLE.POLYLINE.WIDTH,
      material: DISTANCE_SURVEY_POLYLINE_STYLE.POLYLINE.MATERIAL,
      clampToGround: DISTANCE_SURVEY_POLYLINE_STYLE.POLYLINE.CLAMP_TO_GROUND, // 折线贴地（关键配置）
      arcType: DISTANCE_SURVEY_POLYLINE_STYLE.POLYLINE.ARC_TYPE,
    },
  };

  // 动态/静态文本、位置单独赋值
  if (positions) baseConfig.polyline.positions = positions;

  return baseConfig;
};

// useDistanceSurvey.ts 中新增函数
/**
 * 计算总长度标签所需的参数（位置 + 总距离）
 * @param polylineState 动态折线状态
 * @returns 总长度标签参数 { midpoint: LngLatAlt, totalDistance: number }
 */
const calculateTotalLengthLabelParams = (polylineState: DynamicPolylineState): {
  midLngLatAlt: LngLatAlt;
  totalDistance: number;
} => {
  // 取最后两个确认点计算中点（总长度标签贴在最后一段线段中点）
  const lastPointIndex = (polylineState.pointCount - 1) * 3;
  const lastPositions = [
    polylineState.lngLatAltArray[lastPointIndex],
    polylineState.lngLatAltArray[lastPointIndex + 1],
    polylineState.lngLatAltArray[lastPointIndex + 2],
  ];
  const lastButOnePointIndex = (polylineState.pointCount - 2) * 3;
  const lastButOnePositions = [
    polylineState.lngLatAltArray[lastButOnePointIndex],
    polylineState.lngLatAltArray[lastButOnePointIndex + 1],
    polylineState.lngLatAltArray[lastButOnePointIndex + 2],
  ];

  // 计算中点和总距离
  const midLngLatAlt:LngLatAlt = getSurfaceMidpoint(lastButOnePositions, lastPositions);
  const totalDistance:number = calculatePolylineTotalLength(polylineState.lngLatAltArray);

  return { midLngLatAlt, totalDistance };
};

export const useDistanceSurvey = (viewer: ShallowRef<Cesium.Viewer | null>) => {

  const {
    tempPointLabel,
    addTempPointLabelToViewer ,
    addTempPointLabelToDataSource ,
    removeTempPointLabel ,
    updateTempPointLabel
  } = useMouseFollowPointLabel(viewer);

  const {
    tempSegmentLengthLabel,
    addTempSegmentLengthLabelToViewer,
    addTempSegmentLengthLabelToDataSource,
    removeTempSegmentLengthLabel,
    updateTempSegmentLengthLabel
  } = useTempSegmentLengthLabel(viewer);

  const {
    tempTotalLengthLabel,
    addTempTotalLengthLabelToViewer,
    addTempTotalLengthLabelToDataSource,
    removeTempTotalLengthLabel,
    updateTempTotalLengthLabel
  } = useTempTotalLengthLabel(viewer);

  const spatialSelectStore = useSpatialSelectStore()
  //存放全部距离测绘折线（可以绘制多条）的数组
  const distanceSurveyDataSources: Cesium.CustomDataSource[] = []
  const activeDistanceSurvey: DistanceSurveySession = {
    //该距离测绘折线的全部
    dataSource: null,
    surveyPoints:[],
    segmentLengthLabels:[],
    //该距离测绘的折线
    dynamicPolyline: null,
  }

  const dynamicPolylineState: DynamicPolylineState = {
    lngLatAltArray: [],
    pointCount: 0
  };

  const distanceSurvey = (position: Cesium.Cartesian2): void => {
    const ray: Cesium.Ray = viewer.value.camera.getPickRay(position)
    const cartesian3 :Cesium.Cartesian3 = viewer.value.scene.globe.pick(ray, viewer.value.scene)
    if (!cartesian3) {
      return
    }

    // 复用抽离后的更新逻辑
    updateTempPointLabel(cartesian3);

    const lngLatAlt:TempPointLabelPositionLngLatAlt  = tempPointLabel.position.lngLatAlt;

    addDynamicLineSegment(lngLatAlt.longitude, lngLatAlt.latitude, lngLatAlt.height);
    updateSegmentLengthLabel();

  }

  const addDynamicLineSegment = (longitude:number,latitude:number,height:number) => {
    if (dynamicPolylineState.lngLatAltArray.length>0) {
      const lastPointIndex:number=dynamicPolylineState.pointCount*3
      dynamicPolylineState.lngLatAltArray[lastPointIndex]=longitude
      dynamicPolylineState.lngLatAltArray[lastPointIndex+1]=latitude
      dynamicPolylineState.lngLatAltArray[lastPointIndex+2]=height
    }
  }

  const updateSegmentLengthLabel = () => {
    if (dynamicPolylineState.lngLatAltArray.length>=2) {
      const lastPointIndex:number=dynamicPolylineState.pointCount*3
      const lastPositions:number[]=[
        dynamicPolylineState.lngLatAltArray[lastPointIndex],
        dynamicPolylineState.lngLatAltArray[lastPointIndex+1],
        dynamicPolylineState.lngLatAltArray[lastPointIndex+2],
      ]
      const lastButOnePointIndex:number=(dynamicPolylineState.pointCount-1)*3
      const lastButOnePositions:number[]=[
        dynamicPolylineState.lngLatAltArray[lastButOnePointIndex],
        dynamicPolylineState.lngLatAltArray[lastButOnePointIndex+1],
        dynamicPolylineState.lngLatAltArray[lastButOnePointIndex+2],
      ]

      const distance:number=calculateSurfaceDistance(lastButOnePositions,lastPositions)
      const totalDistance:number=calculatePolylineTotalLength(dynamicPolylineState.lngLatAltArray)
      const lngLatAlt:LngLatAlt=getSurfaceMidpoint(lastButOnePositions,lastPositions)

      updateTempSegmentLengthLabel(lngLatAlt,distance)
      updateTempTotalLengthLabel(lngLatAlt,totalDistance)
    }
  }

  const confirmSurveyPoint = () => {
    const lngLatAlt: TempPointLabelPositionLngLatAlt =addTempPointLabelToDataSource (activeDistanceSurvey)

    dynamicPolylineState.lngLatAltArray.push(lngLatAlt.longitude, lngLatAlt.latitude, lngLatAlt.height)
    dynamicPolylineState.pointCount++

    if (dynamicPolylineState.pointCount >= 2) {
      addTempSegmentLengthLabelToDataSource(activeDistanceSurvey)
    }
  }

  const initActiveDistanceSurvey = (): void => {
    const uniqueId:string = generateBizUniqueId('activeDistanceSurveyPolyline')
    activeDistanceSurvey.dataSource=new Cesium.CustomDataSource(uniqueId)

    // 2. 创建动态位置的CallbackProperty
    const positionCallback:Cesium.CallbackProperty = new Cesium.CallbackProperty(
      () => {
        if (dynamicPolylineState.lngLatAltArray.length === 0) {
          return []
        }else{
          return Cesium.Cartesian3.fromDegreesArrayHeights(dynamicPolylineState.lngLatAltArray)
        }
      },
      false,
    );

    // 3. 调用通用函数生成Label配置（无Point，仅Label）
    const polylineConfig:Cesium.Entity.ConstructorOptions = createDynamicPolylineConfig(positionCallback);

    // 4. 组装实体并添加
    activeDistanceSurvey.dynamicPolyline = activeDistanceSurvey.dataSource.entities.add({
      id: uniqueId,
      properties: {
        sourceType: 'distanceSurveying',
        type: 'distanceSurveying_polyline',
      },
      ...polylineConfig, // 复用通用样式，消除重复代码
    });

    viewer.value?.dataSources.add(activeDistanceSurvey.dataSource)
  }

  const cloneDynamicPolylineToDataSource=(dataSource)=>{
    const uniqueId:string = generateBizUniqueId('distanceSurveyingPolyline')

    // 2. 创建动态位置的CallbackProperty
    const positions:Cesium.Cartesian3[]=Cesium.Cartesian3.fromDegreesArrayHeights(dynamicPolylineState.lngLatAltArray)

    // 3. 调用通用函数生成Label配置（无Point，仅Label）
    const polylineConfig:Cesium.Entity.ConstructorOptions = createDynamicPolylineConfig(positions);

    // 4. 组装实体并添加
    dataSource.entities.add({
      id: uniqueId,
      properties: {
        sourceType: 'distanceSurveying',
        type: 'distanceSurveying_polyline',
      },
      ...polylineConfig, // 复用通用样式，消除重复代码
    });
  }

  /**
   * 重置计划轨迹
   */
  const resetDynamicPolylineState = (): void => {
    dynamicPolylineState.lngLatAltArray = [];
    dynamicPolylineState.pointCount = 0;
  }

  /**
   * 清理鼠标移动时临时追加的坐标点（仅保留用户确认的点）
   * @param polylineState 动态折线状态
   */
  const cleanTempMouseMovePoints = (polylineState: DynamicPolylineState): void => {
    const polylinePositionsLen:number = polylineState.lngLatAltArray.length;
    const polylinePointCount:number = polylinePositionsLen / 3;
    // 若坐标数组长度 = 确认点数 +1（说明有鼠标移动的临时点），则删除最后3个元素
    if (polylinePointCount === polylineState.pointCount + 1) {
      polylineState.lngLatAltArray.splice(polylineState.pointCount * 3, 3);
    }
  };

  let unwatchSpatialSelectForm: () => void
  const setupSpatialSelectFormWatch = (): void => {
    unwatchSpatialSelectForm = watch(
      () => spatialSelectStore.spatialSelectForm,
      (newForm: SpatialSelectForm, oldForm: SpatialSelectForm) => {
        if (newForm.operationType === 'distanceSurveying') {
          initActiveDistanceSurvey()
          addTempPointLabelToViewer ()
          addTempSegmentLengthLabelToViewer()
          addTempTotalLengthLabelToViewer()
        } else {
          cleanupActiveDistanceSurvey()
          resetDynamicPolylineState()
          removeTempPointLabel ()
          removeTempSegmentLengthLabel()
          removeTempTotalLengthLabel()
        }
      },
      {
        deep: true,
      },
    )
  }

  const finishDistanceSurvey=(): void => {
    if (dynamicPolylineState.pointCount < 2) {
      return
    }

    cleanTempMouseMovePoints(dynamicPolylineState);

    const uniqueId:string = generateBizUniqueId('distanceSurveyingDataSource')
    const newDataSource:Cesium.CustomDataSource=new Cesium.CustomDataSource(uniqueId)
    cloneDynamicPolylineToDataSource(newDataSource)

    const { midLngLatAlt, totalDistance }:{ midLngLatAlt:LngLatAlt, totalDistance:number } = calculateTotalLengthLabelParams(dynamicPolylineState);
    addTempTotalLengthLabelToDataSource(newDataSource, midLngLatAlt, totalDistance);

    cloneSurveyPointsAndLabelsToDataSource(newDataSource)

    distanceSurveyDataSources.push(newDataSource);
    viewer.value?.dataSources.add(newDataSource)
    spatialSelectStore.setOperationType('none');
  }

  const cloneSurveyPointsAndLabelsToDataSource=(dataSource: Cesium.CustomDataSource):void=>{
    for (let i = 0; i < activeDistanceSurvey.segmentLengthLabels.length; i++) {
      const oldPointEntity:Cesium.Entity = activeDistanceSurvey.surveyPoints[i];
      const oldLabelEntity:Cesium.Entity = activeDistanceSurvey.segmentLengthLabels[i];
      const pointUniqueId:string = generateBizUniqueId('pointLabelEntity');
      const labelUniqueId:string = generateBizUniqueId('LabelEntity');

      // --- A. 克隆 Point (创建新对象) ---
      if (oldPointEntity) {
        const pointCloneConfig:Cesium.Entity.ConstructorOptions = cloneEntityStyle(oldPointEntity, pointUniqueId);
        dataSource.entities.add(pointCloneConfig);
      }

      // --- B. 克隆 Label (关键：固化 text) ---
      if (oldLabelEntity) {
        const labelCloneConfig:Cesium.Entity.ConstructorOptions = cloneEntityStyle(oldLabelEntity, labelUniqueId);
        dataSource.entities.add(labelCloneConfig);
      }
    }
    const pointUniqueId:string = generateBizUniqueId('pointLabelEntity');
    const lastPointEntity:Cesium.Entity=activeDistanceSurvey.surveyPoints[dynamicPolylineState.pointCount-1]
    if (lastPointEntity) {
      const lastPointCloneConfig:Cesium.Entity.ConstructorOptions = cloneEntityStyle(lastPointEntity, pointUniqueId);
      dataSource.entities.add(lastPointCloneConfig);
    }
  }

  const cleanupActiveDistanceSurvey=()=>{
    activeDistanceSurvey.surveyPoints=[]
    activeDistanceSurvey.segmentLengthLabels=[]
    viewer.value.dataSources.remove(activeDistanceSurvey.dataSource);
  }

  const handleEsc = () => {
    console.log("ESC pressed - Resetting distance surveying");
    spatialSelectStore.setOperationType('none');
  };

  const handleBackspace = () => {
    console.log("Backspace pressed - Removing last point");

    // 回退最后一个坐标点
    if (dynamicPolylineState.pointCount >= 2) {
      const pointEntity:Cesium.Entity|undefined=activeDistanceSurvey.surveyPoints.pop()
      const labelEntity:Cesium.Entity|undefined=activeDistanceSurvey.segmentLengthLabels.pop()
      activeDistanceSurvey.dataSource.entities.remove(pointEntity)
      activeDistanceSurvey.dataSource.entities.remove(labelEntity)

      dynamicPolylineState.lngLatAltArray.splice((dynamicPolylineState.pointCount-1) * 3, 3);
      // 删除最后三个元素 (lon, lat, alt)
      dynamicPolylineState.pointCount--;
      updateSegmentLengthLabel();
      updateTempTotalLengthLabel();
    }
  };

  // 仅在距离测绘模式下监听键盘事件
  const { unbindKeyboardEvents } = useKeyboardEvents(
    handleEsc,
    handleBackspace,
    () => spatialSelectStore.spatialSelectForm.operationType === 'distanceSurveying'
  );

  onUnmounted(() => {
    unwatchSpatialSelectForm?.()
    unbindKeyboardEvents();
  })

  return {
    distanceSurvey,
    confirmSurveyPoint,
    setupSpatialSelectFormWatch,
    finishDistanceSurvey,
  }
}
