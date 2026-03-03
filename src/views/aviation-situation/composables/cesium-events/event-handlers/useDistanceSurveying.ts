// useDistanceSurveying.ts
import * as Cesium from 'cesium'
import { onUnmounted, ShallowRef, watch } from 'vue'
import { SpatialSelectForm, useSpatialSelectStore } from '@/stores/spatialSelect'
import { defaultTrajectoryPos } from '@/views/aviation-situation/composables/aircraft/aircraftConstants'
import { generateBizUniqueId } from '@/utils/uuid'

/** 线相关实体：折线 + 线段长度Label */
interface DistanceSurveyingLine {
  polylineEntity: Cesium.Entity | null
}

/** 单条距离测绘的完整结构 */
interface DistanceSurveyingGraphic {
  entityContainer: Cesium.CustomDataSource|null
  line: DistanceSurveyingLine
}

export const useDistanceSurveying = (viewer: ShallowRef<Cesium.Viewer | null>) => {
  const spatialSelectStore = useSpatialSelectStore()
  //存放全部距离测绘折线（可以绘制多条）的数组
  const distanceSurveyingGraphics: Cesium.CustomDataSource[] = []
  const distanceSurveyingGraphic: DistanceSurveyingGraphic = {
    //该距离测绘折线的全部
    entityContainer: null,
    line: {
      //该距离测绘的折线
      polylineEntity: null,
    },
  }

  //存放该距离测绘折线的全部坐标（初始值[...defaultTrajectoryPos]是防止Cesium.Cartesian3.fromDegreesArrayHeights([])空数组报错）
  let polylinePositions: number[] = []
  let positionNum:number=0

  interface TemplePointLabelPositionLngLatAlt {
    longitude: number
    latitude: number
    height: number
  }

  interface TemplePointLabelPosition {
    cartesian3: Cesium.Cartesian3 | null | undefined
    lngLatAlt: TemplePointLabelPositionLngLatAlt
    lngLatAltFormat: TemplePointLabelPositionLngLatAlt
  }

  interface TemplePointLabel {
    entity: Cesium.Entity | null // 单个点位的笛卡尔坐标（非数组！）
    position: TemplePointLabelPosition
  }

  const templePointLabel: TemplePointLabel = {
    entity: null,
    position: {
      cartesian3: null,
      lngLatAlt: {
        longitude: 0,
        latitude: 0,
        height: 0,
      },
      lngLatAltFormat: {
        longitude: 0,
        latitude: 0,
        height: 0,
      },
    },
  }

  const distanceSurvey = (position: Cesium.Cartesian2): void => {
    const ray: Cesium.Ray = viewer.value.camera.getPickRay(position)
    templePointLabel.position.cartesian3 = viewer.value.scene.globe.pick(ray, viewer.value.scene)
    if (!templePointLabel.position.cartesian3) {
      return
    }

    if (!templePointLabel.entity) {
      return
    }
    if (!templePointLabel.entity.show) {
      templePointLabel.entity.show = true
    }

    const cartographic: Cesium.Cartographic = Cesium.Cartographic.fromCartesian(
      templePointLabel.position.cartesian3,
    )
    // 第二步：弧度转角度（经纬度常用角度表示），海拔直接取（单位：米）
    const longitude: number = Cesium.Math.toDegrees(cartographic.longitude) // 经度（°）
    const latitude: number = Cesium.Math.toDegrees(cartographic.latitude) // 纬度（°）
    const height: number = cartographic.height // 海拔（米）

    const lngLatAlt: TemplePointLabelPositionLngLatAlt = templePointLabel.position.lngLatAlt
    lngLatAlt.longitude = longitude
    lngLatAlt.latitude = latitude
    lngLatAlt.height = height

    const lngLatAltFormat: TemplePointLabelPositionLngLatAlt = templePointLabel.position.lngLatAltFormat
    // 可选：保留小数位数，提升显示可读性
    lngLatAltFormat.longitude = longitude.toFixed(6) // 经度保留6位小数
    lngLatAltFormat.latitude = latitude.toFixed(6) // 纬度保留6位小数
    lngLatAltFormat.height = height.toFixed(2) // 海拔保留2位小数

    addDynamicLineSegment(longitude,latitude,height)
  }

  const addDynamicLineSegment = (longitude:number,latitude:number,height:number) => {
    if (polylinePositions.length>0) {
      const baseIndex:number=positionNum*3
      polylinePositions[baseIndex]=longitude
      polylinePositions[baseIndex+1]=latitude
      polylinePositions[baseIndex+2]=height
    }
  }
  const updateTemplePointLabel = () => {}

  const addTempPointLabelEntityToEntityContainer = () => {
    const lngLatAlt: TemplePointLabelPositionLngLatAlt = templePointLabel.position.lngLatAlt
    const lngLatAltFormat: TemplePointLabelPositionLngLatAlt = templePointLabel.position.lngLatAltFormat
    const uniqueId:string = generateBizUniqueId('pointLabelEntity')
    distanceSurveyingGraphic.entityContainer?.entities.add({
      id: uniqueId,
      show: true, // 默认隐藏
      position: templePointLabel.position.cartesian3,
      label: {
        text: `经度：${lngLatAltFormat.longitude}°\n纬度：${lngLatAltFormat.latitude}°\n海拔：${lngLatAltFormat.height}m`,
        font: '16px Verdana',
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
    })

    polylinePositions.push(lngLatAlt.longitude, lngLatAlt.latitude, lngLatAlt.height)
    positionNum++
  }

  // 计算两点间距离（米）
  const calculateDistance = (pos1: number[], pos2: number[]): number => {
    const cartesian1 = Cesium.Cartesian3.fromDegrees(pos1[0], pos1[1], pos1[2] || 0)
    const cartesian2 = Cesium.Cartesian3.fromDegrees(pos2[0], pos2[1], pos2[2] || 0)
    return Cesium.Cartesian3.distance(cartesian1, cartesian2)
  }

  const addTempPointLabelEntityToViewer = () => {
    const lngLatAltFormat: TemplePointLabelPositionLngLatAlt = templePointLabel.position.lngLatAltFormat
    templePointLabel.entity = viewer.value?.entities.add({
      id: 'tempPointLabelEntity',
      show: false, // 默认隐藏
      position: new Cesium.CallbackProperty((): Cesium.Cartesian3 => {
        return templePointLabel.position.cartesian3
      }, false),
      label: {
        text: new Cesium.CallbackProperty((): string => {
          return `经度：${lngLatAltFormat.longitude}°\n纬度：${lngLatAltFormat.latitude}°\n海拔：${lngLatAltFormat.height}m`
        }, false),
        font: '16px Verdana',
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
    })
  }

  const clearTempPointLabelEntity = () => {
    viewer.value?.entities.removeById('tempPointLabelEntity')
    templePointLabel.entity = null
  }

  const initDistanceSurveying = (): void => {
    const uniqueId:string = generateBizUniqueId('distanceSurveyingGraphic')
    distanceSurveyingGraphic.entityContainer=new Cesium.CustomDataSource(uniqueId)

    //distanceSurveyingGraphic.entityContainer的第一个位置是distanceSurveying_polyline，不能删除
    distanceSurveyingGraphic.line.polylineEntity=distanceSurveyingGraphic.entityContainer.entities.add({
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
            console.log('distanceSurveyingGraphicCallback')
            if (polylinePositions.length === 0) {
              return []
            }else{
              return Cesium.Cartesian3.fromDegreesArrayHeights(polylinePositions)
            }
          },
          false,
        ),
      },
    })

    viewer.value?.dataSources.add(distanceSurveyingGraphic.entityContainer)
  }

  /**
   * 重置计划轨迹
   */
  const resetDistanceSurveyingPolyline = (): void => {
    polylinePositions = []
    positionNum=0
  }

  let unwatchSpatialSelectForm: () => void
  const setupSpatialSelectFormWatch = (): void => {
    unwatchSpatialSelectForm = watch(
      () => spatialSelectStore.spatialSelectForm,
      (newForm: SpatialSelectForm, oldForm: SpatialSelectForm) => {
        if (newForm.operationType === 'distanceSurveying') {
          initDistanceSurveying()
          addTempPointLabelEntityToViewer()
        } else {
          resetDistanceSurveyingPolyline()
          clearTempPointLabelEntity()
        }
      },
      {
        deep: true,
      },
    )
  }

  onUnmounted(() => {
    unwatchSpatialSelectForm?.()
  })

  return {
    distanceSurvey,
    addTempPointLabelEntityToEntityContainer,
    setupSpatialSelectFormWatch,
  }
}
