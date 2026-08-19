import { onUnmounted } from 'vue'
import * as Cesium from 'cesium'
import { onCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import type {
  PhotogrammetryBuildingHoveredProperties,
  PhotogrammetryBuildingSelectedProperties,
} from '@/views/aviation-situation/types/photogrammetry'
import { usePhotogrammetryStore } from '@/stores/photogrammetry'
import { getBostonPhotogrammetryBuildings, getSanFranciscoPhotogrammetryBuildings, getMelbournePhotogrammetryBuildings } from '@/network/photogrammetry'
import type {
  PhotogrammetryBuildingBBox,
  PhotogrammetryBuildingFeature,
} from '@/network/photogrammetry/type'
import { PHOTOGRAMMETRY_BUILDING_DEFAULT_COLOR } from '@/views/aviation-situation/composables/photogrammetry/photogrammetry-constants'
import {
  clearPhotogrammetryBuildingsRegistry,
  getPhotogrammetryBuildingPrimitive,
  registerPhotogrammetryBuildingPrimitive,
  setPhotogrammetryBuildingProperty,
} from '@/views/aviation-situation/composables/photogrammetry/photogrammetry-building-registry'
import { selectPhotogrammetryBuilding } from '@/views/aviation-situation/composables/selection/useAviationSelectionActions'
import {
  clearAllPhotogrammetryBuildingHighlight,
} from '@/views/aviation-situation/composables/highlight-manager/photogrammetry-building-highlight-manager'
import { useAviationSelectionStore } from '@/stores/aviation-selection'
import { setTooltipPositionFromWindow } from '@/views/aviation-situation/composables/cesium-events/tooltip-position'

import { useCesiumCameraEvent } from '@/views/aviation-situation/composables/cesium-events/cesium-camera-events'
import type { ShallowRef } from 'vue'
import type { Viewer } from 'cesium'

type ActivePhotogrammetry = {
  id: number | ''
  tileset: Cesium.Cesium3DTileset | null
}

/** 相机海拔超过该值（米）时隐藏 ClassificationPrimitive 建筑白膜 */
const PHOTOGRAMMETRY_BUILDING_HIDE_ALTITUDE = 3000

export function usePhotogrammetry(viewer: ShallowRef<Viewer | null>) {
  const photogrammetryStore = usePhotogrammetryStore()
  const aviationSelectionStore = useAviationSelectionStore()

  const activePhotogrammetry: ActivePhotogrammetry = {
    id: '',
    tileset: null,
  }

  const initPhotogrammetrys = () => {
    setPhotogrammetryTable()
    subscribePhotogrammetryEvents()
    subscribeCameraAltitudeVisibility()
  }

  /** 海拔 > 阈值时隐藏白膜；不销毁，靠近后恢复 show */
  const syncBuildingVisibilityByAltitude = (camera?: Cesium.Camera) => {
    const buildingPrimitive = getPhotogrammetryBuildingPrimitive()
    if (!buildingPrimitive) return
    const cam = camera ?? viewer.value?.camera
    if (!cam) return
    const altitude = cam.positionCartographic.height
    buildingPrimitive.show = altitude <= PHOTOGRAMMETRY_BUILDING_HIDE_ALTITUDE
  }

  let unsubCameraMoveEnd: (() => void) | undefined
  let unsubMouseWheel: (() => void) | undefined
  const subscribeCameraAltitudeVisibility = () => {
    unsubCameraMoveEnd = useCesiumCameraEvent('cameraMoveEnd', (camera) => {
      syncBuildingVisibilityByAltitude(camera)
    })
    // 滚轮缩放过程中 moveEnd 要停住才触发，与机场显隐同一套补 mouseWheel
    unsubMouseWheel = onCesiumEvent('mouseWheel', (camera) => {
      syncBuildingVisibilityByAltitude(camera)
    })
  }

  const addPhotogrammetryTileset = async (assetId: number, name: string) => {
    const tileset = viewer.value.scene.primitives.add(
      await Cesium.Cesium3DTileset.fromIonAssetId(assetId),
    )
    // 越小越清晰越耗性能，越大越糊越流畅；默认约 16
    tileset.maximumScreenSpaceError = 16
    tileset.meta = {
      sourceType: 'photogrammetry',
      name,
    }
    activePhotogrammetry.id = assetId
    activePhotogrammetry.tileset = tileset
    viewer.value.zoomTo(tileset)
  }

  const setPhotogrammetryTable = () => {
    const photogrammetrys = [
      { id: 354759, name: 'Boston' },
      { id: 1415196, name: 'SanFrancisco' },
      { id: 69380, name: 'Melbourne' },
      { id: 57588, name: 'WashingtonDC' },
      { id: 57590, name: 'WashingtonState' },
    ]
    photogrammetrys.forEach((item) => {
      photogrammetryStore.setMatchedPhotogrammetry(item)
    })
    photogrammetryStore.commitMatchedPhotogrammetrys()
  }

  const addBostonPhotogrammetry = () => addPhotogrammetryTileset(354759, 'Boston')
  const addSanFranciscoPhotogrammetry = () => addPhotogrammetryTileset(1415196, 'SanFrancisco')
  const addMelbournePhotogrammetry = () => addPhotogrammetryTileset(69380, 'Melbourne')
  const addWashingtonDCPhotogrammetry = () => addPhotogrammetryTileset(57588, 'WashingtonDC')
  const addWashingtonStatePhotogrammetry = () => addPhotogrammetryTileset(57590, 'WashingtonState')

  const addPhotogrammetryById = async (id: number) => {
    if (photogrammetryStore.isLoadingPhotogrammetry) return

    if (activePhotogrammetry.id === id && activePhotogrammetry.tileset) {
      viewer.value.zoomTo(activePhotogrammetry.tileset)
      return
    }

    photogrammetryStore.setIsLoadingPhotogrammetry(true)
    try {
      removeActivePhotogrammetry()

      if (id === 354759) {
        await addBostonPhotogrammetry()
        await addBostonBuilding()
      } else if (id === 1415196) {
        await addSanFranciscoPhotogrammetry()
        await addSanFranciscoBuilding()
      } else if (id === 69380) {
        await addMelbournePhotogrammetry()
        await addMelbourneBuilding()
      } else if (id === 57588) {
        await addWashingtonDCPhotogrammetry()
      } else if (id === 57590) {
        await addWashingtonStatePhotogrammetry()
      }
    } finally {
      photogrammetryStore.setIsLoadingPhotogrammetry(false)
    }
  }

  /**
   * 当前倾斜摄影 tileset 的经纬度矩形包围盒（度）。
   * boundingSphere → Rectangle：能包住球体的轴对齐 W/S/E/N，一般比真实 footprint 略大。
   * 语义同 turf.bbox 的 [west,south,east,north]，这里用对象字段；不必强行换 turf。
   */
  const getActiveTilesetBBox = (): PhotogrammetryBuildingBBox | undefined => {
    const tileset = activePhotogrammetry.tileset
    if (!tileset?.boundingSphere) return undefined
    const rectangle = Cesium.Rectangle.fromBoundingSphere(tileset.boundingSphere)
    return {
      west: Cesium.Math.toDegrees(rectangle.west),
      south: Cesium.Math.toDegrees(rectangle.south),
      east: Cesium.Math.toDegrees(rectangle.east),
      north: Cesium.Math.toDegrees(rectangle.north),
    }
  }

  const ringToDegreesArray = (
    ring: PhotogrammetryBuildingFeature['geometry']['coordinates'][0],
  ): number[] => ring.flatMap(([lng, lat]) => [lng, lat])

  const createBuildingGeometryInstance = (feature: PhotogrammetryBuildingFeature) => {
    const outerRing = feature.geometry.coordinates[0]
    if (!outerRing) {
      throw new Error(`[photogrammetry] building ${feature.properties.id} missing outer ring`)
    }
    const { id, name, minHeight, height, buildingHeight, city, landUse, roofType } =
      feature.properties
    const positions = Cesium.Cartesian3.fromDegreesArray(ringToDegreesArray(outerRing))

    // PolygonGeometry: height=底, extrudedHeight=顶（须大于 height）
    const extrusionBottom = minHeight
    const extrusionTop = Math.max(height, minHeight + (buildingHeight ?? 3))

    setPhotogrammetryBuildingProperty(id, {
      sourceType: 'photogrammetryBuilding',
      id,
      name,
      minHeight: extrusionBottom,
      height: extrusionTop,
      buildingHeight: buildingHeight ?? extrusionTop - extrusionBottom,
      city,
      landUse,
      roofType,
    })

    return new Cesium.GeometryInstance({
      geometry: new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(positions),
        height: extrusionBottom,
        extrudedHeight: extrusionTop,
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
      }),
      attributes: {
        // ClassificationPrimitive：构造时所有 instance 的 color 必须相同
        // 分栋区分靠 hover/选中时 getGeometryInstanceAttributes 改色
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
          PHOTOGRAMMETRY_BUILDING_DEFAULT_COLOR,
        ),
        show: new Cesium.ShowGeometryInstanceAttribute(true),
      },
      id,
    })
  }

  const addBuildings = async (buildings: PhotogrammetryBuildingFeature[]) => {
    if (buildings.length === 0) {
      console.warn('[photogrammetry] no buildings in tileset bbox after clip')
      return
    }
    console.info(`[photogrammetry] loading ${buildings.length} building instances`)

    const instances = buildings.map(createBuildingGeometryInstance)

    const buildingPrimitive = viewer.value.scene.primitives.add(
      new Cesium.ClassificationPrimitive({
        geometryInstances: instances,
        classificationType: Cesium.ClassificationType.CESIUM_3D_TILE,
        appearance: new Cesium.PerInstanceColorAppearance({
          flat: true,
          translucent: true,
        }),
      }),
    )

    registerPhotogrammetryBuildingPrimitive(buildingPrimitive)
    syncBuildingVisibilityByAltitude()
  }

  const addBostonBuilding = async () => {
    await addBuildings(await getBostonPhotogrammetryBuildings(getActiveTilesetBBox()))
  }

  const addSanFranciscoBuilding = async () => {
    await addBuildings(await getSanFranciscoPhotogrammetryBuildings())
  }

  const addMelbourneBuilding = async () => {
    await addBuildings(await getMelbournePhotogrammetryBuildings(getActiveTilesetBBox()))
  }

  let unsubPhotogrammetryBuildingHover: () => void
  let unsubPhotogrammetryBuildingLeave: () => void
  let unsubPhotogrammetryBuildingLeftClick: () => void

  const subscribePhotogrammetryEvents = () => {
    unsubPhotogrammetryBuildingHover = onCesiumEvent(
      'photogrammetryBuildingHover',
      (properties: PhotogrammetryBuildingHoveredProperties, screenPosition: Cesium.Cartesian2) => {
        const selectedData: PhotogrammetryBuildingSelectedProperties = {
          sourceType: 'photogrammetryBuilding',
          id: properties.id,
        }
        setTooltipPositionFromWindow(screenPosition.x, screenPosition.y)
        const hovered = aviationSelectionStore.hovered
        if (
          hovered === null ||
          hovered.sourceType !== 'photogrammetryBuilding' ||
          hovered.id !== properties.id
        ) {
          aviationSelectionStore.setHovered(selectedData)
        }
      },
    )

    unsubPhotogrammetryBuildingLeave = onCesiumEvent('photogrammetryBuildingLeave', () => {
      const hovered = aviationSelectionStore.hovered
      if (hovered?.sourceType === 'photogrammetryBuilding') {
        aviationSelectionStore.clearHovered()
      }
    })

    unsubPhotogrammetryBuildingLeftClick = onCesiumEvent(
      'photogrammetryBuildingLeftClick',
      (properties: PhotogrammetryBuildingSelectedProperties) => {
        selectPhotogrammetryBuilding({
          sourceType: 'photogrammetryBuilding',
          id: properties.id,
        })
      },
    )
  }

  const removeActivePhotogrammetry = () => {
    clearAllPhotogrammetryBuildingHighlight()

    if (aviationSelectionStore.selected?.sourceType === 'photogrammetryBuilding') {
      aviationSelectionStore.clearSelected()
    }
    if (aviationSelectionStore.hovered?.sourceType === 'photogrammetryBuilding') {
      aviationSelectionStore.clearHovered()
    }

    const buildingPrimitive = getPhotogrammetryBuildingPrimitive()
    if (buildingPrimitive) {
      viewer.value.scene.primitives.remove(buildingPrimitive)
    }
    clearPhotogrammetryBuildingsRegistry()

    if (activePhotogrammetry.tileset) {
      viewer.value.scene.primitives.remove(activePhotogrammetry.tileset)
      activePhotogrammetry.tileset = null
    }
    activePhotogrammetry.id = ''
  }

  onUnmounted(() => {
    unsubPhotogrammetryBuildingHover()
    unsubPhotogrammetryBuildingLeave()
    unsubPhotogrammetryBuildingLeftClick()
    unsubCameraMoveEnd?.()
    unsubMouseWheel?.()
    removeActivePhotogrammetry()
  })

  return {
    initPhotogrammetrys,
    addPhotogrammetryById,
    removeActivePhotogrammetry,
  }
}
