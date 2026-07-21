import * as Cesium from 'cesium'
import { getPhotogrammetryBuildingPrimitive } from '@/views/aviation-situation/composables/photogrammetry/photogrammetry-building-registry'
import { PHOTOGRAMMETRY_BUILDING_DEFAULT_COLOR } from '@/views/aviation-situation/composables/photogrammetry/photogrammetry-constants'

let hoveredBuildingId: string | null = null
let selectedBuildingId: string | null = null

const setBuildingColor = (buildingId: string, color: Cesium.Color): void => {
  const primitive = getPhotogrammetryBuildingPrimitive()
  if (!primitive) return
  const attributes = primitive.getGeometryInstanceAttributes(buildingId)
  if (!attributes) return
  attributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(color)
}

export function highlightPhotogrammetryBuildingOnHover(
  buildingId: string,
  color: Cesium.Color,
): void {
  if (selectedBuildingId === buildingId) return
  if (hoveredBuildingId === buildingId) return

  if (hoveredBuildingId && hoveredBuildingId !== selectedBuildingId) {
    clearHoveredPhotogrammetryBuildingHighlight()
  }

  hoveredBuildingId = buildingId
  setBuildingColor(buildingId, color)
}

export function highlightPhotogrammetryBuildingOnSelect(
  buildingId: string,
  color: Cesium.Color,
): void {
  if (selectedBuildingId === buildingId) return

  if (selectedBuildingId) {
    clearSelectedPhotogrammetryBuildingHighlight()
  }

  if (hoveredBuildingId === buildingId) {
    hoveredBuildingId = null
  }

  selectedBuildingId = buildingId
  setBuildingColor(buildingId, color)
}

export function clearHoveredPhotogrammetryBuildingHighlight(): void {
  if (hoveredBuildingId && hoveredBuildingId !== selectedBuildingId) {
    setBuildingColor(hoveredBuildingId, PHOTOGRAMMETRY_BUILDING_DEFAULT_COLOR)
    hoveredBuildingId = null
  }
}

export function clearSelectedPhotogrammetryBuildingHighlight(): void {
  if (selectedBuildingId) {
    setBuildingColor(selectedBuildingId, PHOTOGRAMMETRY_BUILDING_DEFAULT_COLOR)
    selectedBuildingId = null
  }
}

export function clearAllPhotogrammetryBuildingHighlight(): void {
  clearHoveredPhotogrammetryBuildingHighlight()
  clearSelectedPhotogrammetryBuildingHighlight()
}
