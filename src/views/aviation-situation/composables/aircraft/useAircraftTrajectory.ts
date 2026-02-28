//useAircraftTrajectory.ts
import * as Cesium from 'cesium'
import { getAircraftPlannedTrajectory } from '@/network/aircraft'
import type { RoutePoint } from '@/network/aircraft/types/route-full'
import type { AircraftSelectedData } from '../../types/aircraft'
import { isValidCoordinate } from '@/utils/geoUtils'
import { useSimulatedWebSocketStore } from '@/stores/simulateWebSocket'
import { defaultTrajectoryPos } from './aircraftConstants'

// 类型声明
interface AircraftPrimitives {
  plannedTrajectoryEntity: Cesium.Entity | null
}
interface AircraftGraphic {
  primitives: AircraftPrimitives
}

export function useAircraftTrajectory(viewer, aircraftGraphic: AircraftGraphic) {
  const simulatedWebSocketStore = useSimulatedWebSocketStore()
  let aircraftPlannedTrajectoryPositions: number[] = [...defaultTrajectoryPos]

  /**
   * 初始化计划轨迹的 CallbackProperty
   */
  const initPlannedTrajectoryCallback = (): void => {
    if (!aircraftGraphic.primitives.plannedTrajectoryEntity) return

    const plannedTrajectoryEntity:Cesium.Entity = aircraftGraphic.primitives.plannedTrajectoryEntity
    // 避免重复创建
    if (!(plannedTrajectoryEntity.polyline.positions instanceof Cesium.CallbackProperty)) {
      plannedTrajectoryEntity.polyline.positions = new Cesium.CallbackProperty(() => {
        return Cesium.Cartesian3.fromDegreesArrayHeights(aircraftPlannedTrajectoryPositions)
      }, false)
    }
  }

  /**
   * 设置计划轨迹显隐
   */
  const setAircraftPlannedTrajectoryVisible = (isVisible: boolean): void => {
    if (aircraftGraphic.primitives.plannedTrajectoryEntity) {
      aircraftGraphic.primitives.plannedTrajectoryEntity.show = isVisible
    }
  }

  /**
   * 重置计划轨迹
   */
  const resetAircraftPlannedTrajectory = (): void => {
    aircraftPlannedTrajectoryPositions = [...defaultTrajectoryPos]
    if (aircraftGraphic.primitives.plannedTrajectoryEntity) {
      aircraftGraphic.primitives.plannedTrajectoryEntity.polyline.positions = []
      setAircraftPlannedTrajectoryVisible(false)
    }
  }

  /**
   * 绘制计划轨迹
   */
  const drawAircraftPlannedTrajectory = (routeData: RoutePoint[]): void => {
    console.log("routeData", routeData);
    const entity = aircraftGraphic.primitives.plannedTrajectoryEntity
    if (!entity) return

    const positions: number[] = []
    // 过滤有效坐标
    routeData.forEach(point => {
      if (isValidCoordinate(point.longitude, point.latitude, point.baroAltitude)) {
        positions.push(point.longitude, point.latitude, point.baroAltitude)
      }
    })

    // 更新坐标并显示
    if (positions.length >= 6) { // 至少2个点（每个点3个值：经纬度高）
      aircraftPlannedTrajectoryPositions = positions
      entity.show = true
    } else {
      resetAircraftPlannedTrajectory()
    }
  }

  /**
   * 同步计划轨迹
   */
  const syncAircraftPlannedTrajectory = async (icao24: string, selected: AircraftSelectedData): Promise<void> => {
    console.log('syncAircraftPlannedTrajectory')
    console.log("icao24", icao24);
    console.log("aircraftGraphic.primitives.plannedTrajectoryEntity", aircraftGraphic.primitives.plannedTrajectoryEntity);
    if (!icao24 || !aircraftGraphic.primitives.plannedTrajectoryEntity) return
    try {
      // 请求计划轨迹数据
      const routeData = await getAircraftPlannedTrajectory(icao24)

      // 模拟轨迹增量（开发调试用）
      for (let i = 0; i < simulatedWebSocketStore.index; i++) {
        routeData.push({
          latitude: selected.position.latitude + i * 0.01,
          longitude: selected.position.longitude + i * 0.01,
          baroAltitude: selected.position.baroAltitude + i * 0.01,
        })
      }

      // 数据校验
      if (!Array.isArray(routeData) || routeData.length < 2) {
        resetAircraftPlannedTrajectory()
        return
      }

      // 初始化CallbackProperty
      initPlannedTrajectoryCallback()

      // 绘制轨迹
      drawAircraftPlannedTrajectory(routeData)
    } catch (error) {
      console.error('同步计划轨迹失败:', error)
      resetAircraftPlannedTrajectory()
    }
  }

  // ========== 计划航路点逻辑（待实现） ==========
  const syncAircraftPlannedWaypoints = async (icao24: string) => {
    // 实现计划航路点同步逻辑
  }

  const setAircraftPlannedWaypointsVisible = (isVisible: boolean) => {
    // 实现航路点显隐逻辑
  }

  // ========== 暴露方法 ==========
  return {
    syncAircraftPlannedTrajectory,
    drawAircraftPlannedTrajectory,
    setAircraftPlannedTrajectoryVisible,
    resetAircraftPlannedTrajectory,
    syncAircraftPlannedWaypoints, // 待实现
    setAircraftPlannedWaypointsVisible // 待实现
  }
}
