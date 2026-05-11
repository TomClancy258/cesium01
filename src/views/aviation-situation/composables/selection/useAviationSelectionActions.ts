import { useAviationSelectionStore } from '@/stores/aviation-selection'
import { clearSelectedBillboardHighlight } from '@/views/aviation-situation/composables/highlight-manager/billboard-highlight-manager'
import { clearSelectedSatelliteHighlight } from '@/views/aviation-situation/composables/highlight-manager/satellite-highlight-manager'

export const clearSelectedAviation = (): void => {
  const aviationSelectionStore = useAviationSelectionStore()
  const selected = aviationSelectionStore.selected

  if (selected?.sourceType === 'aircraft' || selected?.sourceType === 'airport') {
    clearSelectedBillboardHighlight()
  } else if (selected?.sourceType === 'satellite') {
    clearSelectedSatelliteHighlight()
  }

  aviationSelectionStore.clearSelected()
  aviationSelectionStore.clearLastSelectedIcao24()
}
