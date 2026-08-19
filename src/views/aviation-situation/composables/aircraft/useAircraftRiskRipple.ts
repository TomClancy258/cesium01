import type { ShallowRef } from 'vue'
import * as Cesium from 'cesium'
import { useRiskRipple } from '@/views/aviation-situation/composables/useRiskRipple'
import highRiskRippleImageUrl from '@/assets/img/effects/png/danger-circle.png'
import mediumRiskRippleImageUrl from '@/assets/img/effects/png/warning-circle.png'

type AircraftRiskLevel = 'high' | 'medium' | 'normal'

interface SyncAircraftRiskRippleInput {
  icao24: string
  position: Cesium.Cartesian3
  riskLevel: AircraftRiskLevel
  visible: boolean
}

export function useAircraftRiskRipple(viewer: ShallowRef<Cesium.Viewer>) {
  const highRiskRipple = useRiskRipple(viewer, {
    idPrefix: 'aircraft_high_risk_ripple',
    sourceType: 'aircraftHighRiskRipple',
    imageUrl: highRiskRippleImageUrl,
    activeRiskLevel: 'high',
  })

  const mediumRiskRipple = useRiskRipple(viewer, {
    idPrefix: 'aircraft_medium_risk_ripple',
    sourceType: 'aircraftMediumRiskRipple',
    imageUrl: mediumRiskRippleImageUrl,
    activeRiskLevel: 'medium',
  })

  const sync = (input: SyncAircraftRiskRippleInput): void => {
    const payload = {
      id: input.icao24,
      position: input.position,
      riskLevel: input.riskLevel,
      visible: input.visible,
    }
    // 两边都 sync：非本级会 remove，避免 high↔medium 切换残留
    highRiskRipple.sync(payload)
    mediumRiskRipple.sync(payload)
  }

  const remove = (icao24: string): void => {
    highRiskRipple.remove(icao24)
    mediumRiskRipple.remove(icao24)
  }

  const clear = (): void => {
    highRiskRipple.clear()
    mediumRiskRipple.clear()
  }

  const destroy = (): void => {
    highRiskRipple.destroy()
    mediumRiskRipple.destroy()
  }

  /** 注入飞机图层下共用的 riskRippleBillboards，high/medium 都往里加圈 */
  const init = (billboardCollection: Cesium.BillboardCollection): void => {
    highRiskRipple.init(billboardCollection)
    mediumRiskRipple.init(billboardCollection)
  }

  return {
    init,
    sync,
    remove,
    clear,
    destroy,
  }
}
