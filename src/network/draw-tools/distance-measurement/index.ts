import request01 from '../../request'

const API = {
  DISTANCE_MEASUREMENT: '/draw-tools/distance-measurement.json',
} as const

export const getDistanceMeasurements = (): Promise<Airport[]> =>
  request01.get(API.DISTANCE_MEASUREMENT)
