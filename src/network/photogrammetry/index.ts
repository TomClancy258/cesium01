import { geojsonRequest } from '../request'
import {
  filterBuildingsByBBox,
  normalizeBostonBuildingFeature,
  normalizeMelbourneBuildingFeature,
} from './normalize-buildings'
import type {
  PhotogrammetryBuildingBBox,
  PhotogrammetryBuildingFeature,
  PhotogrammetryRawBuildingFeatureCollection,
} from './type'

const API = {
  BOSTON_BUILDINGS: 'photogrammetry/Boston_Buildings_with_Roof_Breaks.json',
  SAN_FRANCISCO_BUILDINGS: 'photogrammetry/SanFrancisco.json',
  MELBOURNE_BUILDINGS: 'photogrammetry/Melbourne-2023-building-footprints.json',
} as const

export const getBostonPhotogrammetryBuildings = async (
  bbox?: PhotogrammetryBuildingBBox,
): Promise<PhotogrammetryBuildingFeature[]> => {
  const collection = await geojsonRequest.get<PhotogrammetryRawBuildingFeatureCollection>(
    API.BOSTON_BUILDINGS,
    { timeout: 120000 },
  )
  const normalized = collection.features
    .map(normalizeBostonBuildingFeature)
    .filter((f): f is PhotogrammetryBuildingFeature => f !== null)

  return bbox ? filterBuildingsByBBox(normalized, bbox) : normalized
}

export const getMelbournePhotogrammetryBuildings = async (
  bbox?: PhotogrammetryBuildingBBox,
): Promise<PhotogrammetryBuildingFeature[]> => {
  const collection = await geojsonRequest.get<PhotogrammetryRawBuildingFeatureCollection>(
    API.MELBOURNE_BUILDINGS,
    { timeout: 120000 },
  )
  const normalized = collection.features
    .map(normalizeMelbourneBuildingFeature)
    .filter((f): f is PhotogrammetryBuildingFeature => f !== null)

  return bbox ? filterBuildingsByBBox(normalized, bbox) : normalized
}

/** SF 仍用旧小 JSON（业务字段已归一）；大体量 CSV 转 GeoJSON 后再接 */
export const getSanFranciscoPhotogrammetryBuildings = async (): Promise<
  PhotogrammetryBuildingFeature[]
> => {
  const collection = await geojsonRequest.get<{
    type: 'FeatureCollection'
    features: PhotogrammetryBuildingFeature[]
  }>(API.SAN_FRANCISCO_BUILDINGS)
  return collection.features
}
