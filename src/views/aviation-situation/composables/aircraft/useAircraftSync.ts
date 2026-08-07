import type { ShallowRef } from 'vue'
import * as Cesium from 'cesium'
import { getAircrafts } from '@/network/aircraft'
import type { Aircraft, AircraftStatesResponse } from '@/network/aircraft/types/aircraft'
import type { AircraftBaseProperties } from '@/views/aviation-situation/types/aircraft'
import type { AviationRenderItem, AviationSelectedData } from '@/views/aviation-situation/types/shared'
import { toAircraftBaseProperties } from './aircraft-property-utils'

interface UseAircraftSyncOptions {
  viewer: ShallowRef<Cesium.Viewer>
  aircraftRenderMap: Map<string, AviationRenderItem<Aircraft>>
  drawAircraft: (aircraft: Aircraft) => void
  drawAircrafts: (data: Aircraft[]) => void
  removeAircraft: (icao24: string) => void
  clearAircrafts: () => void
  filterAircrafts: () => void
  clearMatchedAircrafts: () => void
  syncRiskRipple: (aircraft: Aircraft, position: Cesium.Cartesian3, billboardShow: boolean) => void
  getHovered: () => AviationSelectedData
  showAircraftTooltip: (position: Cesium.Cartesian2, properties: AircraftBaseProperties) => void
}

export function useAircraftSync(options: UseAircraftSyncOptions) {
  const {
    viewer,
    aircraftRenderMap,
    drawAircraft,
    drawAircrafts,
    removeAircraft,
    clearAircrafts,
    filterAircrafts,
    clearMatchedAircrafts,
    syncRiskRipple,
    getHovered,
    showAircraftTooltip,
  } = options

  const loadAndDrawAircrafts = async (): Promise<void> => {
    try {
      const res: AircraftStatesResponse = await getAircrafts()
      clearAircrafts()
      if (Array.isArray(res) && res.length > 0) {
        drawAircrafts(res)
      } else {
        console.warn('飞机数据为空或格式错误:', res)
      }
    } catch (error) {
      console.error('加载飞机数据失败:', error)
      clearAircrafts()
    }
  }

  const syncAircrafts = async (newIndex: number): Promise<void> => {
    try {
      const data: AircraftStatesResponse = await getAircrafts()
      if (Array.isArray(data) && data.length > 0) {
        if (aircraftRenderMap.size === 0) {
          drawAircrafts(data)
        } else {
          const offset: number = newIndex * 0.02
          for (const aircraft of data) {
            aircraft.longitude = parseFloat((aircraft.longitude + offset).toFixed(4))
            aircraft.latitude = parseFloat((aircraft.latitude + offset).toFixed(4))
          }
          refreshAircraftsInScene(data)
        }
        filterAircrafts()
      } else {
        console.warn('飞机数据为空或格式错误:', data)
        clearAircrafts()
        clearMatchedAircrafts()
      }
    } catch (error) {
      console.error('加载飞机数据失败:', error)
      clearAircrafts()
      clearMatchedAircrafts()
    }
  }

  const refreshAircraftsInScene = (newAircrafts: Aircraft[]): void => {
    const newIcaoSet = new Set<string>()
    for (const aircraft of newAircrafts) {
      newIcaoSet.add(aircraft.icao24)
      const aircraftRenderItem = aircraftRenderMap.get(aircraft.icao24)

      if (aircraftRenderItem) {
        const position = Cesium.Cartesian3.fromDegrees(
          aircraft.longitude,
          aircraft.latitude,
          aircraft.baroAltitude,
        )
        aircraftRenderItem.billboard.position = position
        aircraftRenderItem.billboard.rotation = -Cesium.Math.toRadians(aircraft.heading)
        syncRiskRipple(aircraft, position, aircraftRenderItem.billboard.show)
        if (aircraftRenderItem.label) {
          aircraftRenderItem.label.position = position
        }
        aircraftRenderItem.data = aircraft

        const hovered = getHovered()
        if (hovered != null && hovered.sourceType === 'aircraft' && aircraft.icao24 === hovered.icao24) {
          const properties = toAircraftBaseProperties(aircraft)
          const screenPosition: Cesium.Cartesian2 =
            Cesium.SceneTransforms.worldToWindowCoordinates(viewer.value.scene, position)
          showAircraftTooltip(screenPosition, properties)
        }
      } else {
        drawAircraft(aircraft)
      }
    }

    for (const icao24 of aircraftRenderMap.keys()) {
      if (!newIcaoSet.has(icao24)) {
        removeAircraft(icao24)
      }
    }
  }

  return {
    loadAndDrawAircrafts,
    syncAircrafts,
  }
}
