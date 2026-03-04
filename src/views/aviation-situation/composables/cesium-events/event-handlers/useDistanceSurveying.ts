// useDistanceSurveying.ts
import * as Cesium from 'cesium'
import { onUnmounted, ShallowRef, watch } from 'vue'
import { SpatialSelectForm, useSpatialSelectStore } from '@/stores/spatialSelect'
import { generateBizUniqueId } from '@/utils/uuid'
import { TemplePointLabelPositionLngLatAlt, useTemplePointLabel } from './useTemplePointLabel'
import { TempleLabelPositionLngLatAlt, useTempleLabel } from './useTempleLabelOnLineSegment'
import { useKeyboardEvents } from './useKeyboardEvents';
import {calculateSurfaceDistance,getSurfaceMidpoint} from "@/utils/geoUtils"

interface PolylineState {
  positions: number[]; // 经纬度+海拔数组（3个一组）
  pointCount: number; // 坐标点数量（一组算一个）
}


/** 单条距离测绘的完整结构 */
interface DistanceSurveyingGraphic {
  dataSource: Cesium.CustomDataSource|null
  pointStack: Cesium.Entity[]
  labelStack: Cesium.Entity[]
  polylineEntity: Cesium.CustomDataSource|null
}

export const useDistanceSurveying = (viewer: ShallowRef<Cesium.Viewer | null>) => {

  const {
    templePointLabel,
    addTempPointLabelEntityToViewer,
    addTempPointLabelEntityToDataSource,
    removeTempPointLabelEntity,
    updateTemplePointLabel
  } = useTemplePointLabel(viewer);

  const {
    templeLabel,
    addTempLabelEntityToViewer,
    addTempLabelEntityToDataSource,
    removeTempLabelEntity,
    updateTempleLabel
  } = useTempleLabel(viewer);

  const spatialSelectStore = useSpatialSelectStore()
  //存放全部距离测绘折线（可以绘制多条）的数组
  const distanceSurveyingDataSources: Cesium.CustomDataSource[] = []
  const currentDistanceSurveying: DistanceSurveyingGraphic = {
    //该距离测绘折线的全部
    dataSource: null,
    pointStack:[],
    labelStack:[],
      //该距离测绘的折线
    polylineEntity: null,
  }

  const polylineState: PolylineState = {
    positions: [],
    pointCount: 0
  };

  const distanceSurvey = (position: Cesium.Cartesian2): void => {
    const ray: Cesium.Ray = viewer.value.camera.getPickRay(position)
    const cartesian3 :Cesium.Cartesian3 = viewer.value.scene.globe.pick(ray, viewer.value.scene)
    if (!cartesian3) {
      return
    }

    // 复用抽离后的更新逻辑
    updateTemplePointLabel(cartesian3);

    const  lngLatAlt:TemplePointLabelPositionLngLatAlt  = templePointLabel.position.lngLatAlt;

    addDynamicLineSegment(lngLatAlt.longitude, lngLatAlt.latitude, lngLatAlt.height);
    updateTempleLabelEntity();

  }

  const addDynamicLineSegment = (longitude:number,latitude:number,height:number) => {
    if (polylineState.positions.length>0) {
      const lastPointIndex:number=polylineState.pointCount*3
      polylineState.positions[lastPointIndex]=longitude
      polylineState.positions[lastPointIndex+1]=latitude
      polylineState.positions[lastPointIndex+2]=height
    }
  }

  const updateTempleLabelEntity = () => {
    if (polylineState.positions.length>=2) {
      const lastPointIndex:number=polylineState.pointCount*3
      const lastPositions:number[]=[
        polylineState.positions[lastPointIndex],
        polylineState.positions[lastPointIndex+1],
        polylineState.positions[lastPointIndex+2],
      ]
      const lastButOnePointIndex:number=(polylineState.pointCount-1)*3
      const lastButOnePositions:number[]=[
        polylineState.positions[lastButOnePointIndex],
        polylineState.positions[lastButOnePointIndex+1],
        polylineState.positions[lastButOnePointIndex+2],
      ]

      const distance=calculateSurfaceDistance(lastButOnePositions,lastPositions)
      const position=getSurfaceMidpoint(lastButOnePositions,lastPositions)

      updateTempleLabel(position,distance)
    }
  }

  const addTempleToDataSourceAndPushCoordToPolyline = () => {
    const lngLatAlt: TemplePointLabelPositionLngLatAlt =addTempPointLabelEntityToDataSource(currentDistanceSurveying)

    polylineState.positions.push(lngLatAlt.longitude, lngLatAlt.latitude, lngLatAlt.height)
    polylineState.pointCount++

    if (polylineState.pointCount >= 2) {
      addTempLabelEntityToDataSource(currentDistanceSurveying)
    }
  }

  const initDistanceSurveying = (): void => {
    const uniqueId:string = generateBizUniqueId('currentDistanceSurveyingPolyline')
    currentDistanceSurveying.dataSource=new Cesium.CustomDataSource(uniqueId)

    //currentDistanceSurveying.dataSource的第一个位置是distanceSurveying_polyline，不能删除
    currentDistanceSurveying.polylineEntity=currentDistanceSurveying.dataSource.entities.add({
      id: uniqueId,
      show: true, // 默认隐藏
      // show:true,
      properties: {
        sourceType: 'distanceSurveying',
        type: 'distanceSurveying_polyline',
      },
      polyline: {
        width: 3,
        material: Cesium.Color.fromCssColorString('#38BDF8'),
        positions: new Cesium.CallbackProperty(
          () => {
            console.log('currentDistanceSurveyingCallback')
            if (polylineState.positions.length === 0) {
              return []
            }else{
              return Cesium.Cartesian3.fromDegreesArrayHeights(polylineState.positions)
            }
          },
          false,
        ),
      },
    })

    viewer.value?.dataSources.add(currentDistanceSurveying.dataSource)
  }

  const cloneCurrentDistanceSurveyingPolylineEntity=(dataSource)=>{
    const uniqueId:string = generateBizUniqueId('distanceSurveyingPolyline')

    const polylinePositionsLenWhenMouseMove=polylineState.positions.length
    const polylinePointNumCountWhenMouseMove=polylinePositionsLenWhenMouseMove/3
    console.log("polylinePointNumCountWhenMouseMove", polylinePointNumCountWhenMouseMove);
    console.log("polylineState.pointCount", polylineState.pointCount);
    console.log("polylineState.positions前面", polylineState.positions);
    if (polylinePointNumCountWhenMouseMove === polylineState.pointCount+1) {
      polylineState.positions.splice(polylineState.pointCount*3,3)
      console.log("polylineState.positions后面", polylineState.positions);
    }

    dataSource.entities.add({
      id: uniqueId,
      show: true, // 默认隐藏
      // show:true,
      properties: {
        sourceType: 'distanceSurveying',
        type: 'distanceSurveying_polyline',
      },
      polyline: {
        width: 3,
        material: Cesium.Color.fromCssColorString('#38BDF8'),
        positions: Cesium.Cartesian3.fromDegreesArrayHeights(polylineState.positions)
      },
    })
  }

  /**
   * 重置计划轨迹
   */
  const resetPolylineState = (): void => {
    polylineState.positions = [];
    polylineState.pointCount = 0;
  }

  let unwatchSpatialSelectForm: () => void
  const setupSpatialSelectFormWatch = (): void => {
    unwatchSpatialSelectForm = watch(
      () => spatialSelectStore.spatialSelectForm,
      (newForm: SpatialSelectForm, oldForm: SpatialSelectForm) => {
        if (newForm.operationType === 'distanceSurveying') {
          initDistanceSurveying()
          addTempPointLabelEntityToViewer()
          addTempLabelEntityToViewer()
        } else {
          removeDistanceSurveyingDataSource()
          resetPolylineState()
          removeTempPointLabelEntity()
          removeTempLabelEntity()
        }
      },
      {
        deep: true,
      },
    )
  }

  const finishDistanceSurveying=(): void => {
    if (polylineState.pointCount < 2) {
      return
    }
      const uniqueId:string = generateBizUniqueId('distanceSurveyingDataSource')
      const newDataSource=new Cesium.CustomDataSource(uniqueId)
      cloneCurrentDistanceSurveyingPolylineEntity(newDataSource)
      for (let i = 0; i < currentDistanceSurveying.labelStack.length; i++) {
        const oldPointEntity = currentDistanceSurveying.pointStack[i];
        const oldLabelEntity = currentDistanceSurveying.labelStack[i];
        const pointUniqueId = generateBizUniqueId('pointLabelEntity');
        const labelUniqueId = generateBizUniqueId('LabelEntity');

        // --- A. 克隆 Point (创建新对象) ---
        if (oldPointEntity) {
          newDataSource.entities.add({
            id: pointUniqueId,
            show: true,
            position: oldPointEntity.position,
            label: {
              text: oldPointEntity.label?.text,
              font: oldPointEntity.label?.font,
              outlineColor: oldPointEntity.label?.outlineColor,
              outlineWidth: oldPointEntity.label?.outlineWidth,
              style: oldPointEntity.label?.style,
              pixelOffset: oldPointEntity.label?.pixelOffset,
              heightReference: oldPointEntity.label?.heightReference,
            },
            point: {
              pixelSize: oldPointEntity.point.pixelSize,
              color: oldPointEntity.point.color,
              outlineColor: oldPointEntity.point.outlineColor,
              outlineWidth: oldPointEntity.point.outlineWidth,
              heightReference: oldPointEntity.point.heightReference,
            },
          });
        }

        // --- B. 克隆 Label (关键：固化 text) ---
        if (oldLabelEntity) {
          newDataSource.entities.add({
            id: labelUniqueId,
            show: true,
            position: oldLabelEntity.position,
            label: {
              text: oldLabelEntity.label?.text,
              font: oldLabelEntity.label?.font,
              outlineColor: oldLabelEntity.label?.outlineColor,
              outlineWidth: oldLabelEntity.label?.outlineWidth,
              style: oldLabelEntity.label?.style,
              pixelOffset: oldLabelEntity.label?.pixelOffset,
              heightReference: oldLabelEntity.label?.heightReference,
            },
          });
        }
      }
      const pointUniqueId = generateBizUniqueId('pointLabelEntity');
      const lastPointEntity=currentDistanceSurveying.pointStack[polylineState.pointCount-1]
      newDataSource.entities.add({
        id: pointUniqueId,
        show: true,
        position: lastPointEntity.position,
        label: {
          text: lastPointEntity.label?.text,
          font: lastPointEntity.label?.font,
          outlineColor: lastPointEntity.label?.outlineColor,
          outlineWidth: lastPointEntity.label?.outlineWidth,
          style: lastPointEntity.label?.style,
          pixelOffset: lastPointEntity.label?.pixelOffset,
          heightReference: lastPointEntity.label?.heightReference,
        },
        point: {
          pixelSize: lastPointEntity.point.pixelSize,
          color: lastPointEntity.point.color,
          outlineColor: lastPointEntity.point.outlineColor,
          outlineWidth: lastPointEntity.point.outlineWidth,
          heightReference: lastPointEntity.point.heightReference,
        },
      })
      distanceSurveyingDataSources.push(newDataSource);
      viewer.value?.dataSources.add(newDataSource)
      spatialSelectStore.setOperationType('none');
  }

  const removeDistanceSurveyingDataSource=()=>{
    currentDistanceSurveying.pointStack=[]
    currentDistanceSurveying.labelStack=[]
    viewer.value.dataSources.remove(currentDistanceSurveying.dataSource);
  }

  const handleEsc = () => {
    console.log("ESC pressed - Resetting distance surveying");
    spatialSelectStore.setOperationType('none');
  };

  const handleBackspace = () => {
    console.log("Backspace pressed - Removing last point");

    // 回退最后一个坐标点
    if (polylineState.pointCount >= 2) {
      const pointEntity:Cesium.Entity|undefined=currentDistanceSurveying.pointStack.pop()
      const labelEntity:Cesium.Entity|undefined=currentDistanceSurveying.labelStack.pop()
      currentDistanceSurveying.dataSource.entities.remove(pointEntity)
      currentDistanceSurveying.dataSource.entities.remove(labelEntity)

      polylineState.positions.splice((polylineState.pointCount-1) * 3, 3);
      // 删除最后三个元素 (lon, lat, alt)
      polylineState.pointCount--;
      updateTempleLabelEntity();
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
    addTempleToDataSourceAndPushCoordToPolyline,
    setupSpatialSelectFormWatch,
    finishDistanceSurveying,
  }
}
