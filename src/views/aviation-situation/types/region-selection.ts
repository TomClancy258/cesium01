import type { ControlZoneRawProperties } from '@/network/control-zone/type'
import type { DrawingToolSelectedData } from '@/views/aviation-situation/types/shared'

/** 管控区选中（底部抽屉「管控地区筛选」） */
export type ControlZoneRegionSelectedData = ControlZoneRawProperties & {
  sourceType: 'controlZone'
}

/**
 * 区域轨选中：测绘框选 / 测距 / 管控区互斥
 *（对标 aviation-selection 的实体轨）
 */
export type RegionSelectedData =
  | DrawingToolSelectedData
  | ControlZoneRegionSelectedData
