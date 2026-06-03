import type { Aircraft } from '@/network/aircraft/types/aircraft'
import type { Airport } from '@/network/airport/type'
import type {
  ConeSnapshot,
  SatelliteConeScanResults,
  SatelliteConeSnapshotListener,
} from '@/views/aviation-situation/types/satellite.ts'

interface UseAviationCoordinatorOptions {
  registerAircraftAviationDataUpdatedListener: (listener: (() => void) | null) => void
  registerAirportAviationDataUpdatedListener: (listener: (() => void) | null) => void
  registerSatelliteDataUpdatedListener: (listener: SatelliteConeSnapshotListener | null) => void

  refreshActiveSpatialSelections: () => void
  refreshSatelliteConeScanWithAircraft: (
    coneSnapshots: ConeSnapshot[],
  ) => Map<string, Map<string, Aircraft>>
  refreshSatelliteConeScanWithAirport: (
    coneSnapshots: ConeSnapshot[],
  ) => Map<string, Map<string, Airport>>
}

export function useAviationCoordinator({
  registerAircraftAviationDataUpdatedListener,
  registerAirportAviationDataUpdatedListener,
  registerSatelliteDataUpdatedListener,

  refreshActiveSpatialSelections,
  refreshSatelliteConeScanWithAircraft, //useAircrafts.ts里将要在useSatellites.ts被调用的函数
  refreshSatelliteConeScanWithAirport, //同理
}: UseAviationCoordinatorOptions) {
  const handleAviationDataUpdated = () => {
    refreshActiveSpatialSelections()
  }

  const handleSatelliteDataUpdated: SatelliteConeSnapshotListener = (
    aircraftConeSnapshots,
    airportConeSnapshots,
  ): SatelliteConeScanResults => {
    return {
      aircraftBySatelliteId: refreshSatelliteConeScanWithAircraft(aircraftConeSnapshots),
      airportBySatelliteId: refreshSatelliteConeScanWithAirport(airportConeSnapshots),
    }
  }

  const initAviationCoordinator = () => {
    registerAircraftAviationDataUpdatedListener(handleAviationDataUpdated)
    registerAirportAviationDataUpdatedListener(handleAviationDataUpdated)

    registerSatelliteDataUpdatedListener(handleSatelliteDataUpdated)
  }

  const destroyAviationCoordinator = () => {
    registerAircraftAviationDataUpdatedListener(null)
    registerAirportAviationDataUpdatedListener(null)
    registerSatelliteDataUpdatedListener(null)
  }

  return {
    initAviationCoordinator,
    destroyAviationCoordinator,
  }
}
