import * as Cesium from 'cesium'
import { useRegionSelectionStore } from '@/stores/region-selection'
import type { DrawingToolSelectedData } from '@/views/aviation-situation/types/shared'
import type {
  ControlZoneRegionSelectedData,
  RegionSelectedData,
} from '@/views/aviation-situation/types/region-selection'
import { clearSelectedDrawingToolHighlight } from '@/views/aviation-situation/composables/highlight-manager/drawing-tool-highlight-manager'
import {
  clearSelectedControlZoneHighlight,
  highlightControlZoneOnSelect,
} from '@/views/aviation-situation/composables/highlight-manager/control-zone-highlight-manager'
import type { ControlZoneHighlightConfig } from '@/views/aviation-situation/types/control-zone'
import { CONTROL_ZONE_INTERACTION_OUTLINE } from '@/views/aviation-situation/composables/control-zone/control-zone-constants'

const isSameDrawingToolSelection = (
  selected: RegionSelectedData | null,
  data: DrawingToolSelectedData,
): boolean => {
  if (!selected || selected.sourceType === 'controlZone') return false
  return selected.dataSourceName === data.dataSourceName && selected.id === data.id
}

const isSameControlZoneSelection = (
  selected: RegionSelectedData | null,
  data: ControlZoneRegionSelectedData,
): boolean => {
  return (
    selected !== null &&
    selected.sourceType === 'controlZone' &&
    selected.id === data.id
  )
}

/** 写入测绘框选/测距选中，并清管控区选中高亮（区域轨互斥） */
export const selectDrawingToolRegion = (data: DrawingToolSelectedData): void => {
  clearSelectedControlZoneHighlight()

  const regionSelectionStore = useRegionSelectionStore()
  if (!isSameDrawingToolSelection(regionSelectionStore.selected, data)) {
    regionSelectionStore.setSelected(data)
  }
}

/** 选中管控区，并清测绘图形选中高亮（区域轨互斥） */
export const selectControlZoneRegion = (
  entity: Cesium.Entity,
  data: ControlZoneRegionSelectedData,
): void => {
  clearSelectedDrawingToolHighlight()

  const highlightConfig: ControlZoneHighlightConfig = {
    polygon: {
      outlineColor: CONTROL_ZONE_INTERACTION_OUTLINE.select,
    },
  }
  highlightControlZoneOnSelect(entity, highlightConfig)

  const regionSelectionStore = useRegionSelectionStore()
  if (!isSameControlZoneSelection(regionSelectionStore.selected, data)) {
    regionSelectionStore.setSelected(data)
  }
}

/** 清空区域轨选中（store + 高亮） */
export const clearSelectedRegion = (): void => {
  const regionSelectionStore = useRegionSelectionStore()
  const selected = regionSelectionStore.selected

  if (selected?.sourceType === 'controlZone') {
    clearSelectedControlZoneHighlight()
  } else if (selected?.sourceType === 'distanceMeasurement'||
    selected?.sourceType === 'polygonSpatialSelection'||
    selected?.sourceType === 'circleSpatialSelection'||
    selected?.sourceType === 'hemisphereSpatialSelection') {
    clearSelectedDrawingToolHighlight()
  }

  regionSelectionStore.clearSelected()
}
