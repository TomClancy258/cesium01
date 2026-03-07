import type {AircraftBillboardProperties,AircraftLabelProperties,AircraftSelectedData} from "./aircraft"
import type {AirportBillboardProperties,AirportLabelProperties,AirportSelectedData} from "./airport"

interface TooltipPosition {
  left: number
  top: number
}

export interface TooltipState<T> {
  visible: boolean
  position: TooltipPosition
  properties: T
}

export type MapBillboardLabelProperties =
  | AircraftBillboardProperties
  | AircraftLabelProperties
  | AirportBillboardProperties
  | AirportLabelProperties;

export type AviationSelectedData = AircraftSelectedData | AirportSelectedData | null

export interface LngLatAlt {
  longitude: number
  latitude: number
  height: number
}

export interface MeasurementSelectedData {
  id:string,
  type:string,
  sourceType:string
}
