import flyDataRequest from '../../request'

const API = {
  DISTANCE_MEASUREMENT: '/draw-tools/distance-measurement.json',
} as const

export const getDistanceMeasurements = (): Promise<Airport[]> =>
  flyDataRequest.get(API.DISTANCE_MEASUREMENT)
