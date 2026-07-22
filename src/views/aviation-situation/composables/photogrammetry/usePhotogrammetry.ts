import { onUnmounted } from 'vue'
import * as Cesium from 'cesium'
import { useAviationTooltip } from '@/views/aviation-situation/composables/useAviationTooltip'
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

type ActivePhotogrammetry = {
  id: number | ''
  tileset: Cesium.Cesium3DTileset | null
}

export function usePhotogrammetry(viewer) {
  const photogrammetryStore = usePhotogrammetryStore()
  const {
    tooltip,
    showTooltip: showPhotogrammetryBuildingTooltip,
    hideTooltip: hidePhotogrammetryBuildingTooltip,
  } = useAviationTooltip<PhotogrammetryBuildingHoveredProperties>({
    sourceType: 'photogrammetryBuilding',
    id: '',
    name: '',
    minHeight: 0,
    height: 0,
  })

  const activePhotogrammetry: ActivePhotogrammetry = {
    id: '',
    tileset: null,
  }

  const initPhotogrammetrys = () => {
    setPhotogrammetryTable()
    subscribePhotogrammetryEvents()
  }

  const addPhotogrammetryTileset = async (assetId: number, name: string) => {
    const tileset = viewer.value.scene.primitives.add(
      await Cesium.Cesium3DTileset.fromIonAssetId(assetId),
    )
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
        showPhotogrammetryBuildingTooltip(screenPosition, properties)
      },
    )

    unsubPhotogrammetryBuildingLeave = onCesiumEvent('photogrammetryBuildingLeave', () => {
      hidePhotogrammetryBuildingTooltip()
    })

    unsubPhotogrammetryBuildingLeftClick = onCesiumEvent(
      'photogrammetryBuildingLeftClick',
      (properties: PhotogrammetryBuildingSelectedProperties) => {
        selectPhotogrammetryBuilding(properties)
      },
    )
  }

  const removeActivePhotogrammetry = () => {
    clearAllPhotogrammetryBuildingHighlight()

    const aviationSelectionStore = useAviationSelectionStore()
    if (aviationSelectionStore.selected?.sourceType === 'photogrammetryBuilding') {
      aviationSelectionStore.clearSelected()
    }
    hidePhotogrammetryBuildingTooltip()

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
    removeActivePhotogrammetry()
  })

  return {
    initPhotogrammetrys,
    addPhotogrammetryById,
    tooltip,
    removeActivePhotogrammetry,
  }
}
