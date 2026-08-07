import type { Aircraft } from '@/network/aircraft/types/aircraft'
import type {
  AircraftBaseProperties,
  AircraftSelectedData,
} from '@/views/aviation-situation/types/aircraft'

/** 从 renderMap.data 组装 tooltip / hover 业务快照 */
export function toAircraftBaseProperties(aircraft: Aircraft): AircraftBaseProperties {
  return {
    type: 'billboard',
    sourceType: 'aircraft',
    icao24: aircraft.icao24,
    originCountry: aircraft.originCountry,
    callsign: aircraft.callsign ?? '',
    heading: aircraft.heading ?? 0,
    lngLatAlt: {
      longitude: aircraft.longitude ?? 0,
      latitude: aircraft.latitude ?? 0,
      baroAltitude: aircraft.baroAltitude ?? 0,
    },
  }
}

/** 从 renderMap.data 组装选中态业务快照 */
export function toAircraftSelectedData(aircraft: Aircraft): AircraftSelectedData {
  return {
    sourceType: 'aircraft',
    icao24: aircraft.icao24,
    originCountry: aircraft.originCountry,
    callsign: aircraft.callsign ?? '',
    heading: aircraft.heading ?? 0,
    lngLatAlt: {
      longitude: aircraft.longitude ?? 0,
      latitude: aircraft.latitude ?? 0,
      baroAltitude: aircraft.baroAltitude ?? 0,
    },
  }
}
