import type { Airport } from '@/network/airport/type'
import type { AirportSelectedData } from '@/views/aviation-situation/types/airport'

/** selection / hovered 身份 */
export function toAirportSelectedData(airport: Airport): AirportSelectedData {
  return {
    sourceType: 'airport',
    icao: airport.icao,
  }
}
