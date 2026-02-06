import request01 from '../request'
import type  { AircraftStatesResponse } from './type'

const API = {
  AIRCRAFT: '/airplanes/data.json',
} as const

export const getAircrafts = (): Promise<AircraftStatesResponse[]> =>
  request01.get(API.AIRCRAFT)
