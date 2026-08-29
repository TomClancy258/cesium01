import type { RadarDetectAircraftFilter } from '@/views/aviation-situation/types/radar'

export const radarDetectAircraftOptions: {
  label: string
  value: RadarDetectAircraftFilter
}[] = [
  { label: '全部', value: 'all' },
  { label: '是', value: 'yes' },
  { label: '否', value: 'no' },
]

/** 国家树与卫星筛选共用（含欧洲等雷达常见国家） */
export {
  satelliteTreeData as radarCountryTreeData,
  selectedSatelliteContinentCountryValues as selectedRadarCountryValues,
} from '@/views/aviation-situation/constants/satellite-filter-data'
