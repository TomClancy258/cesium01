import type { ShallowRef } from 'vue'
import * as Cesium from 'cesium'
import { useRiskRipple } from '@/views/aviation-situation/composables/useRiskRipple'

type AircraftRiskLevel = 'high' | 'medium' | 'normal'

interface SyncAircraftRiskRippleInput {
  icao24: string
  position: Cesium.Cartesian3
  riskLevel: AircraftRiskLevel
  visible: boolean
}

const HIGH_RISK_RIPPLE_IMAGE_URL = '/src/assets/img/effects/png/warning-circle-red.png'

export function useAircraftRiskRipple(viewer: ShallowRef<Cesium.Viewer>) {
  const riskRipple = useRiskRipple(viewer, {
    idPrefix: 'aircraft_high_risk_ripple',
    sourceType: 'aircraftHighRiskRipple',
    imageUrl: HIGH_RISK_RIPPLE_IMAGE_URL,
    color: '#F44336',
  })

  return {
    init: riskRipple.init,
    sync: (input: SyncAircraftRiskRippleInput) =>
      riskRipple.sync({
        id: input.icao24,
        position: input.position,
        riskLevel: input.riskLevel,
        visible: input.visible,
      }),
    remove: riskRipple.remove,
    clear: riskRipple.clear,
    destroy: riskRipple.destroy,
  }
}
