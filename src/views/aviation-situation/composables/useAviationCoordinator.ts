interface UseAviationCoordinatorOptions {
  registerAircraftAviationDataUpdatedListener: (listener: (() => void) | null) => void
  registerAirportAviationDataUpdatedListener: (listener: (() => void) | null) => void
  refreshActiveSpatialSelections: () => void
}

export function useAviationCoordinator({
  registerAircraftAviationDataUpdatedListener,
  registerAirportAviationDataUpdatedListener,
  refreshActiveSpatialSelections,
}: UseAviationCoordinatorOptions) {
  const handleAviationDataUpdated = () => {
    refreshActiveSpatialSelections()
  }

  const initAviationCoordinator = () => {
    registerAircraftAviationDataUpdatedListener(handleAviationDataUpdated)
    registerAirportAviationDataUpdatedListener(handleAviationDataUpdated)
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
