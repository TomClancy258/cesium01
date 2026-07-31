import { watch, type WatchStopHandle } from 'vue'
import { useStationEquipmentStore } from '@/stores/station-equipment'
import {
  STATION_FRAME_COUNT,
  stationEquipments,
} from '@/views/intelligent_water_pump_station/mock/station-tables'

/**
 * 监听模拟 WS 的 index，把对应帧写入各设备 Map。
 */
export function useStationRealtime() {
  const store = useStationEquipmentStore()
  let stopWatch: WatchStopHandle | null = null

  const applyFrameByIndex = (rawIndex: number): void => {
    if (rawIndex < 0 || stationEquipments.length === 0) return
    const frameIndex =
      ((rawIndex % STATION_FRAME_COUNT) + STATION_FRAME_COUNT) % STATION_FRAME_COUNT
    const frame = stationEquipments[frameIndex]
    if (!frame) return
    store.applyPayload(frame)
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
