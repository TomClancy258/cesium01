import type { Aircraft } from '@/network/aircraft/types/aircraft'
import type { AircraftSelectedData } from '@/views/aviation-situation/types/aircraft'

/** selection / hovered 身份 */
export function toAircraftSelectedData(aircraft: Aircraft): AircraftSelectedData {
  return {
    sourceType: 'aircraft',
    icao24: aircraft.icao24,
  }
}
