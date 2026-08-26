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
import { computeCircleRingPositions } from './radar-utils'
import { setRadarHoveredProperties } from './radar-hover-state'
import {
  clearAllRadarHighlight,
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

function createRadarGroundPrimitives(
  viewer: Cesium.Viewer,
  radar: RadarTable,
): RadarPrimitivePair {
  const center = Cesium.Cartesian3.fromDegrees(
    radar.center.longitude,
    radar.center.latitude,
    radar.center.height,
  )
  const pickId: RadarPickId = { sourceType: 'radar', id: radar.id }
  const baseStyle = {
    fillColor: RADAR_DEFAULT_STYLE.fillColor.clone(),
    outlineColor: RADAR_DEFAULT_STYLE.outlineColor.clone(),
  }

  const fillPrimitive = new Cesium.GroundPrimitive({
    geometryInstances: new Cesium.GeometryInstance({
      // GroundPrimitive 需要 Geometry 描述类（含 createShadowVolume），不能传 createGeometry() 的结果
      geometry: new Cesium.CircleGeometry({
        center,
        radius: radar.radiusMeters,
        height: 0,
        vertexFormat: Cesium.MaterialAppearance.VERTEX_FORMAT,
      }),
      id: pickId,
    }),
    appearance: new Cesium.MaterialAppearance({
      material: Cesium.Material.fromType('Color', {
        color: baseStyle.fillColor.clone(),
      }),
      translucent: true,
      flat: true,
    }),
    asynchronous: false,
  })

  const outlinePrimitive = new Cesium.GroundPolylinePrimitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.GroundPolylineGeometry({
        positions: computeCircleRingPositions(center, radar.radiusMeters),
        width: 2.0,
        loop: true,
      }),
    }),
    appearance: new Cesium.PolylineMaterialAppearance({
      material: Cesium.Material.fromType('Color', {
        color: baseStyle.outlineColor.clone(),
      }),
    }),
    asynchronous: false,
  })

  viewer.scene.groundPrimitives.add(fillPrimitive)
  viewer.scene.groundPrimitives.add(outlinePrimitive)

  return {
    fillPrimitive,
    outlinePrimitive,
    baseStyle,
  }
}

export function useRadar(viewer: ShallowRef<Cesium.Viewer>, options: UseRadarOptions = {}) {
  const radarStore = useRadarStore()
  const radarRenderMap = new Map<string, RadarRenderState>()

  const hideRadarTooltip = (): void => {
    setRadarHoveredProperties(null)
  }

  const removeRadarPrimitivePair = (pair: RadarPrimitivePair): void => {
    pair.fillPrimitive.destroy()
    pair.outlinePrimitive.destroy()
  }

  const clearRadars = (): void => {
    clearAllRadarHighlight()
    for (const [radarId, { primitives }] of radarRenderMap) {
      unregisterRadarPrimitivePair(radarId)
      removeRadarPrimitivePair(primitives)
    }
    radarRenderMap.clear()
    radarStore.clearMatchedRadars()
  }

  const drawRadars = (radars: Radar[]): void => {
    for (const radar of radars) {
      const primitives = createRadarGroundPrimitives(viewer.value, radar)
      registerRadarPrimitivePair(radar.id, primitives)
      radarRenderMap.set(radar.id, { data: radar, primitives })
    }
  }

  const loadAndDrawRadars = async (): Promise<void> => {
    try {
      const radars = await getRadars()
      console.log("radars", radars);
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
      primitives.outlinePrimitive.show = match

      if (match) {
        radarStore.setMatchedRadar(createMatchedRadar(radar))
      }
    })

    radarStore.commitMatchedRadars()
    options.onMatchedRadarsChanged?.()
  }, 300)

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
    setupRadarFilterFormWatch()
    subscribeRadarEvents()
  }

  onUnmounted(() => {
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
