import * as Cesium from 'cesium'
import type { Aircraft } from '@/network/aircraft/types/aircraft'
import type {
  AircraftBillboardProperties,
  AircraftFilterForm,
  AircraftGraphic,
  AircraftLabelProperties,
} from '@/views/aviation-situation/types/aircraft'
import type { AviationRenderItem } from '@/views/aviation-situation/types/shared'
import { isValidCoordinate } from '@/utils/geoUtils'
import {
  AIRCRAFT_LABEL_SHOW_DISTANCE,
  airplaneBlueSvgDataUrl,
  airplaneHighRiskSvgRawDataUrl,
} from './aircraft-constants'

interface UseAircraftRendererOptions {
  aircraftGraphic: AircraftGraphic
  aircraftRenderMap: Map<string, AviationRenderItem<Aircraft>>
  aircraftFilterForm: AircraftFilterForm
  syncRiskRipple: (aircraft: Aircraft, position: Cesium.Cartesian3) => void
  removeRiskRipple: (icao24: string) => void
  clearRiskRipple: () => void
}

export function useAircraftRenderer(options: UseAircraftRendererOptions) {
  const {
    aircraftGraphic,
    aircraftRenderMap,
    aircraftFilterForm,
    syncRiskRipple,
    removeRiskRipple,
    clearRiskRipple,
  } = options

  const initGraphicCollections = (): void => {
    aircraftGraphic.primitiveContainer = new Cesium.PrimitiveCollection()
    aircraftGraphic.primitives.billboards = new Cesium.BillboardCollection()
    aircraftGraphic.primitives.labels = new Cesium.LabelCollection()

    aircraftGraphic.primitiveContainer.id = 'aircrafts_container'
    aircraftGraphic.primitives.billboards.id = 'aircrafts_billboards'
    aircraftGraphic.primitives.labels.id = 'aircrafts_labels'

    aircraftGraphic.primitiveContainer.add(aircraftGraphic.primitives.billboards)
    aircraftGraphic.primitiveContainer.add(aircraftGraphic.primitives.labels)

    aircraftGraphic.primitiveContainer.properties = { sourceType: 'aircraft', type: 'container' }
    aircraftGraphic.primitives.billboards.properties = { sourceType: 'aircraft', type: 'billboards' }
    aircraftGraphic.primitives.labels.properties = { sourceType: 'aircraft', type: 'labels' }
  }

  const createAircraftLabel = (item: AviationRenderItem<Aircraft>): void => {
    if (!aircraftGraphic.primitives.labels || item.label) return

    const { longitude, latitude, baroAltitude, callsign, icao24 } = item.data
    const position: Cesium.Cartesian3 = Cesium.Cartesian3.fromDegrees(longitude, latitude, baroAltitude)

    const label = aircraftGraphic.primitives.labels.add({
      show: true,
      id: `aircraft_label_${icao24}`,
      position,
      text: callsign,
      font: '14px sans-serif',
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      outlineWidth: 2,
      verticalOrigin: Cesium.VerticalOrigin.TOP,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      pixelOffset: new Cesium.Cartesian2(0, 20),
      outlineColor: Cesium.Color.BLACK,
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, AIRCRAFT_LABEL_SHOW_DISTANCE),
    })

    label.properties = {
      type: 'label',
      sourceType: 'aircraft',
      icao24,
      originalFillColor: label.fillColor,
    } satisfies AircraftLabelProperties

    item.label = label
  }

  const addAircraftLabels = (): void => {
    aircraftRenderMap.forEach((item) => {
      createAircraftLabel(item)
    })
  }

  const removeAircraftLabels = (): void => {
    aircraftGraphic.primitives.labels?.removeAll()
    aircraftRenderMap.forEach((item) => {
      item.label = undefined
    })
  }

  const drawAircraft = (aircraft: Aircraft): void => {
    const { longitude, latitude, baroAltitude, heading, icao24 } = aircraft
    if (!isValidCoordinate(longitude, latitude, baroAltitude)) return

    const position: Cesium.Cartesian3 = Cesium.Cartesian3.fromDegrees(longitude, latitude, baroAltitude)
    let image = airplaneBlueSvgDataUrl
    if (aircraft.riskLevel === 'high') {
      image = airplaneHighRiskSvgRawDataUrl
    }

    const billboard = aircraftGraphic.primitives.billboards.add({
      id: `aircraft_billboard_${icao24}`,
      show: true,
      position,
      image,
      // distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 5_000_000),
      rotation: -Cesium.Math.toRadians(heading),
      width: 30,
      height: 30,
      // threePointDepthTestDistance:Cesium.HeightReference.CLAMP_TO_3D_TILE
      // coarseDepthTestDistance:1
    })

    billboard.properties = {
      type: 'billboard',
      sourceType: 'aircraft',
      icao24,
      images: {
        original: billboard.image,
        satelliteConeScan: null,
        spatialSelection: null,
        controlZone: null,
      },
      sets: {
        dataSourceName: new Set<string>(),
        coneScanSatelliteId: new Set<string>(),
        controlZoneId: new Set<string>(),
      },
    } satisfies AircraftBillboardProperties

    const renderItem: AviationRenderItem<Aircraft> = { data: aircraft, billboard }
    aircraftRenderMap.set(icao24, renderItem)
    if (aircraftFilterForm.labelVisible) {
      createAircraftLabel(renderItem)
    }
    syncRiskRipple(aircraft, position)
  }

  const drawAircrafts = (data: Aircraft[]): void => {
    data.forEach((aircraft) => drawAircraft(aircraft))
  }

  const clearAircrafts = (): void => {
    aircraftGraphic.primitives.billboards?.removeAll()
    aircraftGraphic.primitives.labels?.removeAll()
    clearRiskRipple()
    aircraftRenderMap.clear()
  }

  const removeAircraft = (icao24: string): void => {
    const aircraftRenderItem = aircraftRenderMap.get(icao24)
    if (!aircraftRenderItem) return

    aircraftGraphic.primitives.billboards?.remove(aircraftRenderItem.billboard)
    if (aircraftRenderItem.label) {
      aircraftGraphic.primitives.labels?.remove(aircraftRenderItem.label)
    }
    removeRiskRipple(icao24)
    aircraftRenderMap.delete(icao24)
  }

  return {
    initGraphicCollections,
    drawAircraft,
    drawAircrafts,
    createAircraftLabel,
    addAircraftLabels,
    removeAircraftLabels,
    clearAircrafts,
    removeAircraft,
  }
}
