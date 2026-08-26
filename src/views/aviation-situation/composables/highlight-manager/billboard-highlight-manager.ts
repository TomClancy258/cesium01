// src/views/aviation-situation/composables/useHighlightManager.ts
import * as Cesium from 'cesium'
import type {
  AircraftBillboardProperties,
  AircraftSelectedData
} from '@/views/aviation-situation/types/aircraft'
import type { AirportBillboardProperties, AirportSelectedData } from '@/views/aviation-situation/types/airport'
import type { AviationAssociationSets } from '@/views/aviation-situation/types/shared'

// 仅存储Cesium实例（非响应式，模块单例）
let hoveredBillboard: Cesium.Billboard | null = null
let selectedBillboard: Cesium.Billboard | null = null
let hoveredHighlightImage: string | null = null
let selectedHighlightImage: string | null = null

type BillboardProperties = AircraftBillboardProperties | AirportBillboardProperties

const getBillboardProperties = (billboard: Cesium.Billboard): BillboardProperties => {
  return (billboard as unknown as { properties: BillboardProperties }).properties
}

//统一决策函数：给定一个 billboard，按优先级决定最终 billboard.image。
// 工具方法：按统一优先级刷新图片
const applyBillboardImageByPriority = (billboard: Cesium.Billboard) => {

  // 优先级：selected > hovered > spatialSelected > controlZone > radar > satelliteConeScan > original
  if (billboard === selectedBillboard && selectedHighlightImage) {
    billboard.image = selectedHighlightImage
    return
  }
  if (billboard === hoveredBillboard && hoveredHighlightImage) {
    billboard.image = hoveredHighlightImage
    return
  }
  const properties = getBillboardProperties(billboard)
  if (properties.images.spatialSelection) {
    billboard.image = properties.images.spatialSelection
    return
  }
  if ('controlZone' in properties.images && properties.images.controlZone) {
    billboard.image = properties.images.controlZone
    return
  }
  if ('radar' in properties.images && properties.images.radar) {
    billboard.image = properties.images.radar
    return
  }
  if (properties.images.satelliteConeScan) {
    billboard.image = properties.images.satelliteConeScan
    return
  }
  billboard.image = properties.images.original ?? billboard.image
}


export function highlightBillboardOnSpatialSelection(
  dataSourceName:string,
  billboard: Cesium.Billboard,
  highlightImage: string,
  sets: AviationAssociationSets,
): void {
  const properties = getBillboardProperties(billboard)
  const dataSourceNames:Set<string>=sets.dataSourceName
  const alreadyTracked = dataSourceNames.has(dataSourceName)
  if (!alreadyTracked) {
    dataSourceNames.add(dataSourceName)
    properties.images.spatialSelection = highlightImage
  }
  applyBillboardImageByPriority(billboard)
}

export function highlightBillboardOnControlZone(
  controlZoneId:string,
  billboard: Cesium.Billboard,
  highlightImage: string,
  sets: AviationAssociationSets,
): void {
  const properties = getBillboardProperties(billboard)
  if (sets.controlZoneId == null || !('controlZone' in properties.images)) return
  const controlZoneIdMap:Set<string>=sets.controlZoneId
  const alreadyTracked = controlZoneIdMap.has(controlZoneId)
  if (!alreadyTracked) {
    controlZoneIdMap.add(controlZoneId)

    properties.images.controlZone = highlightImage
  }
  applyBillboardImageByPriority(billboard)
}

export function clearSpatialSelectedHighlight(
  dataSourceName: string,
  billboard: Cesium.Billboard,
  sets: AviationAssociationSets,
): void {
  const properties = getBillboardProperties(billboard)
  const dataSourceNames:Set<string>=sets.dataSourceName
  if(!dataSourceNames.has(dataSourceName))return
  dataSourceNames.delete(dataSourceName)

  // 只在最后一个区域移除时才改回原始图片，避免冗余赋值
  if (dataSourceNames.size === 0) {
    properties.images.spatialSelection = null
  }
  applyBillboardImageByPriority(billboard)
}

export function highlightBillboardOnRadar(
  radarId: string,
  billboard: Cesium.Billboard,
  highlightImage: string,
  sets: AviationAssociationSets,
): void {
  const properties = getBillboardProperties(billboard)
  if (sets.radarId == null || !('radar' in properties.images)) return
  const radarIdSet = sets.radarId
  const alreadyTracked = radarIdSet.has(radarId)
  if (!alreadyTracked) {
    radarIdSet.add(radarId)
    properties.images.radar = highlightImage
  }
  applyBillboardImageByPriority(billboard)
}

export function clearRadarHighlight(
  radarId: string,
  billboard: Cesium.Billboard,
  sets: AviationAssociationSets,
): void {
  const properties = getBillboardProperties(billboard)
  if (sets.radarId == null || !('radar' in properties.images)) return
  const radarIdSet: Set<string> = sets.radarId
  if (!radarIdSet.has(radarId)) return
  radarIdSet.delete(radarId)
  if (radarIdSet.size === 0) {
    properties.images.radar = null
  }
  applyBillboardImageByPriority(billboard)
}

export function clearControlZoneHighlight(
  controlZoneId: string,
  billboard: Cesium.Billboard,
  sets: AviationAssociationSets,
): void {
  const properties = getBillboardProperties(billboard)
  if (sets.controlZoneId == null || !('controlZone' in properties.images)) return
  const controlZoneIdSet: Set<string> = sets.controlZoneId
  if (!controlZoneIdSet.has(controlZoneId)) return
  controlZoneIdSet.delete(controlZoneId)

  // 只在最后一个管控区移除时才清掉图片，避免冗余赋值
  if (controlZoneIdSet.size === 0) {
    properties.images.controlZone = null
  }
  applyBillboardImageByPriority(billboard)
}

//高亮优先级：框选>卫星扫描
export function highlightBillboardOnSatelliteConeScan(
  satelliteId:string,
  billboard: Cesium.Billboard,
  highlightImage: string,
  sets: AviationAssociationSets,
): void {
  const properties = getBillboardProperties(billboard)
  const coneScanSatelliteIds: Set<string> = sets.coneScanSatelliteId
  const alreadyTracked = coneScanSatelliteIds.has(satelliteId)
  if (!alreadyTracked) {
    coneScanSatelliteIds.add(satelliteId)
    properties.images.satelliteConeScan = highlightImage
  }
  applyBillboardImageByPriority(billboard)
}

export function clearSatelliteConeScanSelectedHighlight(
  satelliteId: string,
  billboard: Cesium.Billboard,
  sets: AviationAssociationSets,
): void {
  const properties = getBillboardProperties(billboard)
  const coneScanSatelliteIds:Set<string>=sets.coneScanSatelliteId
  if (!coneScanSatelliteIds.has(satelliteId)) return
  // if (coneScanSatelliteIds.size === 0) {
  //   return
  // }
  coneScanSatelliteIds.delete(satelliteId)

  // 只在最后一个区域移除时才改回原始图片，避免冗余赋值
  if (coneScanSatelliteIds.size === 0) {
    properties.images.satelliteConeScan = null
  }
  applyBillboardImageByPriority(billboard)
}

/**
 * hover高亮：视觉+同步Pinia（如果需要UI联动）
 */
export function highlightBillboardOnHover(
  hoverData: AircraftSelectedData | AirportSelectedData | null = null,
  billboard: Cesium.Billboard,
  highlightImage: string,
): void {
  // 如果当前有选中的 Billboard，hover 不生效（选中优先级更高）
  if (selectedBillboard === billboard) return

  if (hoveredBillboard === billboard) return

  // 还原上一个 hover 项
  if (hoveredBillboard) {
    const previousHoveredBillboard = hoveredBillboard
    hoveredBillboard = null
    hoveredHighlightImage = null
    applyBillboardImageByPriority(previousHoveredBillboard)

    // applyBillboardImageByPriority(hoveredBillboard)  // 此时 hoveredBillboard 仍指向旧图标
// apply 里：billboard === hoveredBillboard → 又设回 hover 图，恢复失败
//     hoveredBillboard = null
  }

  hoveredBillboard = billboard
  hoveredHighlightImage = highlightImage
  applyBillboardImageByPriority(billboard)

  // const aviationSelectionStore = useAviationSelectionStore()
  // aviationSelectionStore.setHovered(hoverData)
}

/**
 * 选中高亮：仅处理视觉状态
 */
export function highlightBillboardOnSelect(
  billboard: Cesium.Billboard,
  highlightImage: string
): void {
  if (selectedBillboard === billboard) return

  // 恢复上一个选中的图片
  if (selectedBillboard) {
    const previousSelectedBillboard = selectedBillboard
    selectedBillboard = null
    selectedHighlightImage = null
    applyBillboardImageByPriority(previousSelectedBillboard)
  }

  // 清除当前hover（选中优先级更高）
  if (hoveredBillboard === billboard) {
    hoveredBillboard = null
    hoveredHighlightImage = null
    // aviationSelectionStore.clearHovered()
  }

  // 更新选中实例+视觉
  selectedBillboard = billboard
  selectedHighlightImage = highlightImage
  applyBillboardImageByPriority(billboard)
}

/**
 * 清除hover：视觉+同步Pinia
 */
export function clearHoveredBillboardHighlight(): void {
  if (!hoveredBillboard) return
  const previousHoveredBillboard = hoveredBillboard
  hoveredBillboard = null
  hoveredHighlightImage = null
  applyBillboardImageByPriority(previousHoveredBillboard)
  // aviationSelectionStore.clearHovered()
  // const aviationSelectionStore = useAviationSelectionStore()
  // aviationSelectionStore.clearHovered()
}

/**
 * 清除选中：视觉+同步Pinia
 */
export function clearSelectedBillboardHighlight(): void {
  if (!selectedBillboard) return
  const previousSelectedBillboard = selectedBillboard
  selectedBillboard = null
  selectedHighlightImage = null
  applyBillboardImageByPriority(previousSelectedBillboard)
  // const aviationSelectionStore = useAviationSelectionStore()
  // aviationSelectionStore.clearSelected()
}

/**
 * 清除所有高亮
 */
export function clearAllBillboardHighlight(): void {
  clearHoveredBillboardHighlight()
  clearSelectedBillboardHighlight()
}

// 暴露实例获取方法（供外部校验用，如判断是否选中）
export function getSelectedBillboard(): Cesium.Billboard | null {
  return selectedBillboard
}

export function getHoveredBillboard(): Cesium.Billboard | null {
  return hoveredBillboard
}
