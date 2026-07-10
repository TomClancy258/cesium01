export const EMPTY_DETAIL = '--'

export const UNNAMED_LABEL = '未命名'

export const displayDetailValue = (value: string | number | null | undefined): string | number => {
  if (value === null || value === undefined || value === '') return EMPTY_DETAIL
  return value
}

export const displayDetailType = (value: string | number | null | undefined): string | number => {
  if (value === null || value === undefined || value === '') return EMPTY_DETAIL
  else if (value === 'yes') {
    return '未知'
  }else {
    return value
  }
}

export const displayDetailHeight = (height: number | null | undefined, unit = ' m'): string => {
  if (height === null || height === undefined) return EMPTY_DETAIL
  return `${height}${unit}`
}

export const displayDetailName = (name: string | null | undefined): string => {
  if (name === null || name === undefined || name === '') return UNNAMED_LABEL
  return name
}

export const displayDetailCoordinate = (value: number | null | undefined, fractionDigits = 4): string => {
  if (value === null || value === undefined) return EMPTY_DETAIL
  return value.toFixed(fractionDigits)
}
