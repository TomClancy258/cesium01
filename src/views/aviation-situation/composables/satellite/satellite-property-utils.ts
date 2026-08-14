import type { Satellite } from '@/network/satellite/type'
import type { SatelliteSelectedData } from '@/views/aviation-situation/types/satellite'

/** selection / hovered 身份 */
export function toSatelliteSelectedData(satellite: Satellite): SatelliteSelectedData {
  return {
    id: satellite.id,
    sourceType: 'satellite',
  }
}
