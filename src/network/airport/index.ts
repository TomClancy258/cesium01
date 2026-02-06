import request01 from '../request'
import type { Airport, RawAirport } from './type'

const API = {
  AIRPORTS_3W: '/airports/airports_3w.json',
  AIRPORTS_8W: '/airports/airports_8w.json',
} as const

// export const getAirports = (): Promise<Airport[]> =>
//   request01.get(API.AIRPORTS_3W)

export const getAirports = (): Promise<Airport[]> => {
  return request01.get<RawAirport[]>(API.AIRPORTS_3W).then(rawAirports => {
    return rawAirports.map(airport => ({
      icao: airport.icao,
      iata: airport.iata,
      name: airport.name,
      city: airport.city,
      country: airport.country,
      elevation: airport.elevation,
      subd: airport.subd,
      tz: airport.tz,
      lid: airport.lid,
      latitude: parseFloat(airport.lat),
      longitude: parseFloat(airport.lon),
    }))
  })
}

export const getAirports02 = (): Promise<Airport[]> =>
  request01.get(API.AIRPORTS_8W)
