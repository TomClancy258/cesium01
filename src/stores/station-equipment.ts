import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import {
  rowsToMap,
  STATION_FRAME_COUNT,
} from '@/views/intelligent_water_pump_station/mock/station-tables'
import type {
  CoolingTowerRow,
  CoolingTubeRow,
  EquipmentSelection,
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

/** 模拟 WS 推送间隔（与 simulate-websocket 一致） */
export const STATION_WS_INTERVAL_MS = 5000

/**
 * 设备表数据 + 选中态。
 * 模拟 WS 只维护 index（同 simulate-websocket），帧数据由 useStationRealtime 按 index 写入 Map。
 */
export const useStationEquipmentStore = defineStore('stationEquipment', () => {
  /** 模拟推送下标，从 -1 起，open 后变为 0、1、2… */
  const index = ref(-1)
  const connected = ref(false)
  const currentPayload = ref<StationWsPayload | null>(null)

  const activeTableKey = ref<EquipmentSource>('reservoir')
  /** 对齐 aviation-selection：只存身份，业务行走各 Map */
  const hovered = ref<EquipmentSelection | null>(null)
  const selected = ref<EquipmentSelection | null>(null)

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

  const findRowBySelection = (selection: EquipmentSelection | null): StationRow | null => {
    if (!selection) return null
    switch (selection.source) {
      case 'reservoir':
        return reservoirMap.value.get(selection.name) ?? null
      case 'coolingTower':
        return coolingTowerMap.value.get(selection.name) ?? null
      case 'coolingTube':
        return coolingTubeMap.value.get(selection.name) ?? null
      case 'streetLight':
        return streetLightMap.value.get(selection.name) ?? null
      case 'pressureRegulatingTower':
        return pressureRegulatingTowerMap.value.get(selection.name) ?? null
      case 'mixingTank':
        return mixingTankMap.value.get(selection.name) ?? null
      case 'house':
        return houserMap.value.get(selection.name) ?? null
      case 'verticalPressurizedTankBody':
        return verticalPressurizedTankBodyMap.value.get(selection.name) ?? null
      default:
        return null
    }
  }

  /** Map 更新后自动刷新，tooltip 直接绑此 computed 即可 */
  const hoveredRow = computed(() => findRowBySelection(hovered.value))
  const selectedRow = computed(() => findRowBySelection(selected.value))

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

  /** 仅推进 index（在 [0, STATION_FRAME_COUNT-1] 循环），不写业务 Map */
  function open(): void {
    if (timer) return
    connected.value = true
    index.value++
    timer = setInterval(() => {
      index.value = (index.value + 1) % STATION_FRAME_COUNT
    }, STATION_WS_INTERVAL_MS)
  }

  function close(): void {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    index.value = -1
    connected.value = false
  }

  function setHovered(selection: EquipmentSelection | null): void {
    hovered.value = selection
  }

  function clearHovered(): void {
    hovered.value = null
  }

  function setSelected(selection: EquipmentSelection | null): void {
    selected.value = selection
    if (selection) activeTableKey.value = selection.source
  }

  function clearSelected(): void {
    selected.value = null
  }

  function setActiveTableKey(key: EquipmentSource): void {
    activeTableKey.value = key
  }

  return {
    index,
    connected,
    currentPayload,
    activeTableKey,
    hovered,
    selected,
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
    findRowBySelection,
    open,
    close,
    setHovered,
    clearHovered,
    setSelected,
    clearSelected,
    setActiveTableKey,
  }
})
