import { onUnmounted, watch } from 'vue'
import type { ShallowRef } from 'vue'
import * as Cesium from 'cesium'
import { useDebounceFn } from '@vueuse/core'
import { getWalls } from '@/network/wall'
import type { Wall } from '@/network/wall/type'
import { useWallStore } from '@/stores/wall'
import type {
  WallPickId,
  WallTable,
  WallTableRowOperation,
} from '@/views/aviation-situation/types/wall'
import { createMatchedWall } from '@/views/aviation-situation/types/wall'
import { onCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import {
  WALL_ARROW_IMAGES,
  WALL_ARROW_WALL_DEFAULTS,
  WALL_INTERACTION_STYLE,
  WALL_LAYERED_RING_DEFAULTS,
  WALL_LEVEL_COLORS,
} from './wall-constants'
import { toWallHoveredProperties } from './wall-property-utils'
import { setWallHoveredProperties } from './wall-hover-state'
import {
  createLayeredRingWallMaterial,
  registerLayeredRingWallMaterial,
  updateLayeredRingWallMaterialTime,
} from './layered-ring-wall-material/layered-ring-wall-material'
import {
  createArrowWallMaterial,
  registerArrowWallMaterial,
  updateArrowWallMaterialTime,
} from './arrow-wall-material/arrow-wall-material'
import {
  clearWallRegistry,
  forEachWallRenderState,
  getAllWallRenderStatesForAnimation,
  getWallMaterial,
  getWallRenderState,
  registerWall,
  type WallPrimitivePair,
} from './wall-registry'
import { clearAllWallHighlight } from '@/views/aviation-situation/composables/highlight-manager/wall-highlight-manager'
import { flyToLngLatAlt } from '@/utils/geoUtils'
import { selectWallRegion } from '@/views/aviation-situation/composables/selection/useRegionSelectionActions'
import {
  buildWallTable,
  getWallCentroid,
  wallPositionsToDegreesArray,
} from './wall-utils'

type WallFilterQuery = {
  id?: string
  name?: string
  visualStyles: Set<string>
  countries: Set<string>
  levels: Set<string>
}

export interface UseWallOptions {
  onMatchedWallsChanged?: () => void
}

function createWallPrimitive(wall: WallTable): WallPrimitivePair {
  const pickId: WallPickId = { sourceType: 'wall', id: wall.id }
  const positions = Cesium.Cartesian3.fromDegreesArray(wallPositionsToDegreesArray(wall.positions))

  if (wall.visualStyle === 'layeredRing') {
    const color = WALL_LEVEL_COLORS[wall.level].clone()
    const baseStyle = {
      kind: 'layeredRing' as const,
      color,
    }
    const material = createLayeredRingWallMaterial({
      color,
      durationMs: WALL_LAYERED_RING_DEFAULTS.durationMs,
    })

    const wallPrimitive = new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: Cesium.WallGeometry.fromConstantHeights({
          positions,
          minimumHeight: wall.minAltitude,
          maximumHeight: wall.maxAltitude,
        }),
        id: pickId,
      }),
      appearance: new Cesium.MaterialAppearance({
        material,
        translucent: true,
        closed: false,
      }),
      asynchronous: false,
    })

    return {
      wallPrimitive,
      visualStyle: wall.visualStyle,
      baseStyle,
      durationMs: WALL_LAYERED_RING_DEFAULTS.durationMs,
    }
  }

  const image = WALL_ARROW_IMAGES[wall.level]
  const scrollDurationMs = WALL_ARROW_WALL_DEFAULTS.scrollDurationMs
  const baseStyle = {
    kind: 'arrowWall' as const,
    image,
  }
  const material = createArrowWallMaterial({
    image,
    scrollDurationMs,
  })

  const wallPrimitive = new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: Cesium.WallGeometry.fromConstantHeights({
        positions,
        minimumHeight: wall.minAltitude,
        maximumHeight: wall.maxAltitude,
      }),
      id: pickId,
    }),
    appearance: new Cesium.MaterialAppearance({
      material,
      translucent: true,
      closed: false,
    }),
    asynchronous: false,
  })

  return {
    wallPrimitive,
    visualStyle: wall.visualStyle,
    baseStyle,
    durationMs: scrollDurationMs,
  }
}

export function useWall(viewer: ShallowRef<Cesium.Viewer>, options: UseWallOptions = {}) {
  const wallStore = useWallStore()

  registerLayeredRingWallMaterial()
  registerArrowWallMaterial()

  const hideWallTooltip = (): void => {
    setWallHoveredProperties(null)
  }

  const removeWallPrimitive = (
    viewerRef: Cesium.Viewer,
    pair: WallPrimitivePair,
  ): void => {
    viewerRef.scene.primitives.remove(pair.wallPrimitive)
    pair.wallPrimitive.destroy()
  }

  const clearWalls = (): void => {
    clearAllWallHighlight()
    forEachWallRenderState(({ primitives }) => {
      removeWallPrimitive(viewer.value, primitives)
    })
    clearWallRegistry()
    wallStore.clearMatchedWalls()
  }

  const drawWalls = (walls: Wall[]): void => {
    for (const wall of walls) {
      const wallTable = buildWallTable(wall)
      const primitives = createWallPrimitive(wallTable)
      viewer.value.scene.primitives.add(primitives.wallPrimitive)
      registerWall(wall.id, { data: wallTable, primitives })
    }
  }

  const loadAndDrawWalls = async (): Promise<void> => {
    try {
      const walls = await getWalls()
      clearWalls()
      if (walls.length === 0) {
        console.warn('[useWall] wall list is empty')
        return
      }
      drawWalls(walls)
      filterWalls()
    } catch (error) {
      console.error('[useWall] failed to load walls', error)
    }
  }

  const filterWalls = useDebounceFn((): void => {
    wallStore.clearMatchedWalls()

    const form = wallStore.wallFilterForm
    const query: WallFilterQuery = {
      id: form.id?.trim().toLowerCase(),
      name: form.name?.trim().toLowerCase(),
      visualStyles: new Set(form.visualStyles),
      countries: new Set(form.countries),
      levels: new Set(form.levels),
    }

    forEachWallRenderState(({ data: wall, primitives }) => {
      const match =
        (!query.id || wall.id.toLowerCase().includes(query.id)) &&
        (!query.name || wall.name.toLowerCase().includes(query.name)) &&
        query.visualStyles.has(wall.visualStyle) &&
        query.countries.has(wall.country) &&
        query.levels.has(wall.level) &&
        form.visible

      primitives.wallPrimitive.show = match

      if (match) {
        wallStore.setMatchedWall(createMatchedWall(wall))
      }
    })

    wallStore.commitMatchedWalls()
    options.onMatchedWallsChanged?.()
  }, 300)

  let unsubClockTick: Cesium.Event.RemoveCallback | undefined

  const subscribeWallAnimation = (): void => {
    const onTick = (): void => {
      const clockTime = viewer.value.clock.currentTime
      for (const state of getAllWallRenderStatesForAnimation()) {
        const material = getWallMaterial(state.primitives)
        if (state.primitives.visualStyle === 'layeredRing') {
          updateLayeredRingWallMaterialTime(
            material,
            clockTime,
            state.primitives.durationMs,
          )
        } else {
          updateArrowWallMaterialTime(
            material,
            clockTime,
            state.primitives.durationMs,
          )
        }
      }
    }
    unsubClockTick = viewer.value.clock.onTick.addEventListener(onTick)
  }

  let unwatchWallFilterForm: () => void
  const setupWallFilterFormWatch = (): void => {
    unwatchWallFilterForm = watch(
      () => wallStore.wallFilterForm,
      () => {
        filterWalls()
      },
      { deep: true },
    )
  }

  let unsubWallHover: () => void
  let unsubWallLeave: () => void
  let unsubWallLeftClick: () => void
  let unsubWallTableOperationClicked: () => void

  const flyToWallById = (id: string): void => {
    const renderState = getWallRenderState(id)
    if (!renderState) return
    const [longitude, latitude] = getWallCentroid(renderState.data)
    const heightSpan = renderState.data.maxAltitude - renderState.data.minAltitude
    flyToLngLatAlt(
      viewer,
      {
        longitude,
        latitude: latitude - 0.25,
        height: renderState.data.maxAltitude,
      },
      Math.max(heightSpan * 20, 50_000),
    )
  }

  const subscribeWallEvents = (): void => {
    unsubWallHover = onCesiumEvent(
      'wallHover',
      (pickId: WallPickId, _screenPosition: Cesium.Cartesian2) => {
        const renderState = getWallRenderState(pickId.id)
        if (!renderState) return

        const matched = wallStore.matchedWallMap.get(pickId.id)
        const aircraftCount = matched?.aircraft.aircraftMap.size ?? 0
        setWallHoveredProperties(
          toWallHoveredProperties(renderState.data, aircraftCount),
        )
      },
    )

    unsubWallLeave = onCesiumEvent('wallLeave', () => {
      hideWallTooltip()
    })

    unsubWallLeftClick = onCesiumEvent('wallLeftClick', (pickId: WallPickId) => {
      const renderState = getWallRenderState(pickId.id)
      if (!renderState) return
      selectWallRegion({
        sourceType: 'wall',
        id: renderState.data.id,
        name: renderState.data.name,
      })
    })

    unsubWallTableOperationClicked = onCesiumEvent(
      'wallTableOperationClicked',
      (operation: WallTableRowOperation) => {
        const renderState = getWallRenderState(operation.id)
        if (!renderState) return
        selectWallRegion({
          sourceType: 'wall',
          id: renderState.data.id,
          name: renderState.data.name,
        })
        flyToWallById(operation.id)
      },
    )
  }

  const initWalls = (): void => {
    loadAndDrawWalls()
    subscribeWallAnimation()
    setupWallFilterFormWatch()
    subscribeWallEvents()
  }

  onUnmounted(() => {
    unsubClockTick?.()
    clearWalls()
    unwatchWallFilterForm?.()
    unsubWallHover?.()
    unsubWallLeave?.()
    unsubWallLeftClick?.()
    unsubWallTableOperationClicked?.()
  })

  return {
    initWalls,
    loadAndDrawWalls,
    clearWalls,
    filterWalls,
    flyToWallById,
  }
}

// re-export for interaction handlers
export { WALL_INTERACTION_STYLE }
