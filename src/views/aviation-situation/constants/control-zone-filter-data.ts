import type {
  ControlZoneLevelFilterOption,
  ControlZoneLevelFilterValue,
} from '@/views/aviation-situation/types/control-zone'
import type { ControlZoneLevel } from '@/network/control-zone/type'

export const controlZoneLevelOptions: ControlZoneLevelFilterOption[] = [
  { label: '警戒', value: 'warning' },
  { label: '危险', value: 'danger' },
  { label: '提示', value: 'info' },
  { label: '正常', value: 'normal' },
]

export const allControlZoneLevelValues: ControlZoneLevelFilterValue[] =
  controlZoneLevelOptions.map((option) => option.value)

export const getControlZoneLevelLabel = (level: ControlZoneLevel | string): string => {
  const option = controlZoneLevelOptions.find((item) => item.value === level)
  return option?.label ?? level
}
