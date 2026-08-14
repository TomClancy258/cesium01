import type { PhotogrammetryBuildingInstanceProperties } from '@/views/aviation-situation/types/photogrammetry'
import type * as Cesium from 'cesium'

/** 当前城 ClassificationPrimitive + 楼栋业务属性（唯一运行时真相） */
//包含很多倾斜摄影建筑的instance的primitive
let buildingPrimitive: Cesium.ClassificationPrimitive | null = null
const buildingPropertiesMap = new Map<string, PhotogrammetryBuildingInstanceProperties>()

export function setPhotogrammetryBuildingProperty(
  id: string,
  properties: PhotogrammetryBuildingInstanceProperties,
): void {
  buildingPropertiesMap.set(id, properties)
}

export function registerPhotogrammetryBuildingPrimitive(
  primitive: Cesium.ClassificationPrimitive,
): void {
  buildingPrimitive = primitive
}

export function clearPhotogrammetryBuildingsRegistry(): void {
  buildingPrimitive = null
  buildingPropertiesMap.clear()
}

export function getPhotogrammetryBuildingPrimitive(): Cesium.ClassificationPrimitive | null {
  return buildingPrimitive
}

export function getPhotogrammetryBuildingProperties(
  id: string,
): PhotogrammetryBuildingInstanceProperties | undefined {
  return buildingPropertiesMap.get(id)
}

export function hasPhotogrammetryBuilding(id: string) {
  return buildingPropertiesMap.has(id)
}
