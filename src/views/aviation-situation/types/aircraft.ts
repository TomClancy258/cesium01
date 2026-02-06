import type {TooltipState} from './shared'
import * as Cesium from "cesium"

export interface AircraftBaseProperties {
  type: 'label' | 'billboard'
  sourceType: 'aircraft'
  icao24: string
  origin_country: string
  callsign: string
  longitude: number
  latitude: number
  baro_altitude: number
  heading: number
}

// Billboard 专用属性
export interface AircraftBillboardProperties extends AircraftBaseProperties {
  type: 'billboard'
  originalColor: Cesium.Color
}

// Label 专用属性
export interface AircraftLabelProperties extends AircraftBaseProperties {
  type: 'label'
  originalFillColor: Cesium.Color
}

export type AircraftTooltipState = TooltipState<AircraftBaseProperties>

export interface AircraftFilterForm {
  icao24: string
  origin_country: string
  callsign: string
}
