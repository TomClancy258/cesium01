import type { TooltipState } from './shared'
import * as Cesium from "cesium"

export interface AirportBaseProperties{
  type: 'label' | 'billboard'
  sourceType: 'airport'
  icao: string // icao 代码
  country: string
  name: string
  longitude: number // 数字类型，不是字符串
  latitude: number // 数字类型，不是字符串
}

// Billboard 专用属性
export interface AirportBillboardProperties extends AirportBaseProperties {
  type: 'billboard'
  originalColor: Cesium.Color
}

// Label 专用属性
export interface AirportLabelProperties extends AirportBaseProperties {
  type: 'label'
  originalFillColor: Cesium.Color
}

export type AirportTooltipState = TooltipState<AirportBaseProperties>

export interface AirportFilterForm {
  icao: string
  country: string
  name: string
}

export interface AirportSelectedData {
  sourceType: 'airport';
  icao: string;
}

