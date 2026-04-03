// src/views/aviation-situation/composables/cesium-events/event-handlers/spatial-selection/useHemisphereSpatialSelection.ts
import * as Cesium from 'cesium'
import { onUnmounted, ShallowRef, watch } from 'vue'
import { type SpatialSelectForm, useSpatialSelectStore } from '@/stores/spatialSelect'
import { generateBizUniqueId } from '@/utils/uuid'
import type {
  TempPointLabelPosition,
} from '../shared/useMouseFollowPointLabel'
import { useKeyboardEvents } from '../useKeyboardEvents';
import {
  calculateAreaFromGraphic,
  calculatePerimeterFromGraphic,
  calculateSurfaceDistance, createCircleFromCenterAndRadius, formatArea, formatDistance,
} from '@/utils/geoUtils'
import {
  type ClearAviationSpatialSelectionData,
  DrawingDataSource,
  LngLatAlt,
  SpatialSelectionData
} from '@/views/aviation-situation/types/shared'
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
  radii: Cesium.Cartesian3;
  formattedRadiusStr: string;
}

interface DynamicHemisphereState {
  lngLatAltArray:number[],
  pointCount:number,
  perimeterInfo: PerimeterInfo;
  areaInfo: AreaInfo;
  radiusInfo: RadiusInfo;
}

/** 单条距离测绘的完整结构 */
export interface HemisphereSpatialSelectionSession {
  dataSource: Cesium.CustomDataSource|null
  surveyPoints: Cesium.Entity[]
  segmentDistanceLabels: Cesium.Entity[]
  dynamicHemisphere: Cesium.Entity|null
}

/**
 * 创建线段长度Label的样式配置（仅Label，无Point）
 * @param positions 实体位置（静态坐标/CallbackProperty）
 * @returns Polyline样式配置
 */
const createDynamicHemisphereConfig = (
  radii:Cesium.Cartesian3|Cesium.CallbackProperty,
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
    ellipsoid: {
      radii: radii,
      material: BOX_SELECTION_STYLE.ELLIPSOID.MATERIAL,
      outline: BOX_SELECTION_STYLE.ELLIPSOID.OUTLINE,
      outlineColor: BOX_SELECTION_STYLE.ELLIPSOID.OUTLINE_COLOR,
      minimumCone: BOX_SELECTION_STYLE.ELLIPSOID.MINIMUM_CONE,   // 顶部
      maximumCone: BOX_SELECTION_STYLE.ELLIPSOID.MAXIMUM_CONE,  // 赤道，只保留上半球
      heightReference: BOX_SELECTION_STYLE.ELLIPSOID.HEIGHT_REFERENCE,
    },
  };
  // 动态/静态文本、位置单独赋值
  if (position) baseConfig.position = position;
  if (text) baseConfig.label.text = text;

  return baseConfig;
};

export const useHemisphereSpatialSelection = (viewer: ShallowRef<Cesium.Viewer | null>,mouseFollowPointLabelManager) => {
  const measurementSelectionStore=useMeasurementSelectionStore()
  const spatialSelectStore = useSpatialSelectStore()

  // const hemisphereEntities: Cesium.Entity[] = []
  const hemisphereMap: Map<string,Cesium.Entity>=new Map<string, Cesium.Entity>()
  let dynamicHemisphere:Cesium.Entity|null= null

  let dynamicHemisphereState: DynamicHemisphereState = {
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
      radii:new Cesium.Cartesian3(0,0,0),
      formattedRadiusStr:'',
    },
  };

  const hemisphereSpatialSelection = (cartesian2: Cesium.Cartesian2): void => {
    const ray: Cesium.Ray = viewer.value.camera.getPickRay(cartesian2)
    const cartesian3 :Cesium.Cartesian3 = viewer.value.scene.globe.pick(ray, viewer.value.scene)
    if (!cartesian3) {
      return
    }

    // 复用抽离后的更新逻辑
    mouseFollowPointLabelManager.updateTempPointLabel(cartesian3);

    updateDynamicHemisphere();
  }

  const updateDynamicHemisphere = () => {
    const lngLatAlt:LngLatAlt = mouseFollowPointLabelManager.tempPointLabel.position.lngLatAlt;

    if (dynamicHemisphereState.pointCount===1) {
      const lngLatAltArray=dynamicHemisphereState.lngLatAltArray

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
      dynamicHemisphereState.radiusInfo.radius=radius;
      dynamicHemisphereState.radiusInfo.radii.x = radius
      dynamicHemisphereState.radiusInfo.radii.y = radius
      dynamicHemisphereState.radiusInfo.radii.z = radius
      dynamicHemisphereState.radiusInfo.formattedRadiusStr=formatDistance(radius);

      const circle= createCircleFromCenterAndRadius(startPoint,radius)

      const perimeter=calculatePerimeterFromGraphic(circle)
      dynamicHemisphereState.perimeterInfo.perimeter=perimeter;
      dynamicHemisphereState.perimeterInfo.formattedPerimeterStr=formatDistance(perimeter);

      const area=calculateAreaFromGraphic(circle)
      dynamicHemisphereState.areaInfo.area=area;
      dynamicHemisphereState.areaInfo.formattedAreaStr=formatArea(area);

      const spatialSelectionTarget:string=spatialSelectStore.spatialSelectForm.spatialSelectionTarget

      const spatialSelectionData:SpatialSelectionData={
        dataSourceName:dynamicHemisphere.id,
        sourceType: 'hemisphereSpatialSelection',
        type:'ellipsoid',
        radius:radius,
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

  const subscribeHemisphereSpatialSelectionEvents = () => {
    unsubAircraftFiltered = onCesiumEvent('aviationFiltered', () => {
      updateDynamicHemisphere()
    });
  }

  const confirmSurveyPoint = () => {
    if (dynamicHemisphereState.pointCount >= 2) {
      return
    }
    const position:TempPointLabelPosition=mouseFollowPointLabelManager.tempPointLabel.position
    const lngLatAlt: LngLatAlt =position.lngLatAlt;
    const cartesian3: Cesium.Cartesian3 =position.cartesian3;

    dynamicHemisphereState.lngLatAltArray.push(lngLatAlt.longitude, lngLatAlt.latitude, lngLatAlt.height)
    dynamicHemisphereState.pointCount++

    if (dynamicHemisphereState.pointCount === 1) {
      dynamicHemisphere.position=cartesian3
    }
  }

  const initActiveHemisphereSpatialSelection = (): void => {
    const hemisphereUniqueId:string = generateBizUniqueId('activeHemisphereSpatialSelection')

    const drawingDataSourceData:DrawingDataSource={
      name:hemisphereUniqueId
    }
    measurementSelectionStore.setDrawingDataSource(drawingDataSourceData)

    // 2. 创建动态位置的CallbackProperty
    const radiiCallback:Cesium.CallbackProperty = new Cesium.CallbackProperty(
      () => {
          return dynamicHemisphereState.radiusInfo.radii;
      },
      false,
    );
    // 2. 创建动态位置的CallbackProperty
    const textCallback:Cesium.CallbackProperty = new Cesium.CallbackProperty(
      ():string => {
        return `周长：${dynamicHemisphereState.perimeterInfo.formattedPerimeterStr}\n
      面积：${dynamicHemisphereState.areaInfo.formattedAreaStr}\n
      半径：${dynamicHemisphereState.radiusInfo.formattedRadiusStr}`;
      },
      false,
    );

    const hemisphereConfig:Cesium.Entity.ConstructorOptions = createDynamicHemisphereConfig(radiiCallback,textCallback);
    // 4. 组装实体并添加
    dynamicHemisphere = viewer.value.entities.add({
      id: hemisphereUniqueId,
      properties: {
        operationType:'spatialSelection',
        sourceType: 'hemisphereSpatialSelection',
        type: 'ellipsoid',
        dataSourceName: hemisphereUniqueId,
        label:{
          originalFillColor:hemisphereConfig.label?.fillColor
        },
        ellipsoid:{
          originalMaterial:hemisphereConfig.ellipsoid?.material,
        }
      },
      ...hemisphereConfig,
    });
  }

  const cloneDynamicHemisphereToDataSource=(dataSourceName:string)=>{
    const uniqueId:string = generateBizUniqueId('hemisphereSpatialSelectionHemisphere')

    const hemisphereConfig:Cesium.Entity.ConstructorOptions = cloneEntityAsConfig(dynamicHemisphere,uniqueId,viewer);

    hemisphereConfig.label.text=`周长：${dynamicHemisphereState.perimeterInfo.formattedPerimeterStr}\n
      面积：${dynamicHemisphereState.areaInfo.formattedAreaStr}\n
      半径：${dynamicHemisphereState.radiusInfo.formattedRadiusStr}`

    const radius=dynamicHemisphereState.radiusInfo.radius
    hemisphereConfig.ellipsoid.radii=new Cesium.Cartesian3(radius,radius,radius)

    // const originalFillColor=hemisphereConfig.properties.label.originalFillColor

    const properties={
      operationType:'spatialSelection',
      sourceType: 'hemisphereSpatialSelection',
      type: 'ellipsoid',
      dataSourceName: dataSourceName,
      // label:{
      //   originalFillColor:originalFillColor,
      // },
      ellipsoid:{
        originalMaterial:hemisphereConfig.ellipsoid?.material,
      },
      isDraft:true
    } as EntityProperties

    // hemisphereConfig.show=false
    hemisphereConfig.point.show=false
    hemisphereConfig.label.show=false

    // hemisphereConfig.label.fillColor=Cesium.Color.TRANSPARENT

    // 4. 组装实体并添加
    const entity=viewer.value.entities.add({
      id: uniqueId,
      properties,
      ...hemisphereConfig, // 复用通用样式，消除重复代码
    });

    // hemisphereEntities.push(entity)
    hemisphereMap.set(uniqueId,entity)
  }

  /**
   * 重置计划轨迹
   */
  const resetDynamicHemisphereState = (): void => {
    dynamicHemisphereState={
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
        radii:new Cesium.Cartesian3(0,0,0),
        formattedRadiusStr:'',
      },
    };
  }

  const resetHemisphereSpatialSelectionSession=()=>{
    viewer.value?.entities.remove(dynamicHemisphere);
    resetDynamicHemisphereState()
  }

  let unwatchSpatialSelectForm: () => void
  const setupSpatialSelectFormWatch = (): void => {
    unwatchSpatialSelectForm = watch(
      () => spatialSelectStore.spatialSelectForm,
      (newForm: SpatialSelectForm, oldForm: SpatialSelectForm) => {
        if (newForm.operationType === 'spatialSelection'&&newForm.spatialSelectionSubtype === 'hemisphere') {
          resetHemisphereSpatialSelectionSession()
          initActiveHemisphereSpatialSelection()
        } else {
          resetHemisphereSpatialSelectionSession()
          emitCesiumEvent('clearAircraftSpatialSelection')
          emitCesiumEvent('clearAirportSpatialSelection')
        }
      },
      {
        deep: true,
      },
    )
  }

  const finishHemisphereSpatialSelection=(): void => {
    if (dynamicHemisphereState.pointCount <=1) {
      return
    }

    const uniqueId:string = generateBizUniqueId('hemisphereSpatialSelectionDataSource')
    const newDataSource:Cesium.CustomDataSource=new Cesium.CustomDataSource(uniqueId)
    cloneDynamicHemisphereToDataSource(newDataSource,uniqueId) //多边形，存放在dataSource.entities里的index=0的位置

    const lngLatAltArray=dynamicHemisphereState.lngLatAltArray
    const center:LngLatAlt=[
      lngLatAltArray[0],
      lngLatAltArray[1],
      lngLatAltArray[2],
    ]

    // const hemisphere:turf.Feature<turf.Polygon>=createCircleFromCenterAndRadius(center,dynamicHemisphereState.radiusInfo.radius)

    const spatialSelectionTarget:string=spatialSelectStore.spatialSelectForm.spatialSelectionTarget

    const spatialSelectionData:SpatialSelectionData={
      dataSourceName:uniqueId,
      sourceType: 'hemisphereSpatialSelection',
      type:'ellipsoid',
      // graphic:hemisphere,
      isActive:false,
      isDraft:true,
      radius:dynamicHemisphereState.radiusInfo.radius,
      centerLngLatAltArray:center,
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


  const handleEsc = () => {
    console.log("ESC pressed - Resetting distance surveying");

    const spatialSelectionTarget:string=spatialSelectStore.spatialSelectForm.spatialSelectionTarget

    const clearAviationSpatialSelectionData:ClearAviationSpatialSelectionData={
      isActive:true
    }
    if (spatialSelectionTarget === 'aircraft') {
      emitCesiumEvent('clearAircraftSpatialSelection',clearAviationSpatialSelectionData)
    }else if(spatialSelectionTarget === 'airport') {
      emitCesiumEvent('clearAirportSpatialSelection',clearAviationSpatialSelectionData)
    }else if(spatialSelectionTarget === 'all') {
      emitCesiumEvent('clearAircraftSpatialSelection',clearAviationSpatialSelectionData)
      emitCesiumEvent('clearAirportSpatialSelection',clearAviationSpatialSelectionData)
    }

    spatialSelectStore.setOperationType('none');
  };

  const handleBackspace = () => {
    console.log("Backspace pressed - Removing last point");

    // 回退最后一个坐标点
    if (dynamicHemisphereState.pointCount === 2) {
      dynamicHemisphereState.lngLatAltArray.splice((dynamicHemisphereState.pointCount - 1) * 3, 3)
      dynamicHemisphereState.pointCount--

      updateDynamicHemisphere();
    }
    // if (dynamicHemisphereState.pointCount === 1) {
    //   const spatialSelectionTarget:string=spatialSelectStore.spatialSelectForm.spatialSelectionTarget
    //
    //   emitCesiumEvent('clearAviationSpatialSelection')
    // }
  };

  // 仅在距离测绘模式下监听键盘事件
  const { unbindKeyboardEvents } = useKeyboardEvents(
    handleEsc,
    handleBackspace,
    () => spatialSelectStore.spatialSelectForm.operationType==='spatialSelection'&&
      spatialSelectStore.spatialSelectForm.spatialSelectionSubtype==='hemisphere'
  );

  onUnmounted(() => {
    unwatchSpatialSelectForm?.()
    unbindKeyboardEvents();
    unsubAircraftFiltered()
  })

  return {
    hemisphereSpatialSelection,
    confirmSurveyPoint,
    setupSpatialSelectFormWatch,
    finishHemisphereSpatialSelection,
    subscribeHemisphereSpatialSelectionEvents,
  }
}
