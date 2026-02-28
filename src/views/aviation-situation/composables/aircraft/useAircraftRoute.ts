//useAircraftRoute.ts
import * as Cesium from 'cesium'
import { getAircraftRouteFull } from '@/network/aircraft'
import type { RoutePoint } from '@/network/aircraft/types/route-full'
import type { AircraftSelectedData } from '../../types/aircraft'
import { isValidCoordinate } from '@/utils/geoUtils'
import { altitudeColorMap } from './aircraftConstants'

// 类型声明（复用主文件的 AircraftGraphic）
interface AircraftPrimitives {
  routePolylines: Cesium.PolylineCollection | null
}
interface AircraftGraphic {
  primitives: AircraftPrimitives
}

export function useAircraftRoute(viewer, aircraftGraphic: AircraftGraphic) {
  let aircraftRoutes: RoutePoint[] = []
  let lastSelectedIcao24: string | null = null

  /**
   * 根据高度获取颜色
   */
  const getColorByAltitude = (altitude: number): string => {
    if (altitude === null || altitude === undefined || isNaN(altitude)) {
      return 'rgba(128, 128, 128, 0.8)'
    }
    const matchItem = altitudeColorMap.find(item => altitude >= item.min && altitude < item.max)
    return matchItem ? matchItem.color : 'rgba(128, 128, 128, 0.8)'
  }

  /**
   * 绘制飞机已飞航线
   */
  const drawAircraftRoute = (routeData: RoutePoint[], icao24: string): void => {
    if (!aircraftGraphic.primitives.routePolylines) return

    // 逐段绘制航线
    for (let i = 0; i < routeData.length - 1; i++) {
      const startPoint = routeData[i]
      const endPoint = routeData[i + 1]

      // 坐标校验
      if (
        !isValidCoordinate(startPoint.longitude, startPoint.latitude, startPoint.baroAltitude) ||
        !isValidCoordinate(endPoint.longitude, endPoint.latitude, endPoint.baroAltitude)
      ) {
        continue
      }

      // 构建线段坐标
      const positions = Cesium.Cartesian3.fromDegreesArrayHeights([
        startPoint.longitude,
        startPoint.latitude,
        startPoint.baroAltitude,
        endPoint.longitude,
        endPoint.latitude,
        endPoint.baroAltitude,
      ])

      // 按终点高度着色
      const segmentColor = getColorByAltitude(endPoint.baroAltitude)

      // 添加线段
      aircraftGraphic.primitives.routePolylines.add({
        id: `aircraftRoute_${icao24}_segment_${i}`,
        positions,
        width: 2,
        arcType: Cesium.ArcType.GEODESIC,
        material: Cesium.Material.fromType('Color', {
          color: Cesium.Color.fromCssColorString(segmentColor),
        }),
      })
    }

    aircraftGraphic.primitives.routePolylines.show = true
  }

  /**
   * 同步飞机已飞航线
   */
  const syncAircraftRoute = async (icao24: string, selected: AircraftSelectedData): Promise<void> => {
    if (!icao24 || !aircraftGraphic.primitives.routePolylines) return

    try {
      // 请求航线数据
      const routeData = await getAircraftRouteFull(icao24)
      // 追加当前位置
      routeData.push({
        latitude: selected.position.latitude,
        longitude: selected.position.longitude,
        baroAltitude: selected.position.baroAltitude,
      })

      // 数据校验
      if (!Array.isArray(routeData) || routeData.length < 2) {
        clearAircraftRoute()
        return
      }

      // 绘制逻辑
      if (aircraftRoutes.length === 0) {
        drawAircraftRoute(routeData, icao24)
        aircraftRoutes = routeData
      } else {
        if (icao24 !== lastSelectedIcao24) {
          clearAircraftRoute()
          drawAircraftRoute(routeData, icao24)
        }
        // 航线增量更新逻辑可在此扩展
        // processAircraftRouteUpdate(routeData, icao24)
      }

      lastSelectedIcao24 = icao24
    } catch (error) {
      console.error('同步航线失败:', error)
      clearAircraftRoute()
    }
  }

  /**
   * 清空航线
   */
  const clearAircraftRoute = (): void => {
    aircraftGraphic.primitives.routePolylines?.removeAll()
    aircraftRoutes = []
    lastSelectedIcao24 = null
  }

  return {
    syncAircraftRoute,
    clearAircraftRoute,
    drawAircraftRoute // 可选暴露，便于测试
  }
}
