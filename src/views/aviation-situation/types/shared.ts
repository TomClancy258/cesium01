interface TooltipPosition {
  left: number
  top: number
}

export interface TooltipState<T> {
  visible: boolean
  position: TooltipPosition
  properties: T
}

export type PrimitiveProperties =
  | AircraftBillboardProperties
  | AircraftLabelProperties
  | AirportBillboardProperties
  | AirportLabelProperties;
