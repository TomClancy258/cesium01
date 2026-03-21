import * as Cesium from 'cesium'
import { onUnmounted, ShallowRef, watch } from 'vue'
import { type SpatialSelectForm, useSpatialSelectStore } from '@/stores/spatialSelect'
import { generateBizUniqueId } from '@/utils/uuid'
import type {
  TempPointLabelPosition,
  TempPointLabelPositionLngLatAlt
} from '../../shared/useMouseFollowPointLabel'
import { useKeyboardEvents } from '../../useKeyboardEvents';
import {
  calculateAreaFromGraphic,
  calculatePerimeterFromGraphic,
  calculateSurfaceDistance,
  createCircleFromCenterAndRadius,
  formatArea,
  formatDistance,
} from '@/utils/geoUtils'
import {
  DrawingDataSource,
  LngLatAlt,
  SpatialSelectionData
} from '@/views/aviation-situation/types/shared'
import {
  BOX_SELECTION_STYLE,
  TEMP_POINT_LABEL_STYLE
} from '@/views/aviation-situation/constants/cesiumStyleConstants'
import { cloneEntityAsConfig } from '@/utils/cesiumUtils'
import { EntityProperties } from '@/views/aviation-situation/types/entity'

import { useMeasurementSelectionStore } from "@/stores/measurementSelection"
import {
  emitCesiumEvent,
  onCesiumEvent
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
  lngLatAltArray: number[];
  pointCount: number;
  perimeterInfo: PerimeterInfo;
  areaInfo: AreaInfo;
  radiusInfo: RadiusInfo;
}

/** 单个圆形测绘会话结构（与多边形对齐） */
export interface CircleSpatialSelectionSession {
  dataSource: Cesium.CustomDataSource | null;
  surveyPoints: Cesium.Entity[]; // 可用于存储中心点等
  segmentDistanceLabels: Cesium.Entity[]; // 暂未使用，但保留结构一致
  dynamicCircle: Cesium.Entity | null;
}

/**
 * 创建动态圆形+标签的配置
 */
const createDynamicCircleConfig = (
  radius: number | Cesium.CallbackProperty = 1,
  text: string | Cesium.CallbackProperty = '',
  position: Cesium.Cartesian3 | Cesium.CallbackProperty | null = null
): Cesium.Entity.ConstructorOptions => {
  const baseConfig: Cesium.Entity.ConstructorOptions = {
    show: true,
    label: {
      font: TEMP_POINT_LABEL_STYLE.LABEL.FONT,
      outlineColor: TEMP_POINT_LABEL_STYLE.LABEL.OUTLINE_COLOR,
      outlineWidth: TEMP_POINT_LABEL_STYLE.LABEL.OUTLINE_WIDTH,
      style: TEMP_POINT_LABEL_STYLE.LABEL.STYLE,
      pixelOffset: TEMP_POINT_LABEL_STYLE.LABEL.PIXEL_OFFSET,
      heightReference: TEMP_POINT_LABEL_STYLE.LABEL.HEIGHT_REFERENCE,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
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
      material: BOX_SELECTION_STYLE.POLYGON.MATERIAL,
    },
  };
  if (position) baseConfig.position = position;
  if (text) baseConfig.label.text = text;

  return baseConfig;
};

export const useCircleSpatialSelection = (
  viewer: ShallowRef<Cesium.Viewer | null>,
  mouseFollowPointLabelManager: any // 建议后续补全类型
) => {
  const measurementSelectionStore = useMeasurementSelectionStore();
  const spatialSelectStore = useSpatialSelectStore();

  // 存放所有已完成的圆形测绘 dataSource（用于后续管理）
  const circleSpatialSelectionDataSources: Cesium.CustomDataSource[] = [];

  // 当前激活的圆形测绘会话
  const activeCircleSpatialSelection: CircleSpatialSelectionSession = {
    dataSource: null,
    surveyPoints: [],
    segmentDistanceLabels: [],
    dynamicCircle: null,
  };

  let dynamicCircleState: DynamicCircleState = {
    lngLatAltArray: [],
    pointCount: 0,
    perimeterInfo: {
      perimeter: 0,
      formattedPerimeterStr: '',
    },
    areaInfo: {
      area: 0,
      formattedAreaStr: '',
    },
    radiusInfo: {
      radius: 1,
      formattedRadiusStr: '',
    },
  };

  const circleSpatialSelection = (cartesian2: Cesium.Cartesian2): void => {
    const ray = viewer.value?.camera.getPickRay(cartesian2);
    const cartesian3 = ray ? viewer.value?.scene.globe.pick(ray, viewer.value.scene) : null;
    if (!cartesian3 || !viewer.value) return;

    mouseFollowPointLabelManager.updateTempPointLabel(cartesian3);
    updateDynamicCircle();
  };

  const updateDynamicCircle = () => {
    if (dynamicCircleState.pointCount !== 1 || !activeCircleSpatialSelection.dynamicCircle) return;

    const lngLatAlt: LngLatAlt = mouseFollowPointLabelManager.tempPointLabel.position.lngLatAlt;
    const currentArray = [...dynamicCircleState.lngLatAltArray];
    currentArray[3] = lngLatAlt.longitude;
    currentArray[4] = lngLatAlt.latitude;
    currentArray[5] = lngLatAlt.height;

    const startPoint: LngLatAlt = [currentArray[0], currentArray[1], currentArray[2]];
    const endPoint: LngLatAlt = [currentArray[3], currentArray[4], currentArray[5]];
    const radius = calculateSurfaceDistance(startPoint, endPoint);

    dynamicCircleState.radiusInfo.radius = radius;
    dynamicCircleState.radiusInfo.formattedRadiusStr = formatDistance(radius);

    const circle = createCircleFromCenterAndRadius(startPoint, radius);
    const perimeter = calculatePerimeterFromGraphic(circle);
    const area = calculateAreaFromGraphic(circle);

    dynamicCircleState.perimeterInfo.perimeter = perimeter;
    dynamicCircleState.perimeterInfo.formattedPerimeterStr = formatDistance(perimeter);
    dynamicCircleState.areaInfo.area = area; // 修复：原代码误用 perimeter
    dynamicCircleState.areaInfo.formattedAreaStr = formatArea(area);

    const spatialSelectionTarget = spatialSelectStore.spatialSelectForm.spatialSelectionTarget;
    const spatialSelectionData: SpatialSelectionData = {
      dataSourceName: activeCircleSpatialSelection.dataSource?.name || '',
      type: 'circle',
      radius,
      centerLngLatAltArray: startPoint,
      isActive: true,
    };

    if (spatialSelectionTarget === 'aircraft') {
      emitCesiumEvent('aircraftSpatialSelect', spatialSelectionData);
    } else if (spatialSelectionTarget === 'airport') {
      emitCesiumEvent('airportSpatialSelect', spatialSelectionData);
    } else if (spatialSelectionTarget === 'all') {
      emitCesiumEvent('aircraftSpatialSelect', spatialSelectionData);
      emitCesiumEvent('airportSpatialSelect', spatialSelectionData);
    }
  };

  let unsubAircraftFiltered: () => void;
  const subscribeCircleSpatialSelectionEvents = () => {
    unsubAircraftFiltered = onCesiumEvent('aviationFiltered', () => {
      updateDynamicCircle();
    });
  };

  const confirmSurveyPoint = () => {
    if (dynamicCircleState.pointCount >= 2) return;

    const position: TempPointLabelPosition = mouseFollowPointLabelManager.tempPointLabel.position;
    const lngLatAlt: LngLatAlt = position.lngLatAlt;
    const cartesian3: Cesium.Cartesian3 = position.cartesian3;

    dynamicCircleState.lngLatAltArray.push(lngLatAlt.longitude, lngLatAlt.latitude, lngLatAlt.height);
    dynamicCircleState.pointCount++;

    if (dynamicCircleState.pointCount === 1 && activeCircleSpatialSelection.dynamicCircle) {
      activeCircleSpatialSelection.dynamicCircle.position = cartesian3;
    }
  };

  const initActiveCircleSpatialSelection = (): void => {
    const dataSourceUniqueId = generateBizUniqueId('activeCircleSpatialSelection');
    activeCircleSpatialSelection.dataSource = new Cesium.CustomDataSource(dataSourceUniqueId);

    const drawingDataSourceData: DrawingDataSource = { name: dataSourceUniqueId };
    measurementSelectionStore.setDrawingDataSource(drawingDataSourceData);

    const radiusCallback = new Cesium.CallbackProperty(() => dynamicCircleState.radiusInfo.radius, false);
    const textCallback = new Cesium.CallbackProperty(
      () =>
        `周长：${dynamicCircleState.perimeterInfo.formattedPerimeterStr}\n面积：${dynamicCircleState.areaInfo.formattedAreaStr}\n半径：${dynamicCircleState.radiusInfo.formattedRadiusStr}`,
      false
    );

    const circleConfig = createDynamicCircleConfig(radiusCallback, textCallback);

    const circleUniqueId = generateBizUniqueId('activeCircleSpatialSelectionCircle');
    activeCircleSpatialSelection.dynamicCircle = activeCircleSpatialSelection.dataSource.entities.add({
      id: circleUniqueId,
      position: undefined, // 初始无位置
      properties: {
        operationType: 'spatialSelection',
        sourceType: 'circleSpatialSelection',
        type: 'circle',
        dataSourceName: dataSourceUniqueId,
        originalEllipseMaterial: circleConfig.ellipse?.material,
        label: {
          originalFillColor: circleConfig.label?.fillColor,
        },
      } as EntityProperties,
      ...circleConfig,
    });

    viewer.value?.dataSources.add(activeCircleSpatialSelection.dataSource);
  };

  /**
   * 将当前动态圆克隆到指定 dataSource（用于保存结果）
   */
  const cloneDynamicCircleToDataSource = (targetDataSource: Cesium.CustomDataSource, dataSourceName: string) => {
    if (!activeCircleSpatialSelection.dynamicCircle) return;

    const uniqueId = generateBizUniqueId('circleSpatialSelectionCircle');
    const clonedConfig = cloneEntityAsConfig(activeCircleSpatialSelection.dynamicCircle, uniqueId, viewer);

    // 固化文本和半径
    clonedConfig.label!.text = `周长：${dynamicCircleState.perimeterInfo.formattedPerimeterStr}\n面积：${dynamicCircleState.areaInfo.formattedAreaStr}\n半径：${dynamicCircleState.radiusInfo.formattedRadiusStr}`;
    clonedConfig.ellipse!.semiMajorAxis = dynamicCircleState.radiusInfo.radius;
    clonedConfig.ellipse!.semiMinorAxis = dynamicCircleState.radiusInfo.radius;

    const originalFillColor = clonedConfig.properties?.label?.originalFillColor;

    clonedConfig.properties = {
      operationType: 'spatialSelection',
      sourceType: 'circleSpatialSelection',
      type: 'circle',
      dataSourceName,
      originalCircleMaterial: clonedConfig.ellipse?.material,
      label: {
        originalFillColor,
      },
    } as EntityProperties;

    // 隐藏辅助点（如果存在）
    if (clonedConfig.point) {
      clonedConfig.point.show = false;
    }
    if (clonedConfig.label) {
      clonedConfig.label.fillColor = Cesium.Color.TRANSPARENT;
    }

    targetDataSource.entities.add(clonedConfig);
  };

  const resetDynamicCircleState = (): void => {
    dynamicCircleState = {
      lngLatAltArray: [],
      pointCount: 0,
      perimeterInfo: { perimeter: 0, formattedPerimeterStr: '' },
      areaInfo: { area: 0, formattedAreaStr: '' },
      radiusInfo: { radius: 1, formattedRadiusStr: '' },
    };
  };

  const cleanupActiveCircleSpatialSelection = () => {
    if (activeCircleSpatialSelection.dataSource) {
      viewer.value?.dataSources.remove(activeCircleSpatialSelection.dataSource);
    }
    activeCircleSpatialSelection.surveyPoints = [];
    activeCircleSpatialSelection.segmentDistanceLabels = [];
    activeCircleSpatialSelection.dynamicCircle = null;
    activeCircleSpatialSelection.dataSource = null;
  };

  const resetCircleSpatialSelectionSession = () => {
    cleanupActiveCircleSpatialSelection();
    resetDynamicCircleState();
  };

  let unwatchSpatialSelectForm: () => void;
  const setupSpatialSelectFormWatch = (): void => {
    unwatchSpatialSelectForm = watch(
      () => spatialSelectStore.spatialSelectForm,
      (newForm: SpatialSelectForm) => {
        if (
          newForm.operationType === 'spatialSelection' &&
          newForm.spatialSelectionSubtype === 'circle'
        ) {
          resetCircleSpatialSelectionSession();
          initActiveCircleSpatialSelection();
        } else {
          resetCircleSpatialSelectionSession();
          emitCesiumEvent('clearAviationActiveSpatialSelection');
        }
      },
      { deep: true }
    );
  };

  const finishCircleSpatialSelection = (): void => {
    if (dynamicCircleState.pointCount < 2 || !activeCircleSpatialSelection.dataSource) return;

    const uniqueId = generateBizUniqueId('circleSpatialSelectionDataSource');
    const newDataSource = new Cesium.CustomDataSource(uniqueId);

    cloneDynamicCircleToDataSource(newDataSource, uniqueId);
    circleSpatialSelectionDataSources.push(newDataSource);
    viewer.value?.dataSources.add(newDataSource);

    const center: LngLatAlt = [
      dynamicCircleState.lngLatAltArray[0],
      dynamicCircleState.lngLatAltArray[1],
      dynamicCircleState.lngLatAltArray[2],
    ];

    const spatialSelectionTarget = spatialSelectStore.spatialSelectForm.spatialSelectionTarget;
    const spatialSelectionData: SpatialSelectionData = {
      dataSourceName: uniqueId,
      type: 'circle',
      radius: dynamicCircleState.radiusInfo.radius,
      centerLngLatAltArray: center,
      isActive: false,
    };

    if (spatialSelectionTarget === 'aircraft') {
      emitCesiumEvent('aircraftSpatialSelect', spatialSelectionData);
    } else if (spatialSelectionTarget === 'airport') {
      emitCesiumEvent('airportSpatialSelect', spatialSelectionData);
    } else if (spatialSelectionTarget === 'all') {
      emitCesiumEvent('aircraftSpatialSelect', spatialSelectionData);
      emitCesiumEvent('airportSpatialSelect', spatialSelectionData);
    }

    spatialSelectStore.setOperationType('none');
  };

  const handleEsc = () => {
    console.log("ESC pressed - Resetting circle spatial selection");
    emitCesiumEvent('clearAviationActiveSpatialSelection');
    spatialSelectStore.setOperationType('none');
  };

  const handleBackspace = () => {
    console.log("Backspace pressed - Removing last point");

    if (dynamicCircleState.pointCount === 2) {
      dynamicCircleState.lngLatAltArray.splice((dynamicCircleState.pointCount - 1) * 3, 3);
      dynamicCircleState.pointCount--;
      updateDynamicCircle();
    }
  };

  const { unbindKeyboardEvents } = useKeyboardEvents(
    handleEsc,
    handleBackspace,
    () =>
      spatialSelectStore.spatialSelectForm.operationType === 'spatialSelection' &&
      spatialSelectStore.spatialSelectForm.spatialSelectionSubtype === 'circle'
  );

  onUnmounted(() => {
    unwatchSpatialSelectForm?.();
    unbindKeyboardEvents();
    unsubAircraftFiltered?.();
    cleanupActiveCircleSpatialSelection();
  });

  return {
    circleSpatialSelection,
    confirmSurveyPoint,
    setupSpatialSelectFormWatch,
    finishCircleSpatialSelection,
    subscribeCircleSpatialSelectionEvents,
  };
};
