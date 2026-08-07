import type { Airport } from '@/network/airport/type'
import type {
  AirportBaseProperties,
  AirportSelectedData,
} from '@/views/aviation-situation/types/airport'

/** 从 renderMap.data 组装 tooltip / hover 业务快照 */
export function toAirportBaseProperties(airport: Airport): AirportBaseProperties {
  return {
    type: 'billboard',
    sourceType: 'airport',
    icao: airport.icao,
    country: airport.country,
    name: airport.name,
    lngLatAlt: {
      longitude: airport.longitude,
      latitude: airport.latitude,
      elevation: airport.elevation,
    },
  }
}

/** 从 renderMap.data 组装选中态业务快照 */
export function toAirportSelectedData(airport: Airport): AirportSelectedData {
  return {
    sourceType: 'airport',
    icao: airport.icao,
    country: airport.country,
    name: airport.name,
    lngLatAlt: {
      longitude: airport.longitude,
      latitude: airport.latitude,
      elevation: airport.elevation,
    },
  }
}
