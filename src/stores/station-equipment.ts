import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import {
  rowsToMap,
  STATION_FRAME_COUNT,
  stationEquipments,
} from '@/views/intelligent_water_pump_station/mock/station-tables'
import type {
  CoolingTowerRow,
  CoolingTubeRow,
  EquipmentSource,
  HouseRow,
  MixingTankRow,
  PressureRegulatingTowerRow,
  ReservoirRow,
  StationRow,
  StationWsPayload,
  StreetLightRow,
  VerticalPressurizedTankBodyRow,
} from '@/views/intelligent_water_pump_station/types/station-equipment'
import { resolveTableKeyById } from '@/views/intelligent_water_pump_station/types/station-equipment'

/** 模拟 WS 推送间隔 */
export const STATION_WS_INTERVAL_MS = 5000

export const useStationEquipmentStore = defineStore('stationEquipment', () => {
  const tick = ref(0)
  const connected = ref(false)
  const currentPayload = ref<StationWsPayload>(stationEquipments[0])

  const activeTableKey = ref<EquipmentSource>('reservoir')
  const selectedId = ref<string | null>(null)
  const hoveredId = ref<string | null>(null)

  const reservoirMap = shallowRef<Map<string, ReservoirRow>>(new Map())
  const coolingTowerMap = shallowRef<Map<string, CoolingTowerRow>>(new Map())
  const coolingTubeMap = shallowRef<Map<string, CoolingTubeRow>>(new Map())
  const streetLightMap = shallowRef<Map<string, StreetLightRow>>(new Map())
  const pressureRegulatingTowerMap = shallowRef<Map<string, PressureRegulatingTowerRow>>(
    new Map(),
  )
  const mixingTankMap = shallowRef<Map<string, MixingTankRow>>(new Map())
  const houserMap = shallowRef<Map<string, HouseRow>>(new Map())
  const verticalPressurizedTankBodyMap = shallowRef<
    Map<string, VerticalPressurizedTankBodyRow>
  >(new Map())

  let timer: ReturnType<typeof setInterval> | null = null

  const selectedRow = computed(() => {
    if (!selectedId.value) return null
    return findRowByName(selectedId.value)
  })

  const hoveredRow = computed(() => {
    if (!hoveredId.value) return null
    return findRowByName(hoveredId.value)
  })

  /** —— 通过 store 方法改 Map（不要在外面直接赋值） —— */
  function setReservoirMap(data: ReservoirRow[]): void {
    reservoirMap.value = rowsToMap(data)
  }

  function setCoolingTowerMap(data: CoolingTowerRow[]): void {
    coolingTowerMap.value = rowsToMap(data)
  }

  function setCoolingTubeMap(data: CoolingTubeRow[]): void {
    coolingTubeMap.value = rowsToMap(data)
  }

  function setStreetLightMap(data: StreetLightRow[]): void {
    streetLightMap.value = rowsToMap(data)
  }

  function setPressureRegulatingTowerMap(data: PressureRegulatingTowerRow[]): void {
    pressureRegulatingTowerMap.value = rowsToMap(data)
  }

  function setMixingTankMap(data: MixingTankRow[]): void {
    mixingTankMap.value = rowsToMap(data)
  }

  function setHouserMap(data: HouseRow[]): void {
    houserMap.value = rowsToMap(data)
  }

  function setVerticalPressurizedTankBodyMap(data: VerticalPressurizedTankBodyRow[]): void {
    verticalPressurizedTankBodyMap.value = rowsToMap(data)
  }

  function applyPayload(packets: StationWsPayload): void {
    currentPayload.value = packets
    packets.forEach((packet) => {
      switch (packet.source) {
        case 'reservoir':
          setReservoirMap(packet.data as ReservoirRow[])
          break
        case 'coolingTower':
          setCoolingTowerMap(packet.data as CoolingTowerRow[])
          break
        case 'coolingTube':
          setCoolingTubeMap(packet.data as CoolingTubeRow[])
          break
        case 'streetLight':
          setStreetLightMap(packet.data as StreetLightRow[])
          break
        case 'pressureRegulatingTower':
          setPressureRegulatingTowerMap(packet.data as PressureRegulatingTowerRow[])
          break
        case 'mixingTank':
          setMixingTankMap(packet.data as MixingTankRow[])
          break
        case 'house':
          setHouserMap(packet.data as HouseRow[])
          break
        case 'verticalPressurizedTankBody':
          setVerticalPressurizedTankBodyMap(packet.data as VerticalPressurizedTankBodyRow[])
          break
        default:
          break
      }
    })
  }

  function applyFrame(frameIndex: number): void {
    const index = ((frameIndex % STATION_FRAME_COUNT) + STATION_FRAME_COUNT) % STATION_FRAME_COUNT
    tick.value = index
    applyPayload(stationEquipments[index])
  }

  function findRowByName(name: string): StationRow | null {
    return (
      reservoirMap.value.get(name) ||
      coolingTowerMap.value.get(name) ||
      coolingTubeMap.value.get(name) ||
      streetLightMap.value.get(name) ||
      pressureRegulatingTowerMap.value.get(name) ||
      mixingTankMap.value.get(name) ||
      houserMap.value.get(name) ||
      verticalPressurizedTankBodyMap.value.get(name) ||
      null
    )
  }

  function open(): void {
    if (timer) return
    connected.value = true
    applyFrame(0)
    timer = setInterval(() => {
      applyFrame(tick.value + 1)
    }, STATION_WS_INTERVAL_MS)
  }

  function close(): void {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    connected.value = false
  }

  function setHoveredId(id: string | null): void {
    hoveredId.value = id
  }

  function setSelectedId(id: string | null): void {
    selectedId.value = id
    if (id) {
      const key = resolveTableKeyById(id)
      if (key) activeTableKey.value = key
    }
  }

  function setActiveTableKey(key: EquipmentSource): void {
    activeTableKey.value = key
  }

  // 初始写入第 0 帧
  applyFrame(0)

  return {
    tick,
    connected,
    currentPayload,
    activeTableKey,
    selectedId,
    hoveredId,
    selectedRow,
    hoveredRow,
    reservoirMap,
    coolingTowerMap,
    coolingTubeMap,
    streetLightMap,
    pressureRegulatingTowerMap,
    mixingTankMap,
    houserMap,
    verticalPressurizedTankBodyMap,
    setReservoirMap,
    setCoolingTowerMap,
    setCoolingTubeMap,
    setStreetLightMap,
    setPressureRegulatingTowerMap,
    setMixingTankMap,
    setHouserMap,
    setVerticalPressurizedTankBodyMap,
    applyPayload,
    applyFrame,
    findRowByName,
    open,
    close,
    setHoveredId,
    setSelectedId,
    setActiveTableKey,
  }
})
