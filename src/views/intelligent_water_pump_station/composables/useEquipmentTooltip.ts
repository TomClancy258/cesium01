import { computed } from 'vue'
import { useStationEquipmentStore } from '@/stores/station-equipment'
import type { EquipmentSource, StationRow, TooltipPosition } from '../types/station-equipment'

/** hover 行 + 可见性；定位样式由各 Tooltip 用 props.position 计算 */
export function useEquipmentTooltip<T extends StationRow>(source: EquipmentSource) {
  const store = useStationEquipmentStore()

  const row = computed(() => {
    if (store.hovered?.source !== source) return null
    return (store.hoveredRow as T | null) ?? null
  })

  const visible = computed(() => row.value != null)

  const toTooltipStyle = (position: TooltipPosition) => ({
    left: `${position.left}px`,
    top: `${position.top}px`,
  })

  return { row, visible, toTooltipStyle }
}
