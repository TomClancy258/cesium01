import { onUnmounted, watch } from 'vue'
import type { ShallowRef } from 'vue'
import * as Cesium from 'cesium'
import { useDebounceFn } from '@vueuse/core'
import { getRadars } from '@/network/radar'
import type { Radar } from '@/network/radar/type'
import { useRadarStore } from '@/stores/radar'
import type {
  RadarPickId,
  RadarTable,
  RadarTableRowOperation,
} from '@/views/aviation-situation/types/radar'
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
  clearRadarRegistry,
  forEachRadarRenderState,
  getAllRadarScanMaterials,
  getRadarRenderState,
  registerRadar,
  type RadarPrimitivePair,
} from './radar-registry'
import { clearAllRadarHighlight } from '@/views/aviation-situation/composables/highlight-manager/radar-highlight-manager'
import { flyToLngLatAlt } from '@/utils/geoUtils'
import { selectRadarRegion } from '@/views/aviation-situation/composables/selection/useRegionSelectionActions'

type RadarFilterQuery = {
  id?: string
  name?: string
  countries: Set<string>
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
    forEachRadarRenderState(({ primitives }) => {
      removeRadarPrimitivePair(viewer.value, primitives)
    })
    clearRadarRegistry()
    radarStore.clearMatchedRadars()
  }

  const drawRadars = (radars: Radar[]): void => {
    for (const radar of radars) {
      const primitives:RadarPrimitivePair = createRadarGroundPrimitive(radar)
      viewer.value.scene.groundPrimitives.add(primitives.fillPrimitive)
      registerRadar(radar.id, { data: radar, primitives })
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
      name: form.name?.trim().toLowerCase(),
      countries: new Set(form.countries),
    }

    forEachRadarRenderState(({ data: radar, primitives }) => {
      const countryMatch = query.countries.has(radar.country)
      const detectMatch =
        form.detectAircraft === 'all' ||
        (form.detectAircraft === 'yes' && radar.detectAircraft) ||
        (form.detectAircraft === 'no' && !radar.detectAircraft)
      const match =
        (!query.id || radar.id.toLowerCase().includes(query.id)) &&
        (!query.name || radar.name.toLowerCase().includes(query.name)) &&
        countryMatch &&
        detectMatch &&
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
  let unsubRadarLeftClick: () => void
  let unsubRadarTableOperationClicked: () => void

  const flyToRadarById = (id: string): void => {
    const renderState = getRadarRenderState(id)
    if (!renderState) return
    const { center, radiusMeters } = renderState.data
    flyToLngLatAlt(
      viewer,
      {
        longitude: center.longitude,
        latitude: center.latitude-0.25,
        height: center.height,
      },
      Math.max(radiusMeters * 4, 50_000),
    )
  }

  const subscribeRadarEvents = (): void => {
    unsubRadarHover = onCesiumEvent(
      'radarHover',
      (pickId: RadarPickId, _screenPosition: Cesium.Cartesian2) => {
        const renderState = getRadarRenderState(pickId.id)
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

    unsubRadarLeftClick = onCesiumEvent('radarLeftClick', (pickId: RadarPickId) => {
      const renderState = getRadarRenderState(pickId.id)
      if (!renderState) return
      selectRadarRegion({
        sourceType: 'radar',
        id: renderState.data.id,
        name: renderState.data.name,
      })
    })

    unsubRadarTableOperationClicked = onCesiumEvent(
      'radarTableOperationClicked',
      (operation: RadarTableRowOperation) => {
        const renderState = getRadarRenderState(operation.id)
        if (!renderState) return
        selectRadarRegion({
          sourceType: 'radar',
          id: renderState.data.id,
          name: renderState.data.name,
        })
        flyToRadarById(operation.id)
      },
    )
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
    unsubRadarLeftClick?.()
    unsubRadarTableOperationClicked?.()
  })

  return {
    initRadars,
    loadAndDrawRadars,
    clearRadars,
    filterRadars,
    flyToRadarById,
  }
}
