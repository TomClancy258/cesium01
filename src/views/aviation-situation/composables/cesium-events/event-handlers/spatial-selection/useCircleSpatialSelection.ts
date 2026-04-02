// src/views/aviation-situation/composables/cesium-events/event-handlers/spatial-selection/useCircleSpatialSelection.ts
import * as Cesium from 'cesium'
import { onUnmounted, ShallowRef, watch } from 'vue'
import { type SpatialSelectForm, useSpatialSelectStore } from '@/stores/spatialSelect'
import { generateBizUniqueId } from '@/utils/uuid'
import type {
  TempPointLabelPosition,
  TempPointLabelPositionLngLatAlt
} from '../shared/useMouseFollowPointLabel'
import { useKeyboardEvents } from '../useKeyboardEvents';
import {
  calculateAreaFromGraphic,
  calculatePerimeterFromGraphic,
  calculateSurfaceDistance, createCircleFromCenterAndRadius, formatArea, formatDistance,
} from '@/utils/geoUtils'
import { DrawingDataSource, LngLatAlt,SpatialSelectionData } from '@/views/aviation-situation/types/shared'
import {
  BOX_SELECTION_STYLE, TEMP_POINT_LABEL_STYLE, TEMP_TOTAL_LENGTH_LABEL_STYLE
} from '@/views/aviation-situation/constants/cesiumStyleConstants'
import { cloneEntityAsConfig } from '@/utils/cesiumUtils'
import { EntityProperties } from '@/views/aviation-situation/types/entity'

import {useMeasurementSelectionStore} from "@/stores/drawingToolSelection"
import {
  emitCesiumEvent, onCesiumEvent
} from '@/views/aviation-situation/composables/mittBus'

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
  radius:number|Cesium.CallbackProperty=1,
  text:string|Cesium.CallbackProperty,
  position: Cesium.Cartesian3 | Cesium.CallbackProperty | null = null
):Cesium.Entity.ConstructorOptions => {
  const baseConfig: Cesium.Entity.ConstructorOptions = {
    show: true,
    label: {
      font: TEMP_POINT_LABEL_STYLE.LABEL.FONT,
      outlineColor: TEMP_POINT_LABEL_STYLE.LABEL.OUTLINE_COLOR,
      outlineWidth: TEMP_POINT_LABEL_STYLE.LABEL.OUTLINE_WIDTH,
      style: TEMP_POINT_LABEL_STYLE.LABEL.STYLE,
      pixelOffset: TEMP_TOTAL_LENGTH_LABEL_STYLE.LABEL.PIXEL_OFFSET,
      // verticalAlignment: 'top',
      // horizontalAlignment : 'center',
      heightReference: TEMP_POINT_LABEL_STYLE.LABEL.HEIGHT_REFERENCE,
      disableDepthTestDistance: Number.POSITIVE_INFINITY, // 补充防遮挡配置（常量里漏了的话）
    },
    point: {
      pixelSize: TEMP_POINT_LABEL_STYLE.POINT.PIXEL_SIZE,
      color: TEMP_POINT_LABEL_STYLE.POINT.COLOR,
      outlineColor: TEMP_POINT_LABEL_STYLE.POINT.OUTLINE_COLOR,
      outlineWidth: TEMP_POINT_LABEL_STYLE.POINT.OUTLINE_WIDTH,
      heightReference: TEMP_POINT_LABEL_STYLE.POINT.HEIGHT_REFERENCE,
    },
    ellipse: {
      semiMinorAxis: radius,
      semiMajorAxis: radius,
      material: BOX_SELECTION_STYLE.ELLIPSE.MATERIAL,
      outlineWidth : BOX_SELECTION_STYLE.ELLIPSE.OUTLINE_WIDTH,
      outline: BOX_SELECTION_STYLE.ELLIPSE.OUTLINE,
      outlineColor:BOX_SELECTION_STYLE.ELLIPSE.OUTLINE_COLOR,
      height:BOX_SELECTION_STYLE.ELLIPSE.HEIGHT
    },
  };
  // 动态/静态文本、位置单独赋值
  if (position) baseConfig.position = position;
  if (text) baseConfig.label.text = text;

  return baseConfig;
};

export const useCircleSpatialSelection = (viewer: ShallowRef<Cesium.Viewer | null>,mouseFollowPointLabelManager) => {
  const measurementSelectionStore=useMeasurementSelectionStore()
  const spatialSelectStore = useSpatialSelectStore()

  // const circleEntities: Cesium.Entity[] = []
  // const circleMap: Map<string,Cesium.Entity>=new Map<string, Cesium.Entity>()
  let dynamicCircle:Cesium.Entity|null= null

  let dynamicCircleState: DynamicCircleState = {
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
      radius:1,
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

    updateDynamicCircle();
  }

  const updateDynamicCircle = () => {
    const lngLatAlt:LngLatAlt  = mouseFollowPointLabelManager.tempPointLabel.position.lngLatAlt;

    if (dynamicCircleState.pointCount===1) {
      const lngLatAltArray=dynamicCircleState.lngLatAltArray

      lngLatAltArray[3]=lngLatAlt.longitude
      lngLatAltArray[4]=lngLatAlt.latitude
      lngLatAltArray[5]=lngLatAlt.height

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
      dynamicCircleState.radiusInfo.radius=radius;
      dynamicCircleState.radiusInfo.formattedRadiusStr=formatDistance(radius);

      const circle= createCircleFromCenterAndRadius(startPoint,radius)

      const perimeter=calculatePerimeterFromGraphic(circle)
      dynamicCircleState.perimeterInfo.perimeter=perimeter;
      dynamicCircleState.perimeterInfo.formattedPerimeterStr=formatDistance(perimeter);

      const area=calculateAreaFromGraphic(circle)
      dynamicCircleState.areaInfo.area=area;
      dynamicCircleState.areaInfo.formattedAreaStr=formatArea(area);

      // const textStr=`周长：${dynamicCircleState.perimeterInfo.formattedPerimeterStr}\n
      // 面积：${dynamicCircleState.areaInfo.formattedAreaStr}\n
      // 半径：${dynamicCircleState.radiusInfo.formattedRadiusStr}`;
      //
      // dynamicCircle.label.text=textStr;

      const spatialSelectionTarget:string=spatialSelectStore.spatialSelectForm.spatialSelectionTarget

      const spatialSelectionData:SpatialSelectionData={
        dataSourceName:dynamicCircle.id,
        sourceType: 'circleSpatialSelection',
        type:'ellipse',
        // radius:radius,
        label:{
          radiusInfo:{
            radius:radius
          }
        },
        centerLngLatAltArray:startPoint,
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
    if (dynamicCircleState.pointCount >= 2) {
      return
    }
    const position:TempPointLabelPosition=mouseFollowPointLabelManager.tempPointLabel.position
    const lngLatAlt: LngLatAlt =position.lngLatAlt;
    const cartesian3: Cesium.Cartesian3 =position.cartesian3;

    dynamicCircleState.lngLatAltArray.push(lngLatAlt.longitude, lngLatAlt.latitude, lngLatAlt.height)
    dynamicCircleState.pointCount++

    if (dynamicCircleState.pointCount === 1) {
      dynamicCircle.position=cartesian3
    }
  }

  const initActiveCircleSpatialSelection = (): void => {
    const circleUniqueId:string = generateBizUniqueId('activeCircleSpatialSelection')

    const drawingDataSourceData:DrawingDataSource={
      name:circleUniqueId
    }
    measurementSelectionStore.setDrawingDataSource(drawingDataSourceData)

    // 2. 创建动态位置的CallbackProperty
    const radiusCallback:Cesium.CallbackProperty = new Cesium.CallbackProperty(
      () => {
          return dynamicCircleState.radiusInfo.radius;
      },
      false,
    );
    // 2. 创建动态位置的CallbackProperty
    const textCallback:Cesium.CallbackProperty = new Cesium.CallbackProperty(
      ():string => {
        return `周长：${dynamicCircleState.perimeterInfo.formattedPerimeterStr}\n
      面积：${dynamicCircleState.areaInfo.formattedAreaStr}\n
      半径：${dynamicCircleState.radiusInfo.formattedRadiusStr}`;
      },
      false,
    );

    // const textStr=`周长：${dynamicCircleState.perimeterInfo.formattedPerimeterStr}\n
    //   面积：${dynamicCircleState.areaInfo.formattedAreaStr}\n
    //   半径：${dynamicCircleState.radiusInfo.formattedRadiusStr}`;

    const circleConfig:Cesium.Entity.ConstructorOptions = createDynamicCircleConfig(radiusCallback,textCallback);
    // 4. 组装实体并添加
    dynamicCircle = viewer.value.entities.add({
      id: circleUniqueId,
      properties: {
        operationType:'spatialSelection',
        sourceType: 'circleSpatialSelection',
        type: 'ellipse',
        dataSourceName: circleUniqueId,
        originalEllipseMaterial:circleConfig.ellipse?.material,
        label:{
          originalFillColor:circleConfig.label?.fillColor
        },
        ellipse:{
          originalMaterial:circleConfig.ellipse?.material,
        }
      },
      ...circleConfig,
    });
  }

  const cloneDynamicCircleToDataSource=(dataSourceName:string)=>{
    // const uniqueId:string = generateBizUniqueId('circleSpatialSelectionCircle')

    const circleConfig:Cesium.Entity.ConstructorOptions = cloneEntityAsConfig(dynamicCircle,dataSourceName,viewer);

    circleConfig.label.text=`周长：${dynamicCircleState.perimeterInfo.formattedPerimeterStr}\n
      面积：${dynamicCircleState.areaInfo.formattedAreaStr}\n
      半径：${dynamicCircleState.radiusInfo.formattedRadiusStr}`

    circleConfig.ellipse.semiMajorAxis=dynamicCircleState.radiusInfo.radius
    circleConfig.ellipse.semiMinorAxis=dynamicCircleState.radiusInfo.radius

    // const originalFillColor=circleConfig.properties.label.originalFillColor

    const properties={
      operationType:'spatialSelection',
      sourceType: 'circleSpatialSelection',
      type: 'ellipse',
      dataSourceName: dataSourceName,
      originalCircleMaterial:circleConfig.ellipse?.material,
      // label:{
      //   originalFillColor:originalFillColor,
      // },
      ellipse:{
        originalMaterial:circleConfig.ellipse?.material,
      }
    } as EntityProperties

    // circleConfig.show=false
    circleConfig.point.show=false
    circleConfig.label.show=false
    circleConfig.ellipse.outline=false

    // circleConfig.label.fillColor=Cesium.Color.TRANSPARENT

    // 4. 组装实体并添加
    const entity=viewer.value.entities.add({
      id: dataSourceName,
      properties,
      ...circleConfig, // 复用通用样式，消除重复代码
    });

    // circleEntities.push(entity)
    // circleMap.set(uniqueId,entity)

  }

  /**
   * 重置计划轨迹
   */
  const resetDynamicCircleState = (): void => {
    dynamicCircleState={
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
        radius:1,
        formattedRadiusStr:'',
      },
    };
  }

  const resetCircleSpatialSelectionSession=()=>{
    viewer.value?.entities.remove(dynamicCircle);
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
    if (dynamicCircleState.pointCount <=1) {
      return
    }

    const uniqueId:string = generateBizUniqueId('circleSpatialSelectionCircle')
    // const newDataSource:Cesium.CustomDataSource=new Cesium.CustomDataSource(uniqueId)
    cloneDynamicCircleToDataSource(uniqueId)

    const lngLatAltArray=dynamicCircleState.lngLatAltArray
    const center:LngLatAlt=[
      lngLatAltArray[0],
      lngLatAltArray[1],
      lngLatAltArray[2],
    ]

    // const circle:turf.Feature<turf.Polygon>=createCircleFromCenterAndRadius(center,dynamicCircleState.radiusInfo.radius)

    const spatialSelectionTarget:string=spatialSelectStore.spatialSelectForm.spatialSelectionTarget

    const spatialSelectionData:SpatialSelectionData={
      dataSourceName:uniqueId,
      sourceType: 'circleSpatialSelection',
      type:'ellipse',
      // graphic:circle,
      isActive:false,
      centroidLngLatAlt: {
        longitude:lngLatAltArray[0],
        latitude:lngLatAltArray[1],
        height: lngLatAltArray[2]
      },
      centerLngLatAltArray:center,
      aircraft:{
        icao24Set:new Set<string>(spatialSelectStore.activeSpatialSelection.aircraft.icao24Set)
      },
      airport:{
        icaoSet:new Set<string>(spatialSelectStore.activeSpatialSelection.airport.icaoSet)
      },
      spatialSelectionTarget:spatialSelectStore.spatialSelectForm.spatialSelectionTarget,
      label:{
        perimeterInfo:{
          perimeter:dynamicCircleState.perimeterInfo.perimeter,
          formattedPerimeterStr:dynamicCircleState.perimeterInfo.formattedPerimeterStr
        },
        areaInfo:{
          area:dynamicCircleState.areaInfo.area,
          formattedAreaStr:dynamicCircleState.areaInfo.formattedAreaStr
        },
        radiusInfo:{
          radius:dynamicCircleState.radiusInfo.radius,
          formattedRadiusStr:dynamicCircleState.radiusInfo.formattedRadiusStr
        },
      },
    }
    if (spatialSelectionTarget === 'aircraft') {
      emitCesiumEvent('aircraftSpatialSelect',spatialSelectionData)
    }
    else if(spatialSelectionTarget === 'airport') {
      emitCesiumEvent('airportSpatialSelect',spatialSelectionData)
    }else if(spatialSelectionTarget === 'all') {
      emitCesiumEvent('aircraftSpatialSelect',spatialSelectionData)
      emitCesiumEvent('airportSpatialSelect',spatialSelectionData)
    }else if(spatialSelectionTarget === 'measurement') {
      // emitCesiumEvent('aircraftSpatialSelect',spatialSelectionData)
      emitCesiumEvent('airportSpatialSelect',spatialSelectionData)
    }

    spatialSelectStore.setOperationType('none');
  }


  const handleEsc = () => {
    console.log("ESC pressed - Resetting distance surveying");
    emitCesiumEvent('clearAviationActiveSpatialSelection')
    spatialSelectStore.setOperationType('none');
  };

  const handleBackspace = () => {
    console.log("Backspace pressed - Removing last point");

    // 回退最后一个坐标点
    if (dynamicCircleState.pointCount === 2) {
      dynamicCircleState.lngLatAltArray.splice((dynamicCircleState.pointCount - 1) * 3, 3)
      dynamicCircleState.pointCount--

      updateDynamicCircle();
    }
    // if (dynamicCircleState.pointCount === 1) {
    //   const spatialSelectionTarget:string=spatialSelectStore.spatialSelectForm.spatialSelectionTarget
    //
    //   emitCesiumEvent('clearAviationActiveSpatialSelection')
    // }
  };

  // 仅在距离测绘模式下监听键盘事件
  const { unbindKeyboardEvents } = useKeyboardEvents(
    handleEsc,
    handleBackspace,
    () => spatialSelectStore.spatialSelectForm.operationType==='spatialSelection'&&
      spatialSelectStore.spatialSelectForm.spatialSelectionSubtype==='circle'
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
