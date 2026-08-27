import { onUnmounted, watch } from 'vue'
import type { ShallowRef } from 'vue'
import * as Cesium from 'cesium'
import { useDebounceFn } from '@vueuse/core'
import { getRadars } from '@/network/radar'
import type { Radar } from '@/network/radar/type'
import { useRadarStore } from '@/stores/radar'
import type { RadarTable } from '@/views/aviation-situation/types/radar'
import { createMatchedRadar } from '@/views/aviation-situation/types/radar'
import { onCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import { RADAR_DEFAULT_STYLE } from './radar-constants'
import { toRadarHoveredProperties } from './radar-property-utils'
import { setRadarHoveredProperties } from './radar-hover-state'
import {
  createGroundRadarScanMaterial,
  registerGroundRadarScanMaterial,
  updateGroundRadarScanMaterialTime,
} from './ground-radar-scan-material/ground-radar-scan-material'
import {
  clearAllRadarHighlight,
  getAllRadarScanMaterials,
  registerRadarPrimitivePair,
  unregisterRadarPrimitivePair,
  type RadarPickId,
  type RadarPrimitivePair,
} from './radar-highlight-manager'

type RadarFilterQuery = {
  id?: string
  countries: Set<string>
}

type RadarRenderState = {
  data: RadarTable
  primitives: RadarPrimitivePair
}

export interface UseRadarOptions {
  onMatchedRadarsChanged?: () => void
}

function createRadarGroundPrimitive(
  radar: RadarTable,
): RadarPrimitivePair {
  const center = Cesium.Cartesian3.fromDegrees(
    radar.center.longitude,
    radar.center.latitude,
    radar.center.height,
  )
  const pickId: RadarPickId = { sourceType: 'radar', id: radar.id }
  const baseStyle = {
    color: RADAR_DEFAULT_STYLE.color.clone(),
    highlight: RADAR_DEFAULT_STYLE.highlight,
  }

  const scanMaterial = createGroundRadarScanMaterial({
    color: baseStyle.color,
  })

  const fillPrimitive = new Cesium.GroundPrimitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.CircleGeometry({
        center,
        radius: radar.radiusMeters,
        height: 0,
        vertexFormat: Cesium.MaterialAppearance.VERTEX_FORMAT,
      }),
      id: pickId,
    }),
    appearance: new Cesium.MaterialAppearance({
      material: scanMaterial,
      translucent: true,
      flat: true,
    }),
    asynchronous: false,
  })

  return {
    fillPrimitive,
    scanMaterial,
    baseStyle,
  }
}

export function useRadar(viewer: ShallowRef<Cesium.Viewer>, options: UseRadarOptions = {}) {
  const radarStore = useRadarStore()
  const radarRenderMap = new Map<string, RadarRenderState>()

  registerGroundRadarScanMaterial()

  const hideRadarTooltip = (): void => {
    setRadarHoveredProperties(null)
  }

  const removeRadarPrimitivePair = (
    viewerRef: Cesium.Viewer,
    pair: RadarPrimitivePair,
  ): void => {
    viewerRef.scene.groundPrimitives.remove(pair.fillPrimitive)
    pair.fillPrimitive.destroy()
  }

  const clearRadars = (): void => {
    clearAllRadarHighlight()
    for (const [radarId, { primitives }] of radarRenderMap) {
      unregisterRadarPrimitivePair(radarId)
      removeRadarPrimitivePair(viewer.value, primitives)
    }
    radarRenderMap.clear()
    radarStore.clearMatchedRadars()
  }

  const drawRadars = (radars: Radar[]): void => {
    for (const radar of radars) {
      const primitives = createRadarGroundPrimitive(radar)
      viewer.value.scene.groundPrimitives.add(primitives.fillPrimitive)
      registerRadarPrimitivePair(radar.id, primitives)
      radarRenderMap.set(radar.id, { data: radar, primitives })
    }
  }

  const loadAndDrawRadars = async (): Promise<void> => {
    try {
      const radars = await getRadars()
      clearRadars()
      if (radars.length === 0) {
        console.warn('[useRadar] radar list is empty')
        return
      }
      drawRadars(radars)
      filterRadars()
    } catch (error) {
      console.error('[useRadar] failed to load radars', error)
    }
  }

  const filterRadars = useDebounceFn((): void => {
    radarStore.clearMatchedRadars()

    const form = radarStore.radarFilterForm
    const query: RadarFilterQuery = {
      id: form.id?.trim().toLowerCase(),
      countries: new Set(form.countries),
    }

    radarRenderMap.forEach(({ data: radar, primitives }) => {
      const countryMatch =
        query.countries.size === 0 || query.countries.has(radar.country)
      const match =
        (!query.id || radar.id.toLowerCase().includes(query.id)) &&
        countryMatch &&
        form.visible

      primitives.fillPrimitive.show = match

      if (match) {
        radarStore.setMatchedRadar(createMatchedRadar(radar))
      }
    })

    radarStore.commitMatchedRadars()
    options.onMatchedRadarsChanged?.()
  }, 300)

  let unsubClockTick: Cesium.Event.RemoveCallback | undefined

  const subscribeRadarScanAnimation = (): void => {
    const onTick = (): void => {
      const clockTime = viewer.value.clock.currentTime
      for (const material of getAllRadarScanMaterials()) {
        updateGroundRadarScanMaterialTime(material, clockTime)
      }
    }
    unsubClockTick = viewer.value.clock.onTick.addEventListener(onTick)
  }

  let unwatchRadarFilterForm: () => void
  const setupRadarFilterFormWatch = (): void => {
    unwatchRadarFilterForm = watch(
      () => radarStore.radarFilterForm,
      () => {
        filterRadars()
      },
      { deep: true },
    )
  }

  let unsubRadarHover: () => void
  let unsubRadarLeave: () => void

  const subscribeRadarEvents = (): void => {
    unsubRadarHover = onCesiumEvent(
      'radarHover',
      (pickId: RadarPickId, _screenPosition: Cesium.Cartesian2) => {
        const renderState = radarRenderMap.get(pickId.id)
        if (!renderState) return

        const matched = radarStore.matchedRadarMap.get(pickId.id)
        const aircraftCount = matched?.aircraft.aircraftMap.size ?? 0
        setRadarHoveredProperties(
          toRadarHoveredProperties(renderState.data, aircraftCount),
        )
      },
    )

    unsubRadarLeave = onCesiumEvent('radarLeave', () => {
      hideRadarTooltip()
    })
  }

  const initRadars = (): void => {
    loadAndDrawRadars()
    subscribeRadarScanAnimation()
    setupRadarFilterFormWatch()
    subscribeRadarEvents()
  }

  onUnmounted(() => {
    unsubClockTick?.()
    clearRadars()
    unwatchRadarFilterForm?.()
    unsubRadarHover?.()
    unsubRadarLeave?.()
  })

  return {
    initRadars,
    loadAndDrawRadars,
    clearRadars,
    radarRenderMap,
  }
}
