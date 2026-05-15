import type {ConeSnapshot} from "@/views/aviation-situation/types/satellite.ts"

interface UseAviationCoordinatorOptions {
  registerAircraftAviationDataUpdatedListener: (listener: (() => void) | null) => void
  registerAirportAviationDataUpdatedListener: (listener: (() => void) | null) => void
  registerSatelliteDataUpdatedListener: (listener: ((coneSnapshot:ConeSnapshot[]) => void) | null) => void

  refreshActiveSpatialSelections: () => void
  refreshSatelliteConeScanWithAircraft: (coneSnapshots:ConeSnapshot[]) => void
  refreshSatelliteConeScanWithAirport: (coneSnapshots:ConeSnapshot[]) => void
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
  const handleSatelliteDataUpdated = (coneSnapshots:ConeSnapshot[]) => {
    refreshSatelliteConeScanWithAircraft(coneSnapshots)
    refreshSatelliteConeScanWithAirport(coneSnapshots)
  }

  const initAviationCoordinator = () => {
    registerAircraftAviationDataUpdatedListener(handleAviationDataUpdated)
    registerAirportAviationDataUpdatedListener(handleAviationDataUpdated)

    //把refreshSatelliteConeScanWithAircraft、refreshSatelliteConeScanWithAirport函数传到useSatellites.ts里取
    //即listener指向了handleSatelliteDataUpdated，listener就是handleSatelliteDataUpdated
    registerSatelliteDataUpdatedListener(handleSatelliteDataUpdated)
  }

  const destroyAviationCoordinator = () => {
    registerAircraftAviationDataUpdatedListener(null)
    registerAirportAviationDataUpdatedListener(null)
  }

  return {
    initAviationCoordinator,
    destroyAviationCoordinator,
  }
}
