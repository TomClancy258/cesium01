import flyDataRequest from '../request'
import type { Airport, RawAirport } from './type'

const API = {
  AIRPORTS_3W: '/airports/airports_3w.json',
  AIRPORTS_8W: '/airports/airports_8w.json',
} as const

// export const getAirports = (): Promise<Airport[]> =>
//   flyDataRequest.get(API.AIRPORTS_3W)

export const getAirports = (): Promise<Airport[]> => {
  return flyDataRequest.get<RawAirport[]>(API.AIRPORTS_3W).then(rawAirports => {
    return rawAirports.map(airport => ({
      icao: airport.icao,
      iata: airport.iata,
      name: airport.name,
      city: airport.city,
      country: airport.country,
      elevation: parseFloat(airport.elevation),
      subd: airport.subd,
      tz: airport.tz,
      lid: airport.lid,
      latitude: parseFloat(airport.lat),
      longitude: parseFloat(airport.lon),
      riskLevel: airport.riskLevel??'normal',
    }))
  })
}

export const getAirports02 = (): Promise<Airport[]> =>
  flyDataRequest.get(API.AIRPORTS_8W)
