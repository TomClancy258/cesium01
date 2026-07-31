import { watch, type WatchStopHandle } from 'vue'
import type * as THREE from 'three'
import { useStationEquipmentStore } from '@/stores/station-equipment'
import {
  STATUS_HIGHLIGHT_COLOR,
  type EquipmentStatus,
  type StationRow,
} from '@/views/intelligent_water_pump_station/types/station-equipment'

type EmissiveMaterial = THREE.Material & {
  emissive?: THREE.Color
  emissiveIntensity?: number
}

/**
 * 订阅模拟 WS（Pinia），按 name 把状态色落到三维。
 */
export function useStationRealtime(objectById: Map<string, THREE.Object3D>) {
  const store = useStationEquipmentStore()
  let stopWatch: WatchStopHandle | null = null

  const applyStatusColor = (object: THREE.Object3D, status: EquipmentStatus): void => {
    const color = STATUS_HIGHLIGHT_COLOR[status]
    object.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return
      const mesh = child as THREE.Mesh
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      materials.forEach((material) => {
        const mat = material as EmissiveMaterial
        if (!mat.emissive) return
        if (color === null) {
          mat.emissive.setHex(0x000000)
          mat.emissiveIntensity = 1
        } else {
          mat.emissive.setHex(color)
          mat.emissiveIntensity = status === 'fault' ? 0.9 : 0.65
        }
      })
    })
  }

  const eachRow = (fn: (row: StationRow) => void): void => {
    ;[
      store.reservoirMap,
      store.coolingTowerMap,
      store.coolingTubeMap,
      store.streetLightMap,
      store.pressureRegulatingTowerMap,
      store.mixingTankMap,
      store.houserMap,
      store.verticalPressurizedTankBodyMap,
    ].forEach((mapRef) => {
      mapRef.forEach((row) => fn(row))
    })
  }

  const syncStatusToModels = (): void => {
    eachRow((row) => {
      const object = objectById.get(row.name)
      if (!object) return
      if (row.name === store.selectedId || row.name === store.hoveredId) return
      applyStatusColor(object, row.status)
    })
  }

  const start = (): void => {
    store.open()
    stopWatch?.()
    stopWatch = watch(
      () => store.tick,
      () => {
        syncStatusToModels()
      },
      { immediate: true },
    )
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
    syncStatusToModels,
  }
}
