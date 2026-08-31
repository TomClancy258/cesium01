import type { WallLevel, WallVisualStyle } from '@/network/wall/type'

export const wallVisualStyleOptions: { label: string; value: WallVisualStyle }[] = [
  { label: '分层环', value: 'layeredRing' },
  { label: '箭头墙', value: 'arrowWall' },
]

export const allWallVisualStyleValues: WallVisualStyle[] = wallVisualStyleOptions.map(
  (option) => option.value,
)

export const wallLevelOptions: { label: string; value: WallLevel }[] = [
  { label: '危险', value: 'danger' },
  { label: '警戒', value: 'warning' },
  { label: '正常', value: 'normal' },
]

export const allWallLevelValues: WallLevel[] = wallLevelOptions.map((option) => option.value)

export const getWallLevelLabel = (level: WallLevel | string): string => {
  const option = wallLevelOptions.find((item) => item.value === level)
  return option?.label ?? level
}

export const getWallVisualStyleLabel = (visualStyle: WallVisualStyle | string): string => {
  const option = wallVisualStyleOptions.find((item) => item.value === visualStyle)
  return option?.label ?? visualStyle
}

/** 国家树与卫星/雷达筛选共用 */
export {
  satelliteTreeData as wallCountryTreeData,
  selectedSatelliteContinentCountryValues as selectedWallCountryValues,
} from '@/views/aviation-situation/constants/satellite-filter-data'
