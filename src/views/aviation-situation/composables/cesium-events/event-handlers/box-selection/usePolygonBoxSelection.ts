// src/views/aviation-situation/composables/cesium-events/event-handlers/box-selection/usePolygonBoxSelection.ts
import * as Cesium from 'cesium'
import { onUnmounted, ShallowRef, watch } from 'vue'
import { type SpatialSelectForm, useSpatialSelectStore } from '@/stores/spatialSelect'
import { generateBizUniqueId } from '@/utils/uuid'
import { type TempPointLabelPositionLngLatAlt } from '../shared/useMouseFollowPointLabel'
import { useKeyboardEvents } from '../useKeyboardEvents';
import {
  calculateSurfaceDistance,
  getSurfaceMidpoint
} from '@/utils/geoUtils'
import { DrawingDataSource, LngLatAlt } from '@/views/aviation-situation/types/shared'
import {
  BOX_SELECTION_STYLE,
} from '@/views/aviation-situation/constants/cesiumStyleConstants'
import { cloneEntityAsConfig } from '@/utils/cesiumUtils'
import { createPolygonFromLngLatAltArray } from '@/utils/geoUtils'
import { EntityProperties } from '@/views/aviation-situation/types/entity'

import {useDynamicSegmentDistanceLabel} from '@/views/aviation-situation/composables/cesium-events/event-handlers/shared/useDynamicSegmentDistanceLabel'

import {useMeasurementSelectionStore} from "@/stores/measurementSelection"
import {
  emitCesiumEvent, onCesiumEvent
} from '@/views/aviation-situation/composables/mittBus'
import * as turf from '@turf/turf'

interface DynamicPolygonState {
  lngLatAltArray: number[]; // 经纬度+海拔数组（3个一组）
  pointCount: number; // 坐标点数量（一组算一个）
  polygonHierarchy: Cesium.PolygonHierarchy;
}

/** 单条距离测绘的完整结构 */
export interface PolygonBoxSelectionSession {
  dataSource: Cesium.CustomDataSource|null
  surveyPoints: Cesium.Entity[]
  segmentDistanceLabels: Cesium.Entity[]
  dynamicPolygon: Cesium.Entity|null
}

/**
 * 创建线段长度Label的样式配置（仅Label，无Point）
 * @param positions 实体位置（静态坐标/CallbackProperty）
 * @returns Polyline样式配置
 */
const createDynamicPolygonConfig = (
  positions: Cesium.Cartesian3[] | Cesium.CallbackProperty | null = null
):Cesium.Entity.ConstructorOptions => {
  const baseConfig: Cesium.Entity.ConstructorOptions = {
    show: true,
    polygon: {
      outlineWidth: BOX_SELECTION_STYLE.POLYGON.OUTLINE_WIDTH,
      outlineColor:BOX_SELECTION_STYLE.POLYGON.OUTLINE_COLOR,
      material: BOX_SELECTION_STYLE.POLYGON.MATERIAL,
      arcType: BOX_SELECTION_STYLE.POLYGON.ARC_TYPE,
    },
  };
  // 动态/静态文本、位置单独赋值
  if (positions) baseConfig.polygon.hierarchy = positions;

  return baseConfig;
};

export const usePolygonBoxSelection = (viewer: ShallowRef<Cesium.Viewer | null>,mouseFollowPointLabelManager,perimeterAndAreaLabel) => {
  const measurementSelectionStore=useMeasurementSelectionStore()
  const lastButOneDynamicSegmentLengthLabel=useDynamicSegmentDistanceLabel(viewer,'lastButOnePolygonBoxSelectionDynamicSegmentLengthLabel')
  const lastDynamicSegmentLengthLabel=useDynamicSegmentDistanceLabel(viewer,'lastPolygonBoxSelectionDynamicSegmentLengthLabel')

  const spatialSelectStore = useSpatialSelectStore()
  //存放全部距离测绘折线（可以绘制多条）的数组
  const polygonBoxSelectionDataSources: Cesium.CustomDataSource[] = []
  const activePolygonBoxSelection: PolygonBoxSelectionSession = {
    //该距离测绘折线的全部
    dataSource: null,
    surveyPoints:[],
    segmentDistanceLabels:[],
    //该距离测绘的折线
    dynamicPolygon: null,
  }

  const dynamicPolygonState: DynamicPolygonState = {
    lngLatAltArray: [],
    pointCount: 0,
    polygonHierarchy:new Cesium.PolygonHierarchy([])
  };

  const polygonBoxSelection = (cartesian2: Cesium.Cartesian2): void => {
    const ray: Cesium.Ray = viewer.value.camera.getPickRay(cartesian2)
    const cartesian3 :Cesium.Cartesian3 = viewer.value.scene.globe.pick(ray, viewer.value.scene)
    if (!cartesian3) {
      return
    }

    // 复用抽离后的更新逻辑
    mouseFollowPointLabelManager.updateTempPointLabel(cartesian3);

    const lngLatAlt:TempPointLabelPositionLngLatAlt  = mouseFollowPointLabelManager.tempPointLabel.position.lngLatAlt;

    addDynamicLineSegment(lngLatAlt.longitude, lngLatAlt.latitude, lngLatAlt.height);
    updateSegmentDistanceLabel();
  }

  const addDynamicLineSegment = (longitude:number,latitude:number,height:number) => {
    if (dynamicPolygonState.pointCount>=1) {
      const lastPointIndex:number=dynamicPolygonState.pointCount*3
      dynamicPolygonState.lngLatAltArray[lastPointIndex]=longitude
      dynamicPolygonState.lngLatAltArray[lastPointIndex+1]=latitude
      dynamicPolygonState.lngLatAltArray[lastPointIndex+2]=height

      const positions:Cesium.Cartesian3[]=Cesium.Cartesian3.fromDegreesArrayHeights(dynamicPolygonState.lngLatAltArray)
      dynamicPolygonState.polygonHierarchy=new Cesium.PolygonHierarchy(positions)
    }
  }

  const updateSegmentDistanceLabel = () => {
    if (dynamicPolygonState.pointCount>=1) {
      const lastPointIndex:number=dynamicPolygonState.pointCount*3
      const lastPositions:number[]=[
        dynamicPolygonState.lngLatAltArray[lastPointIndex],
        dynamicPolygonState.lngLatAltArray[lastPointIndex+1],
        dynamicPolygonState.lngLatAltArray[lastPointIndex+2],
      ]
      const lastButOnePointIndex:number=(dynamicPolygonState.pointCount-1)*3
      const lastButOnePositions:number[]=[
        dynamicPolygonState.lngLatAltArray[lastButOnePointIndex],
        dynamicPolygonState.lngLatAltArray[lastButOnePointIndex+1],
        dynamicPolygonState.lngLatAltArray[lastButOnePointIndex+2],
      ]

      const firstPositions:number[]=[
        dynamicPolygonState.lngLatAltArray[0],
        dynamicPolygonState.lngLatAltArray[1],
        dynamicPolygonState.lngLatAltArray[2],
      ]

      const lastButOneDistance:number=calculateSurfaceDistance(lastButOnePositions,lastPositions)
      const lastButOneSegmentMidLngLatAlt:LngLatAlt=getSurfaceMidpoint(lastButOnePositions,lastPositions)
      lastButOneDynamicSegmentLengthLabel.updateTempSegmentDistanceLabel(lastButOneSegmentMidLngLatAlt,lastButOneDistance)

      if (dynamicPolygonState.pointCount>=2) {
        const lastDistance:number=calculateSurfaceDistance(firstPositions,lastPositions)
        const lastSegmentMidLngLatAlt:LngLatAlt=getSurfaceMidpoint(firstPositions,lastPositions)
        lastDynamicSegmentLengthLabel.updateTempSegmentDistanceLabel(lastSegmentMidLngLatAlt,lastDistance)

        const polygon:turf.Feature<turf.Polygon>=createPolygonFromLngLatAltArray(dynamicPolygonState.lngLatAltArray)
        perimeterAndAreaLabel.updateTempPerimeterAndAreaLabel(dynamicPolygonState.lngLatAltArray,polygon)

        const boxSelectionTarget:string=spatialSelectStore.spatialSelectForm.boxSelectionTarget
        const boxSelectionData={
          dataSourceName:activePolygonBoxSelection.dataSource.name,
          type:'polygon',
          graphic:polygon,
          isActive: true
        }
        // if (boxSelectionTarget === 'aircraft') {
          emitCesiumEvent('aircraftBoxSelected',boxSelectionData)
        // }
      }
    }
  }

  let unsubAircraftFiltered: () => void;

  const subscribePolygonBoxSelectionEvents = () => {
    unsubAircraftFiltered = onCesiumEvent('aircraftFiltered', () => {
      updateSegmentDistanceLabel()
    });
  }

  const confirmSurveyPoint = () => {
    const pointLabelProperties:EntityProperties={
      operationType:'boxSelection',
      sourceType:'polygonBoxSelection',
      type:'tempSurveyPoint',
      dataSourceName:activePolygonBoxSelection.dataSource.name,
    }
    const lngLatAlt: TempPointLabelPositionLngLatAlt =mouseFollowPointLabelManager.addTempPointLabelToDataSource(activePolygonBoxSelection,pointLabelProperties)

    dynamicPolygonState.lngLatAltArray.push(lngLatAlt.longitude, lngLatAlt.latitude, lngLatAlt.height)
    const positions:Cesium.Cartesian3[]=Cesium.Cartesian3.fromDegreesArrayHeights(dynamicPolygonState.lngLatAltArray)
    dynamicPolygonState.polygonHierarchy=new Cesium.PolygonHierarchy(positions)
    dynamicPolygonState.pointCount++

    if (dynamicPolygonState.pointCount >= 2) {
      const properties:EntityProperties={
        operationType:'boxSelection',
        sourceType:'polygonBoxSelection',
        type:'tempSegmentLengthLabel',
        dataSourceName:activePolygonBoxSelection.dataSource.name,
      }
      lastButOneDynamicSegmentLengthLabel.addTempSegmentDistanceLabelToDataSource(activePolygonBoxSelection,properties,true,)
    }
  }

  const initActivePolygonBoxSelection = (): void => {
    const dataSourceUniqueId:string = generateBizUniqueId('activePolygonBoxSelection')
    activePolygonBoxSelection.dataSource=new Cesium.CustomDataSource(dataSourceUniqueId)

    const drawingDataSourceData:DrawingDataSource={
      name:dataSourceUniqueId
    }
    measurementSelectionStore.setDrawingDataSource(drawingDataSourceData)

    addTempSegmentLengthLabels()

    // dynamicPolygonState.positions = Cesium.Cartesian3.fromDegreesArrayHeights(dynamicPolygonState.lngLatAltArray);

    // 2. 创建动态位置的CallbackProperty
    const positionCallback:Cesium.CallbackProperty = new Cesium.CallbackProperty(
      () => {
          return dynamicPolygonState.polygonHierarchy;
      },
      false,
    );

    // 3. 调用通用函数生成Label配置（无Point，仅Label）
    const polygonConfig:Cesium.Entity.ConstructorOptions = createDynamicPolygonConfig(positionCallback);
    const polygonUniqueId:string = generateBizUniqueId('activePolygonBoxSelectionPolyline')

    // 4. 组装实体并添加
    activePolygonBoxSelection.dynamicPolygon = activePolygonBoxSelection.dataSource.entities.add({
      id: polygonUniqueId,
      properties: {
        operationType:'boxSelection',
        sourceType: 'polygonBoxSelection',
        type: 'polygon',
        dataSourceName: dataSourceUniqueId,
        originalPolygonMaterial:polygonConfig.polygon?.material
      },
      ...polygonConfig,
    });

    viewer.value?.dataSources.add(activePolygonBoxSelection.dataSource)
  }

  const cloneDynamicPolygonToDataSource=(dataSource,dataSourceName:string)=>{
    const uniqueId:string = generateBizUniqueId('polygonBoxSelectionPolygon')

    // 2. 创建动态位置的CallbackProperty
    const positions:Cesium.Cartesian3[]=Cesium.Cartesian3.fromDegreesArrayHeights(dynamicPolygonState.lngLatAltArray)

    // 3. 调用通用函数生成Label配置（无Point，仅Label）
    const polygonConfig:Cesium.Entity.ConstructorOptions = createDynamicPolygonConfig(positions);

    // 4. 组装实体并添加
    dataSource.entities.add({
      id: uniqueId,
      properties: {
        operationType:'boxSelection',
        sourceType: 'polygonBoxSelection',
        type: 'polygon',
        dataSourceName: dataSourceName,
        originalPolygonMaterial:polygonConfig.polygon?.material
      } as EntityProperties,
      ...polygonConfig, // 复用通用样式，消除重复代码
    });
  }

  /**
   * 重置计划轨迹
   */
  const resetDynamicPolygonState = (): void => {
    dynamicPolygonState.lngLatAltArray = [];
    dynamicPolygonState.polygonHierarchy = null;
    dynamicPolygonState.pointCount = 0;
  }

  /**
   * 清理鼠标移动时临时追加的坐标点（仅保留用户确认的点）
   * @param polygonState 动态折线状态
   */
  const cleanTempMouseMovePoints = (polygonState: DynamicPolygonState): void => {
    const polygonPositionsLen:number = polygonState.lngLatAltArray.length;
    const polygonPointCount:number = polygonPositionsLen / 3;
    // 若坐标数组长度 = 确认点数 +1（说明有鼠标移动的临时点），则删除最后3个元素
    if (polygonPointCount === polygonState.pointCount + 1) {
      polygonState.lngLatAltArray.splice(polygonState.pointCount * 3, 3);

      const positions:Cesium.Cartesian3[]=Cesium.Cartesian3.fromDegreesArrayHeights(polygonState.lngLatAltArray)
      polygonState.polygonHierarchy=new Cesium.PolygonHierarchy(positions)
    }
  };

  let unwatchSpatialSelectForm: () => void
  const setupSpatialSelectFormWatch = (): void => {
    unwatchSpatialSelectForm = watch(
      () => spatialSelectStore.spatialSelectForm,
      (newForm: SpatialSelectForm, oldForm: SpatialSelectForm) => {
        if (newForm.operationType === 'boxSelection'&&newForm.boxSelectionSubtype === 'polygon') {
          initActivePolygonBoxSelection()
        } else {
          removeTempSegmentDistanceLabels()
          cleanupActivePolygonBoxSelection()
          resetDynamicPolygonState()
        }
      },
      {
        deep: true,
      },
    )
  }

  const finishPolygonBoxSelection=(): void => {
    if (dynamicPolygonState.pointCount <=2) {
      return
    }

    cleanTempMouseMovePoints(dynamicPolygonState);

    const uniqueId:string = generateBizUniqueId('polygonBoxSelectionDataSource')
    const newDataSource:Cesium.CustomDataSource=new Cesium.CustomDataSource(uniqueId)
    cloneDynamicPolygonToDataSource(newDataSource,uniqueId) //多边形，存放在dataSource.entities里的index=0的位置

    const PerimeterAndAreaLabelProperties:EntityProperties={
      operationType:'boxSelection',
      sourceType:'polygonBoxSelection',
      type:'perimeterAndAreaLabel',
      dataSourceName:uniqueId,
    }

    const polygon:turf.Feature<turf.Polygon>=createPolygonFromLngLatAltArray(dynamicPolygonState.lngLatAltArray)
    perimeterAndAreaLabel.addTempPerimeterAndAreaLabelToDataSource(newDataSource,dynamicPolygonState.lngLatAltArray,PerimeterAndAreaLabelProperties,polygon); //周长和面积Label，存放在dataSource.entities里的index=1的位置


    const surveyPointProperties:EntityProperties={
      operationType:'boxSelection',
      sourceType:'polygonBoxSelection',
      type:'surveyPoint',
      dataSourceName:activePolygonBoxSelection.dataSource?.name,
    }
    lastDynamicSegmentLengthLabel.addTempSegmentDistanceLabelToDataSource(activePolygonBoxSelection,surveyPointProperties,true,)
    cloneSurveyPointsAndLabelsToDataSource(newDataSource,uniqueId)

    polygonBoxSelectionDataSources.push(newDataSource);
    viewer.value?.dataSources.add(newDataSource)
    spatialSelectStore.setOperationType('none');

    const boxSelectionData={
      dataSourceName:uniqueId,
      type:'polygon',
      graphic:polygon,
      isActive:false
    }
    // if (boxSelectionTarget === 'aircraft') {
    emitCesiumEvent('aircraftBoxSelected',boxSelectionData)
    // }
  }

  const cloneSurveyPointsAndLabelsToDataSource=(dataSource: Cesium.CustomDataSource,uniqueId:string):void=>{
    for (let i:number = 0; i < activePolygonBoxSelection.segmentDistanceLabels.length; i++) {
      const oldPointEntity:Cesium.Entity = activePolygonBoxSelection.surveyPoints[i];
      const oldLabelEntity:Cesium.Entity = activePolygonBoxSelection.segmentDistanceLabels[i];
      const pointUniqueId:string = generateBizUniqueId('pointLabelEntity');
      const labelUniqueId:string = generateBizUniqueId('LabelEntity');

      // --- A. 克隆 Point (创建新对象) ---
      if (oldPointEntity) {
        const pointCloneConfig:Cesium.Entity.ConstructorOptions = cloneEntityAsConfig(oldPointEntity, pointUniqueId,viewer);
        const pointOriginalFillColor=pointCloneConfig.properties.label.originalFillColor

        pointCloneConfig.properties={
          type:'surveyPoint',
          sourceType:'polygonBoxSelection',
          operationType:'boxSelection',
          dataSourceName:uniqueId,
          label:{
            originalFillColor:pointOriginalFillColor,
          }
        }
        // pointCloneConfig.label.show=false
        pointCloneConfig.point.show=false
        // pointCloneConfig.show=false

        pointCloneConfig.label.fillColor=Cesium.Color.TRANSPARENT

        dataSource.entities.add(pointCloneConfig);
      }

      // --- B. 克隆 Label (关键：固化 text) ---
      if (oldLabelEntity) {
        const labelCloneConfig:Cesium.Entity.ConstructorOptions = cloneEntityAsConfig(oldLabelEntity, labelUniqueId,viewer);
        const labelOriginalFillColor=labelCloneConfig.properties.label.originalFillColor

        labelCloneConfig.properties={
          type:'segmentLengthLabel',
          sourceType:'polygonBoxSelection',
          operationType:'boxSelection',
          dataSourceName:uniqueId,
          label:{
            originalFillColor:labelOriginalFillColor,
          }
        }
        // labelCloneConfig.label.show=false
        // labelCloneConfig.show=false

        labelCloneConfig.label.fillColor=Cesium.Color.TRANSPARENT
        dataSource.entities.add(labelCloneConfig);
      }
    }
  }

  const cleanupActivePolygonBoxSelection=()=>{
    activePolygonBoxSelection.surveyPoints=[]
    activePolygonBoxSelection.segmentDistanceLabels=[]
    viewer.value.dataSources.remove(activePolygonBoxSelection.dataSource);

  }

  const removeTempSegmentDistanceLabels=()=>{
    lastButOneDynamicSegmentLengthLabel.removeTempSegmentDistanceLabel()
    lastDynamicSegmentLengthLabel.removeTempSegmentDistanceLabel()
  }

  const addTempSegmentLengthLabels=()=>{
    lastButOneDynamicSegmentLengthLabel.addTempSegmentDistanceLabelToViewer()
    lastDynamicSegmentLengthLabel.addTempSegmentDistanceLabelToViewer()
  }

  const handleEsc = () => {
    console.log("ESC pressed - Resetting distance surveying");
    spatialSelectStore.setOperationType('none');
  };

  const handleBackspace = () => {
    console.log("Backspace pressed - Removing last point");

    // 回退最后一个坐标点
    if (dynamicPolygonState.pointCount >= 2) {
      const pointEntity:Cesium.Entity|undefined=activePolygonBoxSelection.surveyPoints.pop()
      const labelEntity:Cesium.Entity|undefined=activePolygonBoxSelection.segmentDistanceLabels.pop()
      activePolygonBoxSelection.dataSource.entities.remove(pointEntity)
      activePolygonBoxSelection.dataSource.entities.remove(labelEntity)

      dynamicPolygonState.lngLatAltArray.splice((dynamicPolygonState.pointCount-1) * 3, 3);
      const positions:Cesium.Cartesian3[]=Cesium.Cartesian3.fromDegreesArrayHeights(dynamicPolygonState.lngLatAltArray)
      dynamicPolygonState.polygonHierarchy=new Cesium.PolygonHierarchy(positions)

      // 删除最后三个元素 (lon, lat, alt)
      dynamicPolygonState.pointCount--;
      updateSegmentDistanceLabel();
    }
  };

  // 仅在距离测绘模式下监听键盘事件
  const { unbindKeyboardEvents } = useKeyboardEvents(
    handleEsc,
    handleBackspace,
    () => spatialSelectStore.spatialSelectForm.operationType==='boxSelection'&&spatialSelectStore.spatialSelectForm.boxSelectionSubtype==='polygon'
  );

  onUnmounted(() => {
    unwatchSpatialSelectForm?.()
    unbindKeyboardEvents();
    unsubAircraftFiltered()
  })

  return {
    polygonBoxSelection,
    confirmSurveyPoint,
    setupSpatialSelectFormWatch,
    finishPolygonBoxSelection,
    subscribePolygonBoxSelectionEvents,
  }
}
