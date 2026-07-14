import { geojsonRequest } from '../request'
import type { ControlZoneFeatureCollection } from './type'
import { ControlZoneFeature } from './type'

const API = {
  CONTROL_ZONES: 'control-zone/control-zones.json',
} as const

// src/network/control-zone/index.ts
export const getControlZones = async (): Promise<ControlZoneFeature[]> => {
  const collection = await geojsonRequest.get<ControlZoneFeatureCollection>(
    API.CONTROL_ZONES,
  )
  return collection.features
}
