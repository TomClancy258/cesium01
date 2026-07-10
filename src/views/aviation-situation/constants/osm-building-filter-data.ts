import type {
  OSMBuildingTypeFilterOption,
  OSMBuildingTypeFilterValue,
} from '@/views/aviation-situation/types/osm-building'

export const osmBuildingTypeOptions: OSMBuildingTypeFilterOption[] = [
  { label: '零售', value: 'retail' },
  { label: '商业', value: 'commercial' },
  { label: '未知', value: 'yes' },
  { label: '工业', value: 'industrial' },
  { label: '公寓', value: 'apartments' },
  { label: '住宅', value: 'residential' },
  { label: '办公', value: 'office' },
  { label: '停车场', value: 'parking' },
  { label: '其它', value: 'others' },
]

export const allOSMBuildingTypeValues: OSMBuildingTypeFilterValue[] =
  osmBuildingTypeOptions.map((option) => option.value)
