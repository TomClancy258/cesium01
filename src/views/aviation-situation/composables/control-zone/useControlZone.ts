import { onUnmounted, watch } from 'vue'
import type { ShallowRef } from 'vue'
import * as Cesium from 'cesium'
import { getControlZones } from '@/network/control-zone'
import type {
  ControlZoneFeature,
  ControlZoneLevel,
  ControlZoneProperties
} from '@/network/control-zone/type'
import { CONTROL_ZONE_LEVEL_STYLES } from '@/views/aviation-situation/composables/control-zone/control-zone-constants'
import { useDebounceFn } from '@vueuse/core'
import { useControlZoneStore } from '@/stores/control-zone'
import type {
  ControlZoneHoveredProperties,
  ControlZoneTableRowOperation,
  MatchedControlZone
} from '@/views/aviation-situation/types/control-zone'
import { createPolygonFromLngLatAltArray } from '@/utils/geoUtils'
import * as turf from '@turf/turf'
import type { Aircraft } from '@/network/aircraft/types/aircraft'
import { onCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import { useAviationTooltip } from '@/views/aviation-situation/composables/useAviationTooltip'
import { selectControlZoneRegion } from '@/views/aviation-situation/composables/selection/useRegionSelectionActions'
import {
  toControlZoneHoveredProperties,
  toControlZoneRegionSelectedData,
} from './control-zone-property-utils'

type ControlZoneFilterQuery = {
  id?: string
  name?: string
  levels: ControlZoneLevel[]
}

type ControlZoneRenderState = {
  data: MatchedControlZone
  entity: Cesium.Entity
}

/** GeoJSON 外环 → Cesium 扁平 [lng, lat, alt, ...] */
const ringToLngLatAltArray = (
  ring: ControlZoneFeature['geometry']['coordinates'][0],
  altitude: number,
): number[] => {
  const lngLatAltArray: number[] = []
  for (const position of ring) {
    const lng = position[0]
    const lat = position[1]
    const alt = position[2] ?? altitude
    lngLatAltArray.push(lng, lat, alt)
  }
  return lngLatAltArray
}

export interface UseControlZoneOptions {
  /** matched 管控区变更后回调（如刷新飞机管控区高亮） */
  onMatchedControlZonesChanged?: () => void
}

export function useControlZone(
  viewer: ShallowRef<Cesium.Viewer>,
  options: UseControlZoneOptions = {},
) {
  const controlZoneStore = useControlZoneStore()
  const controlZoneRenderMap = new Map<string, ControlZoneRenderState>()

  const {
    tooltip,
    showTooltip: showControlZoneTooltip,
    hideTooltip: hideControlZoneTooltip,
  } = useAviationTooltip<ControlZoneHoveredProperties>({
    id: '',
    name: '',
    level: 'normal',
    minAltitude: 0,
    maxAltitude: 0
  })


  const drawControlZones = (features: ControlZoneFeature[]): void => {
    for (const feature of features) {
      if (feature.geometry?.type !== 'Polygon') continue

      const { properties, geometry } = feature
      const style = CONTROL_ZONE_LEVEL_STYLES[properties.level]
      if (!style) continue

      const outerRing = geometry.coordinates[0]
      if (!outerRing?.length) continue

      const lngLatAltArray = ringToLngLatAltArray(outerRing, properties.minAltitude ?? 0)
      const positions = Cesium.Cartesian3.fromDegreesArrayHeights(lngLatAltArray)
      const graphic = createPolygonFromLngLatAltArray(lngLatAltArray)

      const matchedControlZone: MatchedControlZone = {
        ...properties,
        graphic,
        bbox: turf.bbox(graphic),
        aircraft: {
          aircraftMap: new Map<string, Aircraft>(),
        },
      }

      const entity = viewer.value.entities.add({
        id: properties.id,
        show: true,
        polygon: {
          hierarchy: positions,
          material: style.material,
          outline: true,
          outlineColor: style.outlineColor,
          outlineWidth: 2,
          // perPositionHeight: true, //每个点的海拔才生效
          height: properties.minAltitude, //底部海拔
          extrudedHeight: properties.maxAltitude, //顶部海拔，高度=extrudedHeight-height
        },
        properties: {
          id: properties.id,
          sourceType: 'controlZone',
          polygon: {
            outlineColor: style.outlineColor,
          },
        } satisfies ControlZoneProperties,
      })

      controlZoneRenderMap.set(properties.id, {
        data: matchedControlZone,
        entity,
      })
    }
  }

  const clearControlZones = (): void => {
    if (!viewer.value) return
    for (const { entity } of controlZoneRenderMap.values()) {
      viewer.value.entities.remove(entity)
    }
    controlZoneRenderMap.clear()
    controlZoneStore.clearMatchedControlZones()
  }

  const loadAndDrawControlZones = async (): Promise<void> => {
    try {
      const features = await getControlZones()
      if (!Array.isArray(features) || features.length === 0) {
        console.warn('管控区数据为空或格式错误:', features)
        return
      }
      clearControlZones()
      drawControlZones(features)
      filterControlZones()
    } catch (error) {
      console.error('加载管控区数据失败:', error)
    }
  }

  const filterControlZones = useDebounceFn((): void => {
    controlZoneStore.clearMatchedControlZones()

    const form = controlZoneStore.controlZoneFilterForm
    const query: ControlZoneFilterQuery = {
      id: form.id?.trim().toLowerCase(),
      name: form.name?.trim().toLowerCase(),
      levels: form.levels,
    }

    const levelsSet = new Set(query.levels)
    controlZoneRenderMap.forEach(({ data: controlZone, entity }) => {
      const match =
        (!query.id || controlZone.id.toLowerCase().includes(query.id)) &&
        (!query.name || (controlZone.name ?? '').toLowerCase().includes(query.name)) &&
        levelsSet.has(controlZone.level) &&
        form.visible

      if (match) {
        controlZoneStore.setMatchedControlZone(controlZone)
      }
      entity.show = match
    })

    controlZoneStore.commitMatchedControlZones()
    options.onMatchedControlZonesChanged?.()
  }, 300)

  const initControlZones = (): void => {
    loadAndDrawControlZones()
    setupControlZoneFilterFormWatch()
    subscribeControlZoneEvents()
  }

  let unwatchControlZoneFilterForm: () => void
  const setupControlZoneFilterFormWatch = (): void => {
    unwatchControlZoneFilterForm = watch(
      () => controlZoneStore.controlZoneFilterForm,
      () => {
        filterControlZones()
      },
      { deep: true },
    )
  }

  let unsubControlZoneHover: () => void
  let unsubControlZoneLeave: () => void
  let unsubControlZoneLeftClick: () => void
  let unsubControlZoneTableOperationClicked: () => void

  const subscribeControlZoneEvents = () => {
    unsubControlZoneHover = onCesiumEvent(
      'controlZoneHover',
      (
        properties: ControlZoneProperties,
        screenPosition: Cesium.Cartesian2,
      ) => {
        const controlZone = controlZoneRenderMap.get(properties.id)?.data
        if (!controlZone) return
        showControlZoneTooltip(screenPosition, toControlZoneHoveredProperties(controlZone))
      },
    )

    unsubControlZoneLeave = onCesiumEvent('controlZoneLeave', () => {
      hideControlZoneTooltip()
    })

    unsubControlZoneLeftClick = onCesiumEvent(
      'controlZoneLeftClick',
      (properties: ControlZoneProperties, entity: Cesium.Entity) => {
        const controlZone = controlZoneRenderMap.get(properties.id)?.data
        if (!controlZone) return
        selectControlZoneRegion(entity, toControlZoneRegionSelectedData(controlZone))
      },
    )

    unsubControlZoneTableOperationClicked = onCesiumEvent(
      'controlZoneTableOperationClicked',
      (controlZoneTableRowOperation: ControlZoneTableRowOperation) => {
        const controlZoneRenderState = controlZoneRenderMap.get(controlZoneTableRowOperation.id)
        if (!controlZoneRenderState) return
        const { entity, data } = controlZoneRenderState
        if (!entity) return

        selectControlZoneRegion(entity, toControlZoneRegionSelectedData(data))

        viewer.value.flyTo(entity, {
          duration: 1.5,
        })
      },
    )

  }

  onUnmounted(() => {
    clearControlZones()
    unwatchControlZoneFilterForm?.()

    unsubControlZoneHover()
    unsubControlZoneLeave()
    unsubControlZoneLeftClick()
    unsubControlZoneTableOperationClicked()
  })

  return {
    initControlZones,
    loadAndDrawControlZones,
    clearControlZones,

    tooltip
  }
}
