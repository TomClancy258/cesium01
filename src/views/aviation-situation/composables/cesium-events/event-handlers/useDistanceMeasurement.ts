// src/views/aviation-situation/composables/cesium-events/event-handlers/useDistanceSurvey.ts
import * as Cesium from 'cesium'
import { onUnmounted, ShallowRef, watch } from 'vue'
import { generateBizUniqueId } from '@/utils/uuid'
import { useKeyboardEvents } from './useKeyboardEvents';
import {
  calculatePolylineTotalDistance,
  calculateSurfaceDistance,
  getSurfaceMidpoint
} from '@/utils/geoUtils'
import { LngLatAlt } from '@/views/aviation-situation/types/shared'
import {DISTANCE_SURVEY_POLYLINE_STYLE} from "@/views/aviation-situation/constants/cesiumStyleConstants"
import {cloneEntityAsConfig} from "@/utils/cesiumUtils"
import { EntityProperties } from '@/views/aviation-situation/types/entity'
import type {DynamicPolylineState} from "@/views/aviation-situation/types/shared"
import { useDrawingToolStore,type DrawingToolForm } from '@/stores/drawingTool'
import { useDistanceMeasurementStore } from '@/stores/distanceMeasurement'
import type {SegmentDistancesState} from "@/views/aviation-situation/types/draw-tools.ts"

/** 单条距离测绘的完整结构 */
export interface DistanceSurveySession {
  dataSource: Cesium.CustomDataSource|null
  surveyPoints: Cesium.Entity[]
  segmentDistanceLabels: Cesium.Entity[]
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
const getLastLineSegmentMidLngLatAlt = (polylineState: DynamicPolylineState): LngLatAlt=> {
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

  const midLngLatAlt:LngLatAlt = getSurfaceMidpoint(lastButOnePositions, lastPositions);

  return midLngLatAlt
};

export const useDistanceMeasurement = (viewer: ShallowRef<Cesium.Viewer | null>, mouseFollowPointLabelManager, segmentDistanceLabelManager, totalDistanceLabelManager) => {
  const drawingToolStore=useDrawingToolStore()
  const distanceMeasurementStore=useDistanceMeasurementStore()

  //存放全部距离测绘折线（可以绘制多条）的数组
  // const distanceMeasurementDataSources: Cesium.CustomDataSource[] = []
  // const distanceMeasurementDataSourceMap=new Map<string,Cesium.CustomDataSource>()
  const activeDistanceSurvey: DistanceSurveySession = {
    //该距离测绘折线的全部
    dataSource: null,
    surveyPoints:[],
    segmentDistanceLabels:[],
    //该距离测绘的折线
    dynamicPolyline: null,
  }

  const dynamicPolylineState: DynamicPolylineState = {
    lngLatAltArray: [],
    pointCount: 0,
    positions:[]
  };

  const segmentDistancesState:SegmentDistancesState = {
    distances:[]
  };

  const distanceMeasurement = (position: Cesium.Cartesian2): void => {
    const ray: Cesium.Ray = viewer.value.camera.getPickRay(position)
    const cartesian3 :Cesium.Cartesian3 = viewer.value.scene.globe.pick(ray, viewer.value.scene)
    if (!cartesian3) {
      return
    }

    // 复用抽离后的更新逻辑
    mouseFollowPointLabelManager.updateTempPointLabel(cartesian3);

    const lngLatAlt:LngLatAlt  = mouseFollowPointLabelManager.tempPointLabel.position.lngLatAlt;

    addDynamicLineSegment(lngLatAlt.longitude, lngLatAlt.latitude, lngLatAlt.height);
    updateSegmentDistanceLabel();

  }

  const addDynamicLineSegment = (longitude:number,latitude:number,height:number) => {
    if (dynamicPolylineState.pointCount>=1) {
      const lastPointIndex:number=dynamicPolylineState.pointCount*3
      dynamicPolylineState.lngLatAltArray[lastPointIndex]=longitude
      dynamicPolylineState.lngLatAltArray[lastPointIndex+1]=latitude
      dynamicPolylineState.lngLatAltArray[lastPointIndex+2]=height

      dynamicPolylineState.positions=Cesium.Cartesian3.fromDegreesArrayHeights(dynamicPolylineState.lngLatAltArray)
    }
  }

  const updateSegmentDistanceLabel = () => {
    if (dynamicPolylineState.pointCount>=1) {
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
      const totalDistance:number=calculatePolylineTotalDistance(dynamicPolylineState.lngLatAltArray)
      const lngLatAlt:LngLatAlt=getSurfaceMidpoint(lastButOnePositions,lastPositions)

      segmentDistanceLabelManager.updateTempSegmentDistanceLabel(lngLatAlt,distance)
      totalDistanceLabelManager.updateTempTotalDistanceLabel(lngLatAlt,totalDistance)
    }
  }

  const confirmSurveyPoint = () => {
    const pointLabelProperties:EntityProperties={
      operationType:'distanceMeasurement',
      sourceType:'distanceMeasurement',
      type:'tempSurveyPoint',
      dataSourceName:activeDistanceSurvey.dataSource.name,
    }
    const lngLatAlt: LngLatAlt =mouseFollowPointLabelManager.addTempPointLabelToDataSource(activeDistanceSurvey,pointLabelProperties)

    dynamicPolylineState.lngLatAltArray.push(lngLatAlt.longitude, lngLatAlt.latitude, lngLatAlt.height)
    dynamicPolylineState.positions=Cesium.Cartesian3.fromDegreesArrayHeights(dynamicPolylineState.lngLatAltArray)
    dynamicPolylineState.pointCount++

    if (dynamicPolylineState.pointCount >= 2) {
      const properties:EntityProperties={
        operationType:'distanceMeasurement',
        sourceType:'distanceMeasurement',
        type:'tempSegmentDistanceLabel',
        dataSourceName:activeDistanceSurvey.dataSource.name,
        isDraft:true,
      }
      segmentDistanceLabelManager.addTempSegmentDistanceLabelToDataSource(activeDistanceSurvey,properties)
      segmentDistancesState.distances.push(
        segmentDistanceLabelManager.tempSegmentDistanceLabel.distanceInfo.distance
      )
    }
  }

  const initActiveDistanceSurvey = (): void => {
    const dataSourceUniqueId:string = generateBizUniqueId('activeDistanceSurvey')
    activeDistanceSurvey.dataSource=new Cesium.CustomDataSource(dataSourceUniqueId)

    const drawingDataSourceData:DrawingDataSource={
      name:dataSourceUniqueId
    }
    drawingToolStore.setDrawingDataSource(drawingDataSourceData)
    // 2. 创建动态位置的CallbackProperty
    const positionCallback:Cesium.CallbackProperty = new Cesium.CallbackProperty(
      () => {
          return dynamicPolylineState.positions
      },
      false,
    );

    // 3. 调用通用函数生成Label配置（无Point，仅Label）
    const polylineConfig:Cesium.Entity.ConstructorOptions = createDynamicPolylineConfig(positionCallback);
    const polylineUniqueId:string = generateBizUniqueId('activeDistanceSurveyPolyline')

    // 4. 组装实体并添加
    activeDistanceSurvey.dynamicPolyline = activeDistanceSurvey.dataSource.entities.add({
      id: polylineUniqueId,
      properties: {
        operationTypes: 'distanceMeasurement',
        sourceType: 'distanceMeasurement',
        type: 'polyline',
        dataSourceName: dataSourceUniqueId,
        originalPolylineMaterial:polylineConfig.polyline?.material,
        polyline:{
          originalMaterial:polylineConfig.polyline?.material
        },
        isDraft:true,
      },
      ...polylineConfig, // 复用通用样式，消除重复代码
    });

    viewer.value?.dataSources.add(activeDistanceSurvey.dataSource)
  }

  const cloneDynamicPolylineToDataSource=(dataSource,dataSourceName:string)=>{
    const uniqueId:string = generateBizUniqueId('distanceMeasurementPolyline')

    // 2. 创建动态位置的CallbackProperty
    const positions:Cesium.Cartesian3[]=Cesium.Cartesian3.fromDegreesArrayHeights(dynamicPolylineState.lngLatAltArray)

    // 3. 调用通用函数生成Label配置（无Point，仅Label）
    const polylineConfig:Cesium.Entity.ConstructorOptions = createDynamicPolylineConfig(positions);

    // 4. 组装实体并添加
    dataSource.entities.add({
      id: uniqueId,
      properties: {
        operationType: 'distanceMeasurement',
        sourceType: 'distanceMeasurement',
        type: 'polyline',
        dataSourceName: dataSourceName,
        originalPolylineMaterial:polylineConfig.polyline?.material,
        polyline:{
          originalMaterial:polylineConfig.polyline?.material
        },
        isDraft:true,
      } as EntityProperties,
      ...polylineConfig, // 复用通用样式，消除重复代码
    });
  }

  /**
   * 重置计划轨迹
   */
  const resetDynamicPolylineState = (): void => {
    dynamicPolylineState.lngLatAltArray = [];
    dynamicPolylineState.positions=[]
    dynamicPolylineState.pointCount = 0;

    segmentDistancesState.distances = []
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
      polylineState.positions=Cesium.Cartesian3.fromDegreesArrayHeights(polylineState.lngLatAltArray)
    }
  };

  const resetDistanceMeasurementSession=()=>{
    cleanupActiveDistanceSurvey()
    resetDynamicPolylineState()
  }

  let unwatchDrawingToolForm: () => void
  const setupDrawingToolWatch = (): void => {
    unwatchDrawingToolForm = watch(
      () => drawingToolStore.drawingToolForm,
      (newForm: DrawingToolForm, oldForm: DrawingToolForm) => {
        if (newForm.operationType === 'distanceMeasurement') {
          resetDistanceMeasurementSession()
          initActiveDistanceSurvey()
          mouseFollowPointLabelManager.setTempPointLabelVisibility(true)
        } else {
          resetDistanceMeasurementSession()
        }
      },
      {
        deep: true,
      },
    )
  }

  const finishDistanceSurvey=(): void => {
    if (dynamicPolylineState.pointCount <= 1) {
      return
    }

    cleanTempMouseMovePoints(dynamicPolylineState);

    const uniqueId:string = generateBizUniqueId('distanceMeasurementDataSource')
    const newDataSource:Cesium.CustomDataSource=new Cesium.CustomDataSource(uniqueId)
    cloneDynamicPolylineToDataSource(newDataSource,uniqueId)

    const midLngLatAlt:LngLatAlt = getLastLineSegmentMidLngLatAlt(dynamicPolylineState);

    const properties:EntityProperties={
      operationType:'distanceMeasurement',
      sourceType:'distanceMeasurement',
      type:'totalDistanceLabel',
      dataSourceName:uniqueId,
      isDraft:true,
    }
    totalDistanceLabelManager.addTempTotalDistanceLabelToDataSource(newDataSource, midLngLatAlt, dynamicPolylineState.lngLatAltArray,properties);

    cloneSurveyPointsAndLabelsToDataSource(newDataSource,uniqueId)

    // distanceMeasurementDataSourceMap.set(uniqueId,newDataSource);

    viewer.value?.dataSources.add(newDataSource)

    const distanceMeasurementData={
      dataSourceName:uniqueId,
      type:'polyline',
      sourceType:'distanceMeasurement',
      centroidLngLatAlt:totalDistanceLabelManager.tempTotalDistanceLabel.position.lngLatAlt,
      label:{
        distanceInfo:{
          perimeter:totalDistanceLabelManager.tempTotalDistanceLabel.distanceInfo.distance,
          formattedPerimeterStr:totalDistanceLabelManager.tempTotalDistanceLabel.distanceInfo.formattedDistanceStr
        },
      },
      polylineState:{
        lngLatAltArray: dynamicPolylineState.lngLatAltArray,
        pointCount: dynamicPolylineState.pointCount,
      },
      segmentDistancesState:{...segmentDistancesState}
    }

    distanceMeasurementStore.addFinishedSelection(distanceMeasurementData)

    drawingToolStore.setOperationType('none');
  }

  const cloneSurveyPointsAndLabelsToDataSource=(dataSource: Cesium.CustomDataSource,uniqueId:string):void=>{
    for (let i:number = 0; i < activeDistanceSurvey.segmentDistanceLabels.length; i++) {
      const oldPointEntity:Cesium.Entity = activeDistanceSurvey.surveyPoints[i];
      const oldLabelEntity:Cesium.Entity = activeDistanceSurvey.segmentDistanceLabels[i];
      const pointUniqueId:string = generateBizUniqueId('pointLabelEntity');
      const labelUniqueId:string = generateBizUniqueId('LabelEntity');

      // --- A. 克隆 Point (创建新对象) ---
      if (oldPointEntity) {
        const pointCloneConfig:Cesium.Entity.ConstructorOptions = cloneEntityAsConfig(oldPointEntity, pointUniqueId,viewer);
        // const pointOriginalFillColor=pointCloneConfig.properties.label.originalFillColor
        pointCloneConfig.properties={
          type:'surveyPoint',
          sourceType:'distanceMeasurement',
          operationType:'distanceMeasurement',
          dataSourceName:uniqueId,
          isDraft:true,
          // label:{
          //   originalFillColor:pointOriginalFillColor,
          // }
        }
        // pointCloneConfig.label.show=false
        // pointCloneConfig.point.show=false
        pointCloneConfig.show=false
        // pointCloneConfig.label.fillColor=Cesium.Color.TRANSPARENT

        dataSource.entities.add(pointCloneConfig);
      }

      // --- B. 克隆 Label (关键：固化 text) ---
      if (oldLabelEntity) {
        const labelCloneConfig:Cesium.Entity.ConstructorOptions = cloneEntityAsConfig(oldLabelEntity, labelUniqueId,viewer);
        // const labelOriginalFillColor=labelCloneConfig.properties.label.originalFillColor

        labelCloneConfig.properties={
          type:'segmentDistanceLabel',
          sourceType:'distanceMeasurement',
          operationType:'distanceMeasurement',
          dataSourceName:uniqueId,
          isDraft:true,
          // label:{
          //   originalFillColor:labelOriginalFillColor,
          // }
        }
        // labelCloneConfig.label.show=false
        labelCloneConfig.show=false
        // labelCloneConfig.label.fillColor=Cesium.Color.TRANSPARENT

        dataSource.entities.add(labelCloneConfig);
      }
    }
    const pointUniqueId:string = generateBizUniqueId('pointLabelEntity');
    const lastPointEntity:Cesium.Entity=activeDistanceSurvey.surveyPoints[dynamicPolylineState.pointCount-1]
    if (lastPointEntity) {
      const lastPointCloneConfig:Cesium.Entity.ConstructorOptions = cloneEntityAsConfig(lastPointEntity, pointUniqueId,viewer);
      // const pointOriginalFillColor=lastPointCloneConfig.properties.label.originalFillColor
      lastPointCloneConfig.properties={
        type:'surveyPoint',
        sourceType:'distanceMeasurement',
        operationType:'distanceMeasurement',
        dataSourceName:uniqueId,
        isDraft:true,
        // label:{
        //   originalFillColor:pointOriginalFillColor,
        // }
      }
      // lastPointCloneConfig.label.show=false
      // lastPointCloneConfig.point.show=false
      lastPointCloneConfig.show=false
      // lastPointCloneConfig.label.fillColor=Cesium.Color.TRANSPARENT
      dataSource.entities.add(lastPointCloneConfig);
    }
  }

  const cleanupActiveDistanceSurvey=()=>{
    activeDistanceSurvey.surveyPoints=[]
    activeDistanceSurvey.segmentDistanceLabels=[]
    viewer.value.dataSources.remove(activeDistanceSurvey.dataSource);

  }

  const handleEsc = () => {
    console.log("ESC pressed - Resetting distance surveying");
    drawingToolStore.setOperationType('none');
  };

  const handleBackspace = () => {
    console.log("Backspace pressed - Removing last point");

    // 回退最后一个坐标点
    if (dynamicPolylineState.pointCount >= 2) {
      const pointEntity:Cesium.Entity|undefined=activeDistanceSurvey.surveyPoints.pop()
      const labelEntity:Cesium.Entity|undefined=activeDistanceSurvey.segmentDistanceLabels.pop()
      activeDistanceSurvey.dataSource.entities.remove(pointEntity)
      activeDistanceSurvey.dataSource.entities.remove(labelEntity)

      dynamicPolylineState.lngLatAltArray.splice((dynamicPolylineState.pointCount-1) * 3, 3);
      dynamicPolylineState.positions=Cesium.Cartesian3.fromDegreesArrayHeights(dynamicPolylineState.lngLatAltArray)


      segmentDistancesState.distances.pop()

      // 删除最后三个元素 (lon, lat, alt)
      dynamicPolylineState.pointCount--;
      updateSegmentDistanceLabel();
      totalDistanceLabelManager.updateTempTotalDistanceLabel();
    }
  };

  // 仅在距离测绘模式下监听键盘事件
  const { unbindKeyboardEvents } = useKeyboardEvents(
    handleEsc,
    handleBackspace,
    () => drawingToolStore.drawingToolForm.operationType === 'distanceMeasurement'
  );

  onUnmounted(() => {
    unwatchDrawingToolForm?.()
    unbindKeyboardEvents();
  })

  return {
    distanceMeasurement,
    confirmSurveyPoint,
    setupDrawingToolWatch,
    finishDistanceSurvey,
  }
}
