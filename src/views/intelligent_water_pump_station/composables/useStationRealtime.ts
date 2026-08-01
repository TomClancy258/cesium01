import { watch, type WatchStopHandle } from 'vue'
import { useStationEquipmentStore } from '@/stores/station-equipment'
import {
  STATION_FRAME_COUNT,
  stationEquipments,
} from '@/views/intelligent_water_pump_station/mock/station-tables'
import type { StationWsPayload } from '@/views/intelligent_water_pump_station/types/station-equipment'

type ApplyStatusFromPayload = (packets: StationWsPayload) => void

/**
 * 监听模拟 WS 的 index，把对应帧写入各设备 Map，并同步模型状态色。
 * index 已由 store 约束在 [0, STATION_FRAME_COUNT-1]，此处直接作帧下标。
 * tooltip 正文绑 store.hoveredRow：applyPayload 换 Map 后自动更新，无需再 mitt。
 */
export function useStationRealtime(applyStatusFromPayload?: ApplyStatusFromPayload) {
  const store = useStationEquipmentStore()
  let stopWatch: WatchStopHandle | null = null

  const applyFrameByIndex = (index: number): void => {
    if (index < 0 || index >= STATION_FRAME_COUNT) return
    const frame = stationEquipments[index]
    if (!frame) return
    store.applyPayload(frame)
    applyStatusFromPayload?.(frame)
  }

  const start = (): void => {
    stopWatch?.()
    stopWatch = watch(
      () => store.index,
      (newIndex) => {
        applyFrameByIndex(newIndex)
      },
    )
    store.open()
  }

  const stop = (): void => {
    stopWatch?.()
    stopWatch = null
    store.close()
  }

  return {
    store,
    start,
    stop,
  }
}
