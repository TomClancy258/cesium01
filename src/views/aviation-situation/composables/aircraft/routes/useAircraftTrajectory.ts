//useAircraftTrajectory.ts
import * as Cesium from 'cesium'
import { getAircraftPlannedTrajectory } from '@/network/aircraft'
import type { RoutePoint } from '@/network/aircraft/types/route-full'
import type {
  AircraftSelectedData,
  AircraftTrajectoryOptions,
  TrajectoryGroup,
  SelectedAircraftPlanned,
} from '@/views/aviation-situation/types/aircraft'
import { isValidCoordinate } from '@/utils/geoUtils'
import { onUnmounted, watch } from 'vue'
import { useAircraftStore } from '@/stores/aircraft'
import {useAviationSelectionStore} from '@/stores/aviationSelection'
import type {DynamicPolylineState} from "@/views/aviation-situation/types/shared"

const aircraftStore=useAircraftStore()

export function useAircraftTrajectory(viewer, aircraftGraphic: AircraftGraphic) {
  const aviationSelectionStore = useAviationSelectionStore()

  const aircraftPlannedTrajectoryState:DynamicPolylineState={
    lngLatAltArray:[],
    positions:[],
    pointCount:0
  }
  let aircraftPlannedWaypoints: RoutePoint[] = []

  const initPlannedTrajectory=():void=>{
    initPlannedWaypoints()
    initPlannedTrajectoryEntity()

    setupAircraftTrajectoryOptionsWatch()
    // addEntityPoint()
  }

  const initPlannedWaypoints=():void=>{
    const planned:SelectedAircraftPlanned=aircraftGraphic.primitives.selectedAircraft.planned
    planned.waypoints = new Cesium.PointPrimitiveCollection()
    planned.waypoints.id = 'aircraft_plannedWaypoints'
    planned.waypoints.properties = { sourceType: 'aircraft', type: 'aircraft_plannedWaypoints' }
    aircraftGraphic.primitiveContainer.add(planned.waypoints)

    setAircraftPlannedWaypointsVisible(false)
  }

  const initPlannedTrajectoryEntity=():void=>{
    const planned:SelectedAircraftPlanned=aircraftGraphic.primitives.selectedAircraft.planned
    planned.trajectoryPolylineEntity = viewer.value.entities.add({
      id: 'aircraft_plannedTrajectory',
      show: false, // 默认隐藏
      // show:true,
      properties: {
        sourceType: 'aircraft',
        type:'aircraft_plannedTrajectory'
      },
      polyline: {
        width: 3,
        material: Cesium.Color.fromCssColorString('#1E40AF'),
        positions: []
      },
    })
  }

  const addEntityPoint=()=>{
    for (let i = 0; i < 5000; i++) {
      viewer.value.entities.add({
        id: 'aircraft_plannedTrajectoryPoint_'+i,
        position: Cesium.Cartesian3.fromDegrees(10+i*0.01, 10+i*0.01,1000),
        // show: false, // 默认隐藏
        show:true,
        properties: {
          sourceType: 'aircraft',
          type:'aircraft_plannedTrajectory'
        },
        point: {
          pixelSize: 10,
          color: Cesium.Color.fromBytes(243, 242, 99),
          outlineColor: Cesium.Color.fromBytes(219, 218, 111),
          outlineWidth: 2,
          scaleByDistance: new Cesium.NearFarScalar(1.5e3, 1.0, 4.0e7, 0.1),
        },
      })
    }
  }

  /**
   * 初始化计划轨迹的 CallbackProperty
   */
  const initPlannedTrajectoryCallback = (): void => {
    const planned:SelectedAircraftPlanned=aircraftGraphic.primitives.selectedAircraft.planned
    if (!planned.trajectoryPolylineEntity) return

    const plannedTrajectoryEntity:Cesium.Entity = planned.trajectoryPolylineEntity
    // 避免重复创建
    if (!(plannedTrajectoryEntity.polyline.positions instanceof Cesium.CallbackProperty)) {
      plannedTrajectoryEntity.polyline.positions = new Cesium.CallbackProperty(() => {
        return aircraftPlannedTrajectoryState.positions
      }, false)
    }
  }

  /**
   * 设置计划轨迹显隐
   */
  const setAircraftPlannedTrajectoryVisible = (isVisible: boolean): void => {
    const planned:SelectedAircraftPlanned=aircraftGraphic.primitives.selectedAircraft.planned

    if (planned.trajectoryPolylineEntity) {
      planned.trajectoryPolylineEntity.show = isVisible
    }
  }

  /**
   * 设置计划航路点显隐
   */
  const setAircraftPlannedWaypointsVisible = (isVisible: boolean): void => {
    const planned:SelectedAircraftPlanned=aircraftGraphic.primitives.selectedAircraft.planned

    if (planned.waypoints) {
      planned.waypoints.show = isVisible
    }
  }

  /**
   * 重置计划轨迹
   */
  const resetAircraftPlannedTrajectory = (): void => {
    aircraftPlannedTrajectoryState.lngLatAltArray = []
    aircraftPlannedTrajectoryState.positions=[]
    const planned:SelectedAircraftPlanned=aircraftGraphic.primitives.selectedAircraft.planned

    if (planned.trajectoryPolylineEntity) {
      planned.trajectoryPolylineEntity.polyline.positions = []
      setAircraftPlannedTrajectoryVisible(false)
    }
  }

  /**
   * 绘制计划轨迹
   */
  const updateAircraftPlannedTrajectoryPositions = (routeData: RoutePoint[]): void => {
    const entity:Cesium.Entity|null = aircraftGraphic.primitives.selectedAircraft.planned.trajectoryPolylineEntity
    if (!entity) return

    const lngLatAltArray: number[] = []
    // 过滤有效坐标
    routeData.forEach(point => {
      if (isValidCoordinate(point.longitude, point.latitude, point.baroAltitude)) {
        lngLatAltArray.push(point.longitude, point.latitude, point.baroAltitude)
      }
    })

    // 更新坐标并显示
    if (lngLatAltArray.length >= 6) { // 至少2个点（每个点3个值：经纬度高）
      aircraftPlannedTrajectoryState.lngLatAltArray = lngLatAltArray
      aircraftPlannedTrajectoryState.positions=Cesium.Cartesian3.fromDegreesArrayHeights(aircraftPlannedTrajectoryState.lngLatAltArray)
    } else {
      resetAircraftPlannedTrajectory()
    }
  }

  /**
   * 同步计划轨迹
   */
  const syncAircraftPlannedTrajectory = async (icao24: string, selected: AircraftSelectedData): Promise<void> => {
    if (!icao24 || !aircraftGraphic.primitives.selectedAircraft.planned.trajectoryPolylineEntity) return
    try {
      // 请求计划轨迹数据
      const routeData:RoutePoint[] = await getAircraftPlannedTrajectory(icao24)
      // 模拟轨迹增量（开发调试用）
      routeData.push({
        latitude: selected.position.latitude,
        longitude: selected.position.longitude,
        baroAltitude: selected.position.baroAltitude,
      })

      if (!Array.isArray(routeData) || routeData.length < 2) {
        resetAircraftPlannedTrajectory()
        clearAircraftPlannedWaypoints()
        return
      }

      if (aircraftPlannedWaypoints.length === 0) {
        drawAircraftPlannedWaypoints(routeData, icao24)
      } else {
        if (icao24 !== aviationSelectionStore.lastSelectedIcao24) {
          clearAircraftPlannedWaypoints()
          drawAircraftPlannedWaypoints(routeData, icao24)
        }else{
          // 找到第一个不同的点，这个点及其之后的点全部del，再add绘制新的点，这样做性能优化
          // refreshAircraftRouteInScene(routeData, icao24)
        }
      }
      aircraftPlannedWaypoints = routeData

      updateAircraftPlannedTrajectoryPositions(routeData)
    } catch (error) {
      console.error('同步计划轨迹失败:', error)
      resetAircraftPlannedTrajectory()
    }
  }

  const drawAircraftPlannedWaypoints = (routeData: RoutePoint[], icao24: string): void => {
    const waypoints:Cesium.PointPrimitiveCollection=aircraftGraphic.primitives.selectedAircraft.planned.waypoints
    if (!waypoints) return

    // 逐段绘制航线
    for (let i = 0; i < routeData.length; i++) {
      const point:RoutePoint = routeData[i]

      // 坐标校验
      if (!isValidCoordinate(point.longitude, point.latitude, point.baroAltitude)) {
        continue
      }

      // 构建线段坐标
      const position:Cesium.Cartesian3 = new Cesium.Cartesian3.fromDegrees(
        point.longitude,
        point.latitude,
        point.baroAltitude)

      // 添加线段
      waypoints.add({
        id: `selectedAircraftWaypoint_${icao24}_segment_${i}`,
        position,
        pixelSize:10,
        color : Cesium.Color.fromCssColorString('#FBBF24')
      })
    }
  }


  const clearAircraftPlannedWaypoints = (): void => {
    const waypoints:Cesium.PointPrimitiveCollection=aircraftGraphic.primitives.selectedAircraft.planned.waypoints
    if (waypoints) {
      waypoints.removeAll()
    }
    setAircraftPlannedWaypointsVisible(false)
    aircraftPlannedWaypoints = []
  }


  let unwatchAircraftTrajectoryOptions: () => void

  const setupAircraftTrajectoryOptionsWatch = (): void => {
    unwatchAircraftTrajectoryOptions = watch(
      () => aircraftStore.aircraftTrajectoryOptions,
      (newOptions:AircraftTrajectoryOptions,oldOptions:AircraftTrajectoryOptions) => {
        console.log("aircraftGraphic.primitives.selectedAircraft.planned.waypoints.length", aircraftGraphic.primitives.selectedAircraft.planned.waypoints.length);
        const planned:TrajectoryGroup = newOptions.planned
        if (planned.trajectoryVisible) {
          initPlannedTrajectoryCallback()
          setAircraftPlannedTrajectoryVisible(true)
        } else {
          resetAircraftPlannedTrajectory()
        }
        // 计划航路点逻辑（待实现）
        if (planned.waypointsVisible) {
          setAircraftPlannedWaypointsVisible(true)
        } else {
          setAircraftPlannedWaypointsVisible(false)
        }
      },
      { deep: true }
    )
  }


  onUnmounted(()=>{
    unwatchAircraftTrajectoryOptions?.()
  })

  // ========== 暴露方法 ==========
  return {
    initPlannedTrajectory,

    syncAircraftPlannedTrajectory,
    updateAircraftPlannedTrajectoryPositions,
    setAircraftPlannedTrajectoryVisible,
    resetAircraftPlannedTrajectory,

    setAircraftPlannedWaypointsVisible,
    clearAircraftPlannedWaypoints,

    initPlannedTrajectoryCallback,
    setupAircraftTrajectoryOptionsWatch,

  }
}
