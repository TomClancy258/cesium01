// highlight-manager/osm-building-highlight-manager.ts
import * as Cesium from 'cesium'
import { OSMBuildingHighlightConfig } from '@/views/aviation-situation/types/osm-building'
import {
  clearAllDrawingToolHighlight
} from '@/views/aviation-situation/composables/highlight-manager/drawing-tool-highlight-manager'

let hoveredFeature: Cesium.Cesium3DTileFeature | null = null //hovered = 「当前正处于悬停状态的」
let selectedFeature: Cesium.Cesium3DTileFeature | null = null
const hoveredOriginalColor = new Cesium.Color()
const selectedOriginalColor = new Cesium.Color()

export function highlightOSMBuildingOnHover(
  feature: Cesium.Cesium3DTileFeature,
  config: OSMBuildingHighlightConfig,
) {
  if (selectedFeature === feature) return
  if (hoveredFeature === feature) return

  if (hoveredFeature) {
    // 若上一个 hover 项未被选中，才恢复默认
    if (hoveredFeature !== selectedFeature) {
      clearHoveredOSMBuildingHighlight()
    }
  }

  hoveredFeature = feature
  Cesium.Color.clone(feature.color, hoveredOriginalColor)
  feature.color = config.color
}

export function highlightOSMBuildingOnSelect(
  feature: Cesium.Cesium3DTileFeature,
  config: OSMBuildingHighlightConfig,
) {
  // 已选中同一建筑时直接返回，避免把选中色误存为原始色
  if (selectedFeature === feature) return

  if (selectedFeature) {
    clearSelectedOSMBuildingHighlight()
  }

  if (hoveredFeature === feature) {
    // 从 hover 切到 select：真正原始色在 hoveredOriginalColor 里
    Cesium.Color.clone(hoveredOriginalColor, selectedOriginalColor)
    hoveredFeature = null
  } else {
    Cesium.Color.clone(feature.color, selectedOriginalColor)
  }

  selectedFeature = feature
  feature.color = config.color
}

export function clearHoveredOSMBuildingHighlight() {
  if (hoveredFeature && hoveredFeature !== selectedFeature) {
    hoveredFeature.color = hoveredOriginalColor
    hoveredFeature = null
  }
}
export function clearSelectedOSMBuildingHighlight() {
  if (selectedFeature) {
    selectedFeature.color = selectedOriginalColor
    selectedFeature = null
  }
}

export function clearAllOSMBuildingHighlight(){
  clearHoveredOSMBuildingHighlight()
  clearSelectedOSMBuildingHighlight()
}
