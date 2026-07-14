import flyDataRequest from '../request'
import type { Satellite, RawSatellite } from './type'

const API = {
  SATELLITES: '/satellite/satellites.json',
} as const

export const getSatellites = (): Promise<Satellite[]> => {
  return flyDataRequest.get<RawSatellite[]>(API.SATELLITES).then(rawSatellites => {
    return rawSatellites.map(rawSatellite => ({
      id: rawSatellite.id,
      name: rawSatellite.name,
      country: rawSatellite.country,
      description: rawSatellite.description,
      lngLatAlt:rawSatellite.lngLatAlt,
      availability: rawSatellite.availability,
      scan:{...rawSatellite.scan},
      position: {
        epoch:rawSatellite.position.epoch,
        referenceFrame:rawSatellite.position.referenceFrame,
        cartesian:rawSatellite.position.cartesian,
        interpolationDegree:rawSatellite.position.interpolationDegree,
        interpolationAlgorithm:rawSatellite.position.interpolationAlgorithm,
      },
    }))
  })
}

