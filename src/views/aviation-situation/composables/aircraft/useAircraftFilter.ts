import { useDebounceFn } from '@vueuse/core'
import type * as Cesium from 'cesium'
import type { Aircraft } from '@/network/aircraft/types/aircraft'
import type { AircraftFilterForm, AircraftGraphic } from '@/views/aviation-situation/types/aircraft'
import type { AviationRenderItem, AviationSelectedData } from '@/views/aviation-situation/types/shared'

type AircraftFilterQuery = Pick<AircraftFilterForm, 'icao24' | 'callsign' | 'originCountries' | 'riskLevel'>

interface UseAircraftFilterOptions {
  renderMap: Map<string, AviationRenderItem<Aircraft>>
  aircraftGraphic: AircraftGraphic
  aircraftFilterForm: AircraftFilterForm
  clearMatchedAircrafts: () => void
  addMatchedAircrafts: (aircraft: Aircraft) => void
  commitMatchedAircrafts: () => void
  getSelected: () => AviationSelectedData
  onSyncRiskRipple: (aircraft: Aircraft, billboard: Cesium.Billboard, isMatch: boolean) => void
  onFinishedSpatialSelection: () => void
  onAviationDataUpdated: () => void
  onHighlightAircraftByControlZone: () => void
}

export function useAircraftFilter(options: UseAircraftFilterOptions) {
  const {
    renderMap,
    aircraftGraphic,
    aircraftFilterForm,
    clearMatchedAircrafts,
    addMatchedAircrafts,
    commitMatchedAircrafts,
    getSelected,
    onSyncRiskRipple,
    onFinishedSpatialSelection,
    onHighlightAircraftByControlZone,
    onAviationDataUpdated,
  } = options

  const filterAircrafts = useDebounceFn((): void => {
    clearMatchedAircrafts()

    const query: AircraftFilterQuery = {
      icao24: aircraftFilterForm.icao24?.trim().toLowerCase(),
      callsign: aircraftFilterForm.callsign?.trim().toLowerCase(),
      originCountries: aircraftFilterForm.originCountries,
      riskLevel: aircraftFilterForm.riskLevel,
    }

    const originCountriesSet = new Set(query.originCountries)

    let isSelectedAircraftMatched = false

    renderMap.forEach(({ data: aircraft, billboard, label }) => {
      const match =
        (!query.icao24 || aircraft.icao24.toLowerCase().includes(query.icao24)) &&
        (!query.callsign || (aircraft.callsign ?? '').toLowerCase().includes(query.callsign)) &&
        originCountriesSet.has(aircraft.originCountry) &&
        (query.riskLevel === 'all' || aircraft.riskLevel === query.riskLevel) &&
        aircraftFilterForm.visible

      if (match) {
        addMatchedAircrafts(aircraft)

        const selected = getSelected()
        if (selected?.sourceType === 'aircraft' && aircraft.icao24 === selected.icao24) {
          isSelectedAircraftMatched = true
        }
      }

      billboard.show = match
      if (aircraftFilterForm.labelVisible && label) {
        label.show = match
      }
      onSyncRiskRipple(aircraft, billboard, match)
    })

    aircraftGraphic.primitives.selectedAircraft.routePolylines.show = isSelectedAircraftMatched
    if (aircraftGraphic.primitiveContainer) {
      aircraftGraphic.primitiveContainer.show = aircraftFilterForm.visible
    }

    commitMatchedAircrafts()
    onFinishedSpatialSelection()
    onHighlightAircraftByControlZone()
    onAviationDataUpdated()
  }, 300)

  return {
    filterAircrafts,
  }
}
