// src/views/aviation-situation/composables/cesium-events/event-handlers/spatial-selection/useCircleSpatialSelection.ts
import * as Cesium from 'cesium'
import { onUnmounted, ShallowRef, watch } from 'vue'
import { type SpatialSelectForm, useSpatialSelectStore } from '@/stores/spatialSelect'
import { generateBizUniqueId } from '@/utils/uuid'
import { type TempPointLabelPositionLngLatAlt } from '../../shared/useMouseFollowPointLabel'
import { useKeyboardEvents } from '../../useKeyboardEvents';
import {
  calculateAreaFromGraphic,
  calculatePerimeterFromGraphic,
  calculateSurfaceDistance, createCircleFromCenterAndRadius, formatArea, formatDistance,
  getSurfaceMidpoint
} from '@/utils/geoUtils'
import { DrawingDataSource, LngLatAlt,SpatialSelectionData } from '@/views/aviation-situation/types/shared'
import {
  BOX_SELECTION_STYLE,
} from '@/views/aviation-situation/constants/cesiumStyleConstants'
import { cloneEntityAsConfig } from '@/utils/cesiumUtils'
import { createCircleFromLngLatAltArray } from '@/utils/geoUtils'
import { EntityProperties } from '@/views/aviation-situation/types/entity'

import {useMeasurementSelectionStore} from "@/stores/measurementSelection"
import {
  emitCesiumEvent, onCesiumEvent
} from '@/views/aviation-situation/composables/mittBus'
import * as turf from '@turf/turf'

export interface PerimeterInfo {
  perimeter: number;
  formattedPerimeterStr: string;
}

export interface AreaInfo {
  area: number;
  formattedAreaStr: string;
}

export interface RadiusInfo {
  radius: number;
  formattedRadiusStr: string;
}

interface DynamicCircleState {
  lngLatAltArray:number[],
  pointCount:number,
  perimeterInfo: PerimeterInfo;
  areaInfo: AreaInfo;
  radiusInfo: RadiusInfo;
}

/** 单条距离测绘的完整结构 */
export interface CircleSpatialSelectionSession {
  dataSource: Cesium.CustomDataSource|null
  surveyPoints: Cesium.Entity[]
  segmentDistanceLabels: Cesium.Entity[]
  dynamicCircle: Cesium.Entity|null
}

/**
 * 创建线段长度Label的样式配置（仅Label，无Point）
 * @param positions 实体位置（静态坐标/CallbackProperty）
 * @returns Polyline样式配置
 */
const createDynamicCircleConfig = (
  radius:number|Cesium.CallbackProperty=0,
  position: Cesium.Cartesian3 | Cesium.CallbackProperty | null = null
):Cesium.Entity.ConstructorOptions => {
  const baseConfig: Cesium.Entity.ConstructorOptions = {
    show: true,
    circle: {
      semiMinorAxis: radius,
      semiMajorAxis: radius,
      material: BOX_SELECTION_STYLE.POLYGON.MATERIAL,
    },
  };
  // 动态/静态文本、位置单独赋值
  if (position) baseConfig.position = position;

  return baseConfig;
};

export const useCircleSpatialSelection = (viewer: ShallowRef<Cesium.Viewer | null>,mouseFollowPointLabelManager) => {
  const measurementSelectionStore=useMeasurementSelectionStore()
  const spatialSelectStore = useSpatialSelectStore()

  const circleEntities: Cesium.Entity[] = []
  const dynamicCircle:Cesium.Entity|null= null

  const dynamicCircleState: DynamicCircleState = {
    lngLatAltArray: [],
    pointCount:0,
    perimeterInfo:{
      perimeter:0,
      formattedPerimeterStr:'',
    },
    areaInfo:{
      area:0,
      formattedAreaStr:'',
    },
    radiusInfo:{
      radius:0,
      formattedRadiusStr:'',
    },
  };

  const circleSpatialSelection = (cartesian2: Cesium.Cartesian2): void => {
    const ray: Cesium.Ray = viewer.value.camera.getPickRay(cartesian2)
    const cartesian3 :Cesium.Cartesian3 = viewer.value.scene.globe.pick(ray, viewer.value.scene)
    if (!cartesian3) {
      return
    }

    // 复用抽离后的更新逻辑
    mouseFollowPointLabelManager.updateTempPointLabel(cartesian3);
    const lngLatAlt:TempPointLabelPositionLngLatAlt  = mouseFollowPointLabelManager.tempPointLabel.position.lngLatAlt;


    updateDynamicCircle(lngLatAlt.longitude, lngLatAlt.latitude, lngLatAlt.height);
  }

  const updateDynamicCircle = (longitude:number,latitude:number,height:number) => {
    if (dynamicCircleState.pointCount===1) {
      dynamicCircleState.lngLatAltArray[3]=longitude
      dynamicCircleState.lngLatAltArray[4]=latitude
      dynamicCircleState.lngLatAltArray[5]=height

      const startPoint = [
        lngLatAltArray[0],
        lngLatAltArray[1],
        lngLatAltArray[2],
      ];
      const endPoint = [
        lngLatAltArray[3],
        lngLatAltArray[4],
        lngLatAltArray[5],
      ];
      const radius = calculateSurfaceDistance(startPoint, endPoint);
      dynamicCircleState.radius=radius;

      const circle= createCircleFromCenterAndRadius(startPoint,radius)

      const perimeter=calculatePerimeterFromGraphic(circle)
      dynamicCircleState.perimeterInfo.perimeter=perimeter;
      dynamicCircleState.perimeterInfo.formattedPerimeterStr=formatDistance(perimeter);

      const area=calculateAreaFromGraphic(circle)
      dynamicCircleState.areaInfo.area=perimeter;
      dynamicCircleState.areaInfo.formattedAreaStr=formatArea(area);

      const spatialSelectionTarget:string=spatialSelectStore.spatialSelectForm.spatialSelectionTarget

      const spatialSelectionData:SpatialSelectionData={
        dataSourceName:activeCircleSpatialSelection.dataSource.name,
        type:'circle',
        graphic:circle,
        isActive: true
      }
      if (spatialSelectionTarget === 'aircraft') {
        emitCesiumEvent('aircraftSpatialSelect',spatialSelectionData)
      }
      else if(spatialSelectionTarget === 'airport') {
        emitCesiumEvent('airportSpatialSelect',spatialSelectionData)
      }else if(spatialSelectionTarget === 'all') {
        emitCesiumEvent('aircraftSpatialSelect',spatialSelectionData)
        emitCesiumEvent('airportSpatialSelect',spatialSelectionData)
      }
    }
  }

  let unsubAircraftFiltered: () => void;

  const subscribeCircleSpatialSelectionEvents = () => {
    unsubAircraftFiltered = onCesiumEvent('aviationFiltered', () => {
      updateDynamicCircle()
    });
  }

  const confirmSurveyPoint = () => {
    const lngLatAlt: TempPointLabelPositionLngLatAlt =mouseFollowPointLabelManager.tempPointLabel.position.lngLatAlt;

    dynamicCircleState.lngLatAltArray.push(lngLatAlt.longitude, lngLatAlt.latitude, lngLatAlt.height)
    dynamicCircleState.pointCount++
  }

  const initActiveCircleSpatialSelection = (): void => {
    const dataSourceUniqueId:string = generateBizUniqueId('activeCircleSpatialSelection')

    const drawingDataSourceData:DrawingDataSource={
      name:dataSourceUniqueId
    }
    measurementSelectionStore.setDrawingDataSource(drawingDataSourceData)

    // 2. 创建动态位置的CallbackProperty
    const radiusCallback:Cesium.CallbackProperty = new Cesium.CallbackProperty(
      () => {
          return dynamicCircleState.radius;
      },
      false,
    );

    const circleConfig:Cesium.Entity.ConstructorOptions = createDynamicCircleConfig(radiusCallback);
    const circleUniqueId:string = generateBizUniqueId('activeCircleSpatialSelectionPolyline')

    // 4. 组装实体并添加
    activeCircleSpatialSelection.dynamicCircle = activeCircleSpatialSelection.dataSource.entities.add({
      id: circleUniqueId,
      properties: {
        operationType:'spatialSelection',
        sourceType: 'circleSpatialSelection',
        type: 'circle',
        dataSourceName: dataSourceUniqueId,
        originalCircleMaterial:circleConfig.circle?.material
      },
      ...circleConfig,
    });

    viewer.value?.dataSources.add(activeCircleSpatialSelection.dataSource)
  }

  const cloneDynamicCircleToDataSource=(dataSource,dataSourceName:string)=>{
    const uniqueId:string = generateBizUniqueId('circleSpatialSelectionCircle')

    // 2. 创建动态位置的CallbackProperty
    const positions:Cesium.Cartesian3[]=Cesium.Cartesian3.fromDegreesArrayHeights(dynamicCircleState.lngLatAltArray)

    // 3. 调用通用函数生成Label配置（无Point，仅Label）
    const circleConfig:Cesium.Entity.ConstructorOptions = createDynamicCircleConfig(positions);

    // 4. 组装实体并添加
    dataSource.entities.add({
      id: uniqueId,
      properties: {
        operationType:'spatialSelection',
        sourceType: 'circleSpatialSelection',
        type: 'circle',
        dataSourceName: dataSourceName,
        originalCircleMaterial:circleConfig.circle?.material
      } as EntityProperties,
      ...circleConfig, // 复用通用样式，消除重复代码
    });
  }

  /**
   * 重置计划轨迹
   */
  const resetDynamicCircleState = (): void => {
    dynamicCircleState.lngLatAltArray = [];
    dynamicCircleState.circleHierarchy = new Cesium.CircleHierarchy([]);
    dynamicCircleState.pointCount = 0;
  }

  /**
   * 清理鼠标移动时临时追加的坐标点（仅保留用户确认的点）
   * @param circleState 动态折线状态
   */
  const cleanTempMouseMovePoints = (circleState: DynamicCircleState): void => {
    const circlePositionsLen:number = circleState.lngLatAltArray.length;
    const circlePointCount:number = circlePositionsLen / 3;
    // 若坐标数组长度 = 确认点数 +1（说明有鼠标移动的临时点），则删除最后3个元素
    if (circlePointCount === circleState.pointCount + 1) {
      circleState.lngLatAltArray.splice(circleState.pointCount * 3, 3);

      const positions:Cesium.Cartesian3[]=Cesium.Cartesian3.fromDegreesArrayHeights(circleState.lngLatAltArray)
      circleState.circleHierarchy=new Cesium.CircleHierarchy(positions)
    }
  };

  const resetCircleSpatialSelectionSession=()=>{
    cleanupActiveCircleSpatialSelection()
    resetDynamicCircleState()
  }

  let unwatchSpatialSelectForm: () => void
  const setupSpatialSelectFormWatch = (): void => {
    unwatchSpatialSelectForm = watch(
      () => spatialSelectStore.spatialSelectForm,
      (newForm: SpatialSelectForm, oldForm: SpatialSelectForm) => {
        if (newForm.operationType === 'spatialSelection'&&newForm.spatialSelectionSubtype === 'circle') {
          resetCircleSpatialSelectionSession()
          initActiveCircleSpatialSelection()
        } else {
          resetCircleSpatialSelectionSession()
          emitCesiumEvent('clearAviationActiveSpatialSelection')
        }
      },
      {
        deep: true,
      },
    )
  }

  const finishCircleSpatialSelection=(): void => {
    if (dynamicCircleState.pointCount <=2) {
      return
    }

    cleanTempMouseMovePoints(dynamicCircleState);

    const uniqueId:string = generateBizUniqueId('circleSpatialSelectionDataSource')
    const newDataSource:Cesium.CustomDataSource=new Cesium.CustomDataSource(uniqueId)
    cloneDynamicCircleToDataSource(newDataSource,uniqueId) //多边形，存放在dataSource.entities里的index=0的位置

    const PerimeterAndAreaLabelProperties:EntityProperties={
      operationType:'spatialSelection',
      sourceType:'circleSpatialSelection',
      type:'perimeterAndAreaLabel',
      dataSourceName:uniqueId,
    }

    const circle:turf.Feature<turf.Circle>=createCircleFromLngLatAltArray(dynamicCircleState.lngLatAltArray)
    perimeterAndAreaLabel.addTempPerimeterAndAreaLabelToDataSource(newDataSource,dynamicCircleState.lngLatAltArray,PerimeterAndAreaLabelProperties,circle); //周长和面积Label，存放在dataSource.entities里的index=1的位置


    const surveyPointProperties:EntityProperties={
      operationType:'spatialSelection',
      sourceType:'circleSpatialSelection',
      type:'surveyPoint',
      dataSourceName:activeCircleSpatialSelection.dataSource?.name,
    }
    lastDynamicSegmentLengthLabel.addTempSegmentDistanceLabelToDataSource(activeCircleSpatialSelection,surveyPointProperties,true,)
    cloneSurveyPointsAndLabelsToDataSource(newDataSource,uniqueId)

    circleSpatialSelectionDataSources.push(newDataSource);
    viewer.value?.dataSources.add(newDataSource)

    const spatialSelectionTarget:string=spatialSelectStore.spatialSelectForm.spatialSelectionTarget

    const spatialSelectionData={
      dataSourceName:uniqueId,
      type:'circle',
      graphic:circle,
      isActive:false
    }
    if (spatialSelectionTarget === 'aircraft') {
      emitCesiumEvent('aircraftSpatialSelect',spatialSelectionData)
    }
    else if(spatialSelectionTarget === 'airport') {
      emitCesiumEvent('airportSpatialSelect',spatialSelectionData)
    }else if(spatialSelectionTarget === 'all') {
      emitCesiumEvent('aircraftSpatialSelect',spatialSelectionData)
      emitCesiumEvent('airportSpatialSelect',spatialSelectionData)
    }

    spatialSelectStore.setOperationType('none');
  }

  const cloneSurveyPointsAndLabelsToDataSource=(dataSource: Cesium.CustomDataSource,uniqueId:string):void=>{
    for (let i:number = 0; i < activeCircleSpatialSelection.segmentDistanceLabels.length; i++) {
      const oldPointEntity:Cesium.Entity = activeCircleSpatialSelection.surveyPoints[i];
      const oldLabelEntity:Cesium.Entity = activeCircleSpatialSelection.segmentDistanceLabels[i];
      const pointUniqueId:string = generateBizUniqueId('pointLabelEntity');
      const labelUniqueId:string = generateBizUniqueId('LabelEntity');

      // --- A. 克隆 Point (创建新对象) ---
      if (oldPointEntity) {
        const pointCloneConfig:Cesium.Entity.ConstructorOptions = cloneEntityAsConfig(oldPointEntity, pointUniqueId,viewer);
        const pointOriginalFillColor=pointCloneConfig.properties.label.originalFillColor

        pointCloneConfig.properties={
          type:'surveyPoint',
          sourceType:'circleSpatialSelection',
          operationType:'spatialSelection',
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
          sourceType:'circleSpatialSelection',
          operationType:'spatialSelection',
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

  const cleanupActiveCircleSpatialSelection=()=>{
    activeCircleSpatialSelection.surveyPoints=[]
    activeCircleSpatialSelection.segmentDistanceLabels=[]
    viewer.value.dataSources.remove(activeCircleSpatialSelection.dataSource);

  }

  const handleEsc = () => {
    console.log("ESC pressed - Resetting distance surveying");
    emitCesiumEvent('clearAviationActiveSpatialSelection')
    spatialSelectStore.setOperationType('none');
  };

  const handleBackspace = () => {
    console.log("Backspace pressed - Removing last point");

    // 回退最后一个坐标点
    if (dynamicCircleState.pointCount >= 2) {
      const pointEntity: Cesium.Entity | undefined = activeCircleSpatialSelection.surveyPoints.pop()
      const labelEntity: Cesium.Entity | undefined =
        activeCircleSpatialSelection.segmentDistanceLabels.pop()
      activeCircleSpatialSelection.dataSource.entities.remove(pointEntity)
      activeCircleSpatialSelection.dataSource.entities.remove(labelEntity)

      dynamicCircleState.lngLatAltArray.splice((dynamicCircleState.pointCount - 1) * 3, 3)
      const positions: Cesium.Cartesian3[] = Cesium.Cartesian3.fromDegreesArrayHeights(
        dynamicCircleState.lngLatAltArray,
      )
      dynamicCircleState.circleHierarchy = new Cesium.CircleHierarchy(positions)

      // 删除最后三个元素 (lon, lat, alt)
      dynamicCircleState.pointCount--
      updateDynamicCircle()
    }
    if (dynamicCircleState.pointCount === 1) {
      const spatialSelectionTarget:string=spatialSelectStore.spatialSelectForm.spatialSelectionTarget

      emitCesiumEvent('clearAviationActiveSpatialSelection')
    }
  };

  // 仅在距离测绘模式下监听键盘事件
  const { unbindKeyboardEvents } = useKeyboardEvents(
    handleEsc,
    handleBackspace,
    () => spatialSelectStore.spatialSelectForm.operationType==='spatialSelection'&&spatialSelectStore.spatialSelectForm.spatialSelectionSubtype==='circle'
  );

  onUnmounted(() => {
    unwatchSpatialSelectForm?.()
    unbindKeyboardEvents();
    unsubAircraftFiltered()
  })

  return {
    circleSpatialSelection,
    confirmSurveyPoint,
    setupSpatialSelectFormWatch,
    finishCircleSpatialSelection,
    subscribeCircleSpatialSelectionEvents,
  }
}
